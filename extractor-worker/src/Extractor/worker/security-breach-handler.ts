// packages/extractor/src/worker/security-breach-handler.ts

import { createClient } from '@supabase/supabase-js';
import type { SecurityReconciliationResult } from '../reconciliation/security-reconciler.ts';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function handleSecurityReconciliationResult(
  vendorId: string,
  tenantId: string,
  result: SecurityReconciliationResult
): Promise<void> {

  for (const breach of result.breaches) {
    // Deduplication: don't create a new expiry_approaching breach if one is already open
    if (breach.breach_type === 'cert_expiry_approaching') {
      const existing = await supabase
        .from('ae_compliance_breaches')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('breach_type', 'cert_expiry_approaching')
        .eq('security_status_id', breach.security_status_id)
        .in('status', ['pending_review', 'approved'])
        .single();

      if (existing.data) {
        // Update due_date only — do not duplicate
        await supabase
          .from('ae_compliance_breaches')
          .update({ due_date: breach.due_date, updated_at: new Date().toISOString() })
          .eq('id', existing.data.id);
        continue;
      }
    }

    await supabase.from('ae_compliance_breaches').insert({
      vendor_id: vendorId,
      tenant_id: tenantId,
      security_status_id: breach.security_status_id,
      breach_type: breach.breach_type,
      severity: breach.severity,
      evidence: breach.evidence,
      contract_clause: breach.contract_clause,
      threshold_value: breach.threshold_value,
      actual_value: breach.actual_value,
      status: 'pending_review', // Always. No exceptions.
      due_date: breach.due_date
    });
  }

  // Write audit log entry
  await supabase.from('ae_audit_log').insert({
    tenant_id: tenantId,
    actor_type: 'worker',
    entity_type: 'ae_vendors',
    entity_id: vendorId,
    action: 'security_reconciliation_completed',
    after_state: {
      status: result.status,
      breach_count: result.breaches.length,
      warning_count: result.warnings.length
    }
  });

  // Notify reviewer if critical or high breaches exist
  const urgent = result.breaches.filter(b =>
    ['critical', 'high'].includes(b.severity)
  );
  if (urgent.length > 0) {
    // Note: This relies on notifications.ts bindings in Phase 6 Alerts layer
    console.log(`[Alert Router] Simulated notifying reviewer for ${urgent.length} urgent breaches`);
  }
}
