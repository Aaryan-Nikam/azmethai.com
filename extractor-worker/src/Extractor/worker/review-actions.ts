// packages/extractor/src/worker/review-actions.ts

import { createClient } from '@supabase/supabase-js';
import { generateDisputeLetter } from '../generation/draft-generator.ts';
import type { DisputeContext } from '../generation/draft-generator.ts';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Gate 1: Approving the Reconciler's isolated discrepancy
export async function approveDisputeGate1(
  disputeId: string,
  tenantId: string,
  userId: string,
  disputeContext: DisputeContext
): Promise<void> {
  // Generate the draft securely mapped into the slotted format
  const draftLetter = await generateDisputeLetter(disputeContext);

  // Update State 
  const { error } = await supabase
    .from('ae_invoice_disputes')
    .update({
      status: 'letter_drafted',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      draft_letter_content: draftLetter
    })
    .eq('id', disputeId)
    .eq('tenant_id', tenantId); // Strict RLS safety pass over service key

  if (error) throw new Error(`Gate 1 failure: ${error.message}`);

  // Push audit payload safely bounding the Before/After state of progression
  await supabase.from('ae_audit_log').insert({
    tenant_id: tenantId,
    actor_id: userId,
    actor_type: 'user',
    entity_type: 'ae_invoice_disputes',
    entity_id: disputeId,
    action: 'gate_1_dispute_approved',
    after_state: { status: 'letter_drafted' }
  });
}

// Gate 1 Alt: Dismiss Discrepancy
export async function dismissDisputeGate1(
  disputeId: string,
  tenantId: string,
  userId: string,
  reason: string
): Promise<void> {
  if (reason.length < 20) throw new Error('Dismissal reason must exceed 20 characters.');

  const { error } = await supabase
    .from('ae_invoice_disputes')
    .update({
      status: 'dismissed',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(`Dismissal failure: ${error.message}`);

  await supabase.from('ae_audit_log').insert({
    tenant_id: tenantId,
    actor_id: userId,
    actor_type: 'user',
    entity_type: 'ae_invoice_disputes',
    entity_id: disputeId,
    action: 'gate_1_dispute_dismissed',
    after_state: { status: 'dismissed', reason: reason }
  });
}

// Gate 2: Final approval of the Generated Letter 
export async function approveLetterGate2(
  disputeId: string,
  tenantId: string,
  userId: string,
  editedDraftContent: string
): Promise<void> {
  // Capture prior state for audit tracking of manual edits over AI draft
  const { data: prior } = await supabase
    .from('ae_invoice_disputes')
    .select('draft_letter_content')
    .eq('id', disputeId)
    .single();

  const { error } = await supabase
    .from('ae_invoice_disputes')
    .update({
      status: 'letter_approved',
      letter_approved_by: userId,
      letter_approved_at: new Date().toISOString(),
      draft_letter_content: editedDraftContent
    })
    .eq('id', disputeId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(`Gate 2 failure: ${error.message}`);

  await supabase.from('ae_audit_log').insert({
    tenant_id: tenantId,
    actor_id: userId,
    actor_type: 'user',
    entity_type: 'ae_invoice_disputes',
    entity_id: disputeId,
    action: 'gate_2_letter_approved',
    before_state: { draft_letter_content: prior?.draft_letter_content },
    after_state: { status: 'letter_approved', draft_letter_content: editedDraftContent }
  });
}
