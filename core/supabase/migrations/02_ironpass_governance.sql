-- 02_ironpass_governance.sql
-- IronPass Governance Feed
-- Exposes an immutable, read-only view of all agent governance actions for audit logging.

create or replace view ironpass_governance_feed as
select 
  q.id as audit_event_id,
  t.name as tenant_name,
  t.domain as tenant_domain,
  r.role as agent_role,
  r.company_name as agent_company,
  q.session_id as workflow_session,
  q.tool_name as attempted_action,
  q.risk_level,
  q.reason as block_reason,
  q.status as resolution_status,
  q.decided_by as authorizing_human,
  q.created_at as blocked_at,
  q.decided_at as resolved_at,
  -- We extract the exact input payload the LLM tried to execute
  q.tool_input as forensic_payload
from 
  approval_queue q
join 
  tenants t on q.tenant_id = t.id
join 
  role_identities r on q.role_id = r.id;

-- Ensure the view is accessible to the IronPass reporting role (assuming standard RLS)
grant select on ironpass_governance_feed to authenticated;
grant select on ironpass_governance_feed to service_role;
