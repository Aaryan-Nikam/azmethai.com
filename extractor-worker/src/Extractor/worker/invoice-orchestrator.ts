/**
 * Invoice Processing Orchestrator (Worker)
 * 
 * Subscribes to the BullMQ 'invoice-processing' queue.
 * Parses incoming invoice PDFs, extracts data, and runs it through the SLA Reconciler.
 * Adheres strictly to the Explicit Error State Machine.
 */

import { Worker, Job } from 'bullmq';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { Langfuse } from 'langfuse';

import { redisConnection, InvoiceJobPayload } from './queue.ts';
import { parseDocument } from '../parsers/pdf-parser.ts';
import { extractInvoiceData } from '../extraction/invoice.extractor.ts';
import { runReconciliation } from '../reconciliation/sla-reconciler.ts';
import { supabase } from '../lib/supabase.ts';

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com'
});

export const invoiceWorker = new Worker<InvoiceJobPayload>(
  'invoice-processing',
  async (job: Job<InvoiceJobPayload>) => {
    const { invoiceId, obligationId, orgId, storagePath, originalFilename } = job.data;
    const tempFilePath = join(tmpdir(), `${uuidv4()}-${originalFilename}`);

    const trace = langfuse.trace({
      name: 'invoice-worker-pipeline',
      metadata: { invoiceId, obligationId, orgId, jobId: job.id }
    });

    try {
      // 1. Mark status as processing (pending in schema)
      await supabase
        .from('ae_invoices')
        .update({ status: 'pending' }) // could add a 'processing' state to schema later if needed
        .eq('id', invoiceId);

      // 2. Download PDF
      const downloadTrace = trace.span({ name: 'download_invoice' });
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('invoices')
        .download(storagePath);
      
      if (downloadError || !fileData) {
        throw new Error(`Failed to download invoice from storage: ${downloadError?.message}`);
      }
      const buffer = Buffer.from(await fileData.arrayBuffer());
      await writeFile(tempFilePath, buffer);
      downloadTrace.end();

      // 3. Stage 1/2 PDF Parsing
      const parseTrace = trace.span({ name: 'parse_invoice' });
      const parsed = await parseDocument(tempFilePath);
      parseTrace.end({ output: { stage: parsed.stage, qualityScore: parsed.qualityScore } });

      // 4. Extraction
      const { result, success, errorMessage } = await extractInvoiceData(parsed.text, invoiceId);

      if (!success || !result) {
        throw new Error(`Invoice Extraction Failed: ${errorMessage}`);
      }

      // 5. Update invoice raw properties
      await supabase
        .from('ae_invoices')
        .update({
          invoice_number: result.invoice_number,
          total_amount: result.total_amount_due,
          applied_credits: result.sla_credit_amount ?? 0,
          extracted_data: JSON.stringify(result)
        })
        .eq('id', invoiceId);

      // 6. Run Reconciliation
      const reconcileTrace = trace.span({ name: 'reconcile_sla' });
      const report = await runReconciliation(result, obligationId);
      reconcileTrace.end({ output: report });

      // 7. Persist Disputes if any
      if (!report.isValid && report.disputes.length > 0) {
        for (const dispute of report.disputes) {
          
          // Generate a simplistic deterministic draft letter for the MVP
          const draftLetter = `Dear Vendor,\n\nWe are formally disputing an anomaly on Invoice ${result.invoice_number} based on the bounds of our contract.\nIssue: ${dispute.description}\n\nPlease issue a credit note or a revised invoice corresponding to ${Math.abs(dispute.amount)}.\n\nKind regards,\nAzmeth AI Employee`;

          await supabase
            .from('ae_invoice_disputes')
            .insert({
              org_id: orgId,
              invoice_id: invoiceId,
              dispute_type: dispute.type,
              calculated_discrepancy_amount: Math.abs(dispute.amount),
              draft_dispute_letter: draftLetter,
              status: 'open'
            });
        }
        
        await supabase
          .from('ae_invoices')
          .update({ status: 'disputed' })
          .eq('id', invoiceId);

      } else {
        await supabase
          .from('ae_invoices')
          .update({ status: 'reconciled' })
          .eq('id', invoiceId);
      }

      trace.update({ metadata: { status: 'success' } });
      await langfuse.flushAsync();

      return { success: true, reconciled: true, disputesFound: report.disputes.length };

    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      
      // Update as failed to adhere to explicit error state machine
      await supabase
        .from('ae_invoices')
        .update({ status: 'failed' })
        .eq('id', invoiceId);
      
      trace.update({ metadata: { error: errMessage, status: 'failed' } });
      await langfuse.flushAsync();

      // Rethrow for dead-letter queuing
      throw error;

    } finally {
      // Cleanup
      try {
        await unlink(tempFilePath);
      } catch (e) {
        // ignore
      }
    }
  },
  { connection: redisConnection }
);

invoiceWorker.on('failed', (job, err) => {
  console.error(`[Invoice Worker] Job ${job?.id} failed with error ${err.message}`);
});

console.log('[Invoice Worker] Connected and listening for invoice extraction jobs...');
