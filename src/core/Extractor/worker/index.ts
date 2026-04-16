import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { approveBreachGate1, generateBatchedNoticeForVendor, approveDemandNoticeGate2 } from './compliance-actions.ts';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Router
const approvalsRouter = express.Router();

// Helper to write to ae_audit_log
async function writeAuditLog(tenantId: string, actorId: string, entityId: string, action: string, beforeState: any, afterState: any, ipAddress: string | undefined = undefined) {
  await supabase.from('ae_audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    actor_type: 'user',
    entity_type: 'ae_vendors',
    entity_id: entityId,
    action,
    before_state: beforeState,
    after_state: afterState,
    ip_address: ipAddress || '0.0.0.0'
  });
}

// 1. Extraction Approve
approvalsRouter.post('/extraction-approve', async (req, res) => {
  res.status(501).json({ error: 'Function 1 Extraction approval not fully wired in payload.' });
});

// 2. Extraction Reject
approvalsRouter.post('/extraction-reject', async (req, res) => {
  res.status(501).json({ error: 'Function 1 Extraction reject not fully wired in payload.' });
});

// 3. Dispute Approve
approvalsRouter.post('/dispute-approve', async (req, res) => {
  res.status(501).json({ error: 'Function 2 Dispute approval not fully wired in payload.' });
});

// 4. Dispute Reject
approvalsRouter.post('/dispute-reject', async (req, res) => {
  res.status(501).json({ error: 'Function 2 Dispute reject not fully wired in payload.' });
});

// 5. Compliance Approve (Gate 1 Breach / Gate 2 Notice)
approvalsRouter.post('/compliance-batch', async (req, res) => {
  try {
    const { vendorId, tenantId, consequence, authorised_signatory, userId = 'SYS_ACTOR' } = req.body;

    // Hard block specified by rule limits
    if (!authorised_signatory || authorised_signatory.trim() === '') {
      return res.status(400).json({ error: 'Hard Block: authorised_signatory is required for demand issuance.' });
    }

    // Capture before state for audit logging
    const { data: beforeBreaches } = await supabase
      .from('ae_compliance_breaches')
      .select('id, status')
      .eq('vendor_id', vendorId)
      .in('status', ['pending_review', 'approved']);

    // Map Gate 1 approval for all pending
    if (beforeBreaches) {
      for (const breach of beforeBreaches.filter((b: any) => b.status === 'pending_review')) {
        await approveBreachGate1(breach.id, tenantId, userId);
      }
    }

    // Then execute Gate 2 generic drafting
    await generateBatchedNoticeForVendor(vendorId, tenantId, userId, consequence);

    // Capture after state
    const { data: afterBreaches } = await supabase
      .from('ae_compliance_breaches')
      .select('id, status')
      .eq('vendor_id', vendorId)
      .in('status', ['notice_drafted']);

    await writeAuditLog(tenantId, userId, vendorId, 'ui_compliance_batch_approved', beforeBreaches, afterBreaches, req.ip);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Compliance Reject
approvalsRouter.post('/compliance-reject', async (req, res) => {
  try {
    const { breachId, tenantId, reason, userId = 'SYS_ACTOR' } = req.body;

    const { data: beforeState } = await supabase.from('ae_compliance_breaches').select('vendor_id, status').eq('id', breachId).single();
    if (!beforeState) throw new Error("Breach not found");

    const { error } = await supabase.from('ae_compliance_breaches')
      .update({ status: 'dismissed', dismissed_reason: reason, dismissed_by: userId })
      .eq('id', breachId)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    await writeAuditLog(tenantId, userId, beforeState.vendor_id, 'ui_compliance_breach_rejected', beforeState, { status: 'dismissed', reason }, req.ip);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/approvals', approvalsRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Extractor worker running on port ${PORT}`);
});
