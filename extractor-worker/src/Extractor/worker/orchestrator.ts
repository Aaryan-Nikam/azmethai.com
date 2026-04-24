/**
 * Document Processing Orchestrator (Worker)
 * 
 * Subscribes to the BullMQ queue and processes documents.
 * Adheres strictly to the Explicit Error State Machine:
 * - Updates document status to 'processing'
 * - On failure: sets status to 'failed', records failure_reason
 * - On success: creates ae_obligations, routes to ae_review_queue based on confidence
 */

import { Worker, Job } from 'bullmq';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { Langfuse } from 'langfuse';

import { redisConnection, DocumentJobPayload } from './queue.ts';
import { parseDocument } from '../parsers/pdf-parser.ts';
import { extractVendorContract } from '../extraction/vendor-contract.extractor.ts';
import { supabase } from '../lib/supabase.ts';
import { CONFIDENCE } from '../validation/vendor-contract.schema.ts';

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com'
});

export const worker = new Worker<DocumentJobPayload>(
  'document-extraction',
  async (job: Job<DocumentJobPayload>) => {
    const { documentId, orgId, storagePath, originalFilename } = job.data;
    const tempFilePath = join(tmpdir(), `${uuidv4()}-${originalFilename}`);

    const trace = langfuse.trace({
      name: 'document-worker-pipeline',
      metadata: { documentId, orgId, jobId: job.id }
    });

    try {
      // 1. Mark status as processing
      await supabase
        .from('ae_documents')
        .update({ processing_status: 'processing' })
        .eq('id', documentId);

      // 2. Securely download the document buffer from Supabase Storage
      const downloadTrace = trace.span({ name: 'download_document' });
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('contracts') // Assuming bucket name is contracts, can be parameterized
        .download(storagePath);
      
      if (downloadError || !fileData) {
        throw new Error(`Failed to download from storage: ${downloadError?.message}`);
      }
      const buffer = Buffer.from(await fileData.arrayBuffer());
      await writeFile(tempFilePath, buffer);
      downloadTrace.end();

      // 3. Stage 1/2 PDF Parsing
      const parseTrace = trace.span({ name: 'parse_document' });
      const parsed = await parseDocument(tempFilePath);
      parseTrace.end({ output: { stage: parsed.stage, qualityScore: parsed.qualityScore, pageCount: parsed.pageCount } });

      // Update document with stage 1 quality score
      await supabase
        .from('ae_documents')
        .update({ stage1_quality_score: parsed.qualityScore, page_count: parsed.pageCount })
        .eq('id', documentId);

      // 4. Stage 3 Claude Extraction
      // extractVendorContract creates its own Langfuse generation
      const { result, log } = await extractVendorContract(parsed.text, documentId);

      if (!result || !log.success) {
        throw new Error(`Claude Extraction Failed: ${log.errorMessage}`);
      }

      // 5. Persist to Database 
      const persistTrace = trace.span({ name: 'persist_database' });

      // Build main obligation row
      const autoRenewal = result.extraction.auto_renewal?.value;
      const counterparty = result.extraction.counterparty_name?.value;
      const contractValue = result.extraction.contract_value_gbp?.value;
      const expiry = result.extraction.expiry_date?.value;
      
      let noticeDeadline = null;
      if (expiry && autoRenewal?.exists && autoRenewal?.notice_period_days) {
        const expiryDate = new Date(expiry);
        expiryDate.setDate(expiryDate.getDate() - autoRenewal.notice_period_days);
        noticeDeadline = expiryDate.toISOString().split('T')[0];
      }

      const { data: obligation, error: obsError } = await supabase
        .from('ae_obligations')
        .insert({
          org_id: orgId,
          document_id: documentId,
          obligation_type: 'vendor_contract',
          due_date: expiry,
          notice_deadline: noticeDeadline,
          contract_value_gbp: contractValue,
          counterparty_name: counterparty,
          confidence_score: result.summary.overall_confidence,
          extraction_source_text: JSON.stringify(result.extraction),
          prompt_version: 'v1.0.0', // Update when Langfuse Prompt Mgmt is wired
          status: 'active'
        })
        .select()
        .single();
        
      if (obsError) throw new Error(`Obligation Insert Failed: ${obsError.message}`);

      // Insert details
      const slas = result.extraction.sla_commitments?.value || [];
      const escalations = result.extraction.price_escalation_triggers?.value || [];
      
      let earliestTermination = null; // Can parse from convenience/notice array if needed

      await supabase
        .from('ae_obligation_contract_details')
        .insert({
          obligation_id: obligation.id,
          auto_renewal_exists: autoRenewal?.exists || false,
          notice_period_days: autoRenewal?.notice_period_days || null,
          sla_commitments: slas,
          price_escalation_trigger: escalations.length > 0 ? escalations[0].trigger_type : null,
          termination_rights: JSON.stringify(result.extraction.termination_rights?.value),
          governing_law: result.extraction.governing_law?.value
        });

      // Insert into human review queue if confidence < 0.7
      for (const routed of result.routing) {
        if (routed.decision === 'human_review') {
          // Find original field payload structure
          const fieldPayload = (result.extraction as any)[routed.field];
          
          await supabase
            .from('ae_review_queue')
            .insert({
              org_id: orgId,
              document_id: documentId,
              field_name: routed.field,
              extracted_value: JSON.stringify(routed.value),
              confidence_score: routed.confidence,
              status: 'pending'
            });
        }
      }

      // 6. Complete Job
      await supabase
        .from('ae_documents')
        .update({ processing_status: result.summary.document_processable ? 'done' : 'review_required' })
        .eq('id', documentId);

      persistTrace.end();
      trace.update({ metadata: { status: 'success' } });
      await langfuse.flushAsync();

      return { success: true, processedFields: result.summary.total_fields };

    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      
      // Update as failed so UX is transparent (Error State Machine compliance)
      await supabase
        .from('ae_documents')
        .update({ 
          processing_status: 'failed',
          failure_reason: errMessage.substring(0, 500)
        })
        .eq('id', documentId);
      
      trace.update({ metadata: { error: errMessage, status: 'failed' } });
      await langfuse.flushAsync();

      // Rethrow so BullMQ handles retries and dead-lettering
      throw error;

    } finally {
      // Cleanup
      try {
        await unlink(tempFilePath);
      } catch (e) {
        // ignore unlink error
      }
    }
  },
  { connection: redisConnection }
);

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error ${err.message}`);
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

console.log('[Worker] Connected and listening for document extraction jobs...');
