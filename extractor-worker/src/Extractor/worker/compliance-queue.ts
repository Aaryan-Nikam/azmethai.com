// packages/extractor/src/worker/compliance-queue.ts

import { Worker, Queue } from 'bullmq';
import { extractComplianceData } from '../extraction/compliance.extractor.ts';
import { reconcileVendorSecurity } from '../reconciliation/security-reconciler.ts';
import { handleSecurityReconciliationResult } from './security-breach-handler.ts';

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379'
};

export const complianceQueue = new Queue('compliance-extraction-queue', { connection });

export const complianceWorker = new Worker('compliance-extraction-queue', async job => {
  console.log(`[ComplianceWorker] Processing extraction job: ${job.id}`);

  try {
    const { documentText, artifactId, vendorData, tenantId } = job.data;

    const extraction = await extractComplianceData(documentText, artifactId);
    
    if (!extraction.success || !extraction.result) {
      throw new Error('Compliance Extractor generation failure: ' + extraction.errorMessage);
    }

    // Mapped explicitly into arrays bridging the Reconciler rules
    const statuses = [
      {
        id: 'virt_1',
        status_type: 'soc2_type_ii',
        valid_until: extraction.result.soc2_expiry_date.value as string | null,
        days_until_expiry: null, // PG evaluates this
        numeric_value: null,
        compliance_threshold: null,
        current_value: null,
        is_compliant: null,
        cert_issuer: extraction.result.soc2_auditor.value as string | null,
        cert_reference: null
      },
      {
        id: 'virt_2',
        status_type: 'gdpr_dpa',
        valid_until: null,
        days_until_expiry: null,
        numeric_value: null,
        compliance_threshold: null,
        current_value: extraction.result.gdpr_dpa_signed.value ? 'true' : 'false',
        is_compliant: null,
        cert_issuer: null,
        cert_reference: null
      },
      {
        id: 'virt_3',
        status_type: 'cyber_insurance',
        valid_until: extraction.result.cyber_insurance_expiry.value as string | null,
        days_until_expiry: null,
        numeric_value: extraction.result.cyber_insurance_limit_gbp.value as number | null,
        compliance_threshold: '1000000', // Mocked enterprise bound
        current_value: null,
        is_compliant: null,
        cert_issuer: extraction.result.cyber_insurance_provider.value as string | null,
        cert_reference: null
      }
    ];

    const reconciliation = reconcileVendorSecurity(vendorData, statuses);

    await handleSecurityReconciliationResult(vendorData.id, tenantId, reconciliation);

    return reconciliation;

  } catch (err: any) {
    console.error(`[ComplianceWorker] Job failed: ${err.message}`);
    throw err; // Throws back into BullMQ for native Retry logic 
  }
}, { 
  connection,
  concurrency: 5
});

complianceWorker.on('failed', (job, err) => {
  if (job) {
    console.log(`[ComplianceWorker] ${job.id} definitively failed after retries: ${err.message}`);
  }
});
