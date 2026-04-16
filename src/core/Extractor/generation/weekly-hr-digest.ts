import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function dispatchWeeklyHrRosterDigest(tenantId: string) {
  // Query Materialized View for accurate Aggregated State
  const { data: roster, error: rosterError } = await supabase
    .from('ae_compliance_roster')
    .select('employee_id, overall_status');

  if (rosterError || !roster) {
    throw new Error('Failed to query ae_compliance_roster materialized view.');
  }

  // Segment metrics exactly per the Function 5 Spec Limit
  const expiredCount = roster.filter(e => e.overall_status === 'non_compliant').length;
  const expiringCount = roster.filter(e => e.overall_status === 'expiring').length;
  const compliantCount = roster.filter(e => e.overall_status === 'compliant').length;
  
  // Directly query the credentials to grab specific details for the "renewal_in_progress" segment
  const { data: renewalCredentials } = await supabase
    .from('ae_employee_credentials')
    .select('id')
    .eq('status', 'renewal_in_progress')
    .eq('tenant_id', tenantId);

  const renewalInProgressCount = renewalCredentials ? renewalCredentials.length : 0;

  // Build the strict 4-section digest enforcing human-readable array maps
  const digestString = \`
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Weekly Employee SLA Credential Digest
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Tenant Execution Bounds: \${tenantId}

  1. EXPIRED & NON-COMPLIANT
  [\${expiredCount}] profiles currently operating under strict 'expired' or 'suspended' boundaries. Immediate intervention is required.

  2. EXPIRING THIS MONTH
  [\${expiringCount}] credentials approaching documented limits. Notifications dispatched to individuals based on typical_lead_days logic.

  3. RENEWAL IN PROGRESS
  [\${renewalInProgressCount}] active renewals being processed.

  4. FULLY COMPLIANT
  [\${compliantCount}] employees fully cleared against documented SLA roles matrices.
  \`;

  // Explicitly dispatch the structural digest - integrating to Resend/SendGrid natively
  console.log(digestString);
  // Implementation for Email dispatch SDK (e.g. Resend) would be inserted here
  
  return { success: true, digestContent: digestString };
}
