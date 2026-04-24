// packages/extractor/src/worker/compliance-actions.ts

import { createClient } from '@supabase/supabase-js';
import { generateBatchedComplianceNotice } from '../generation/compliance-notice-generator.ts';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Gate 1: Approving the breach states (Moving from pending_review -> approved)
export async function approveBreachGate1(
  breachId: string,
  tenantId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('ae_compliance_breaches')
    .update({
      status: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', breachId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(`Security Gate 1 failure: ${error.message}`);
}

// Generate the drafted batch
export async function generateBatchedNoticeForVendor(
  vendorId: string,
  tenantId: string,
  userId: string,
  reviewerSelectedConsequence: string
): Promise<void> {

  const { draftContent, breachIds } = await generateBatchedComplianceNotice(
    vendorId, tenantId, reviewerSelectedConsequence
  );

  // Bulk update all batched breaches to 'notice_drafted' containing the same bundled draft logic text
  for (const bId of breachIds) {
    await supabase.from('ae_compliance_breaches').update({
      status: 'notice_drafted',
      draft_notice_content: draftContent
    })
    .eq('id', bId)
    .eq('tenant_id', tenantId);
  }

  await supabase.from('ae_audit_log').insert({
    tenant_id: tenantId,
    actor_id: userId,
    actor_type: 'user',
    entity_type: 'ae_vendors',
    entity_id: vendorId,
    action: 'batch_demand_notices_drafted',
    after_state: { status: 'notice_drafted', batch_size: breachIds.length }
  });
}

// Gate 2: Dispatching the formal Demand response
export async function approveDemandNoticeGate2(
  breachIds: string[],
  tenantId: string,
  userId: string,
  editedDraftContent: string
): Promise<void> {
  for (const bId of breachIds) {
    const { error } = await supabase
      .from('ae_compliance_breaches')
      .update({
        status: 'notice_approved',
        draft_notice_content: editedDraftContent,
        notice_approved_by: userId,
        notice_approved_at: new Date().toISOString()
      })
      .eq('id', bId)
      .eq('tenant_id', tenantId);

    if (error) throw new Error(`Security Gate 2 failure on dispatch: ${error.message}`);
  }
}
