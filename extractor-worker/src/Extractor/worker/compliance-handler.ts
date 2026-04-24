// packages/extractor/src/worker/compliance-handler.ts

import { createClient } from '@supabase/supabase-js';
import type { SecurityReconciliationResult } from '../reconciliation/security-reconciler.ts';

const supabase = createClient(
  process.env.SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function handleComplianceResult(
  statusRecordId: string,
  tenantId: string,
  result: SecurityReconciliationResult
): Promise<void> {

  // 1. Lock breaches directly into absolute manual review gating
  for (const b of result.breaches) {
    const { error: breachError } = await supabase.from('ae_compliance_breaches').insert({
      status_record_id: statusRecordId,
      tenant_id: tenantId,
      breach_type: b.breach_type,
      required_value: b.threshold_value,
      actual_value: b.actual_value,
      evidence: b.evidence,
      status: 'pending_review' // Strict guardrail: Prevent systemic auto-action
    });
    
    if (breachError) throw new Error(`Failed to create compliance breach lock: ${breachError.message}`);
  }

  // 2. Track completion in immutable Audit boundaries
  const { error: auditError } = await supabase.from('ae_audit_log').insert({
    tenant_id: tenantId,
    actor_type: 'worker',
    entity_type: 'ae_vendor_security_status',
    entity_id: statusRecordId,
    action: 'compliance_evaluation_completed',
    after_state: { 
      status: result.status, 
      breach_count: result.breaches.length
    }
  });

  if (auditError) throw new Error(`Failed to write compliance audit bound: ${auditError.message}`);
}
