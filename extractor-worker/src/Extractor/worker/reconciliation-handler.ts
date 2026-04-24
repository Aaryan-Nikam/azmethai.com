// packages/extractor/src/worker/reconciliation-handler.ts

import { createClient } from '@supabase/supabase-js';
import type { ReconciliationResult } from '../reconciliation/sla-reconciler.ts';

const supabase = createClient(
  process.env.SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function handleReconciliationResult(
  invoiceId: string,
  tenantId: string,
  result: ReconciliationResult
): Promise<void> {

  // 1. Update overall invoice status based on outcome
  const { error: invoiceError } = await supabase
    .from('ae_invoices')
    .update({
      reconciliation_status: result.status === 'compliant' ? 'compliant' : 'discrepancy_found',
      reconciled_at: new Date().toISOString()
    })
    .eq('id', invoiceId);
    
  if (invoiceError) throw new Error(`Failed to update invoice: ${invoiceError.message}`);

  // 2. Insert any anomalies as DISPUTES directly locked to 'pending_review'
  for (const d of result.discrepancies) {
    const { error: disputeError } = await supabase.from('ae_invoice_disputes').insert({
      invoice_id: invoiceId,
      tenant_id: tenantId,
      discrepancy_type: d.discrepancy_type,
      expected_amount: d.expected_amount,
      invoiced_amount: d.invoiced_amount,
      evidence: d.evidence,
      contract_clause: d.contract_clause,
      status: 'pending_review' // Strict guardrail: never auto-dispute
    });
    
    if (disputeError) throw new Error(`Failed to create dispute lock: ${disputeError.message}`);
  }

  // 3. Immutably track the operation in the Audit Log
  const { error: auditError } = await supabase.from('ae_audit_log').insert({
    tenant_id: tenantId,
    actor_type: 'worker',
    entity_type: 'ae_invoices',
    entity_id: invoiceId,
    action: 'reconciliation_completed',
    after_state: { 
      status: result.status, 
      discrepancy_count: result.discrepancies.length,
      warnings_count: result.warnings.length
    }
  });

  if (auditError) throw new Error(`Failed to write reconciliation audit bound: ${auditError.message}`);
}
