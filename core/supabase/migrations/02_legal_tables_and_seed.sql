-- ============================================================
-- Migration: 02_legal_tables_and_seed.sql
-- Creates law firm operational tables and seeds the
-- Mehta & Associates pilot tenant with full Legal Paralegal role.
-- ============================================================

-- ─── Operational Tables ───────────────────────────────────────────────────────

create table if not exists legal_clients (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  address     jsonb default '{}',
  kyc_status  text default 'pending' check (kyc_status in ('pending', 'verified', 'failed')),
  created_at  timestamptz default now()
);

create table if not exists legal_matters (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  client_id             uuid references legal_clients(id),
  title                 text not null,
  matter_type           text not null,
  status                text default 'open' check (status in ('open', 'pending', 'closed', 'archived')),
  billing_rate          numeric default 5000,
  supervising_attorney  text,
  notes                 text,
  next_action           text,
  opened_at             timestamptz default now(),
  closed_at             timestamptz,
  updated_at            timestamptz default now()
);

create table if not exists legal_documents (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  matter_id   uuid references legal_matters(id),
  title       text not null,
  content     text not null,
  doc_type    text not null,
  status      text default 'draft' check (status in ('draft', 'final', 'filed', 'archived')),
  created_at  timestamptz default now()
);

create table if not exists legal_tasks (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  matter_id    uuid references legal_matters(id),
  title        text not null,
  description  text,
  due_date     date not null,
  assigned_to  text,
  priority     text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status       text default 'open' check (status in ('open', 'in_progress', 'done', 'cancelled')),
  created_at   timestamptz default now()
);

create table if not exists legal_calendar (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  matter_id      uuid references legal_matters(id),
  title          text not null,
  event_type     text not null check (event_type in ('court_date', 'deadline', 'meeting', 'hearing')),
  scheduled_at   timestamptz not null,
  duration_mins  int default 60,
  participants   text[] default '{}',
  notes          text,
  created_at     timestamptz default now()
);

create table if not exists legal_time_entries (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  matter_id   uuid references legal_matters(id),
  date        date not null,
  hours       numeric not null,
  description text not null,
  billed_by   text,
  billable    boolean default true,
  created_at  timestamptz default now()
);

create table if not exists legal_invoices (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  matter_id      uuid references legal_matters(id),
  billing_from   date not null,
  billing_to     date not null,
  total_hours    numeric default 0,
  fees           numeric default 0,
  status         text default 'draft' check (status in ('draft', 'approved', 'sent', 'paid')),
  created_at     timestamptz default now()
);

create table if not exists legal_document_shares (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  document_id      uuid references legal_documents(id),
  recipient_email  text not null,
  share_token      text not null unique default gen_random_uuid()::text,
  expires_at       timestamptz not null,
  allow_download   boolean default false,
  status           text default 'active' check (status in ('active', 'revoked', 'expired')),
  created_at       timestamptz default now()
);

-- Enable RLS on all new tables
alter table legal_clients          enable row level security;
alter table legal_matters          enable row level security;
alter table legal_documents        enable row level security;
alter table legal_tasks            enable row level security;
alter table legal_calendar         enable row level security;
alter table legal_time_entries     enable row level security;
alter table legal_invoices         enable row level security;
alter table legal_document_shares  enable row level security;

-- ─── Pilot Tenant Seed ────────────────────────────────────────────────────────

insert into tenants (id, name, domain, plan) values (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Mehta & Associates',
  'mehta-associates.com',
  'pilot'
) on conflict (domain) do nothing;

-- ─── Legal Paralegal Role Identity ───────────────────────────────────────────

insert into role_identities (
  id, tenant_id, role, department, company_name, company_domain,
  reports_to, permissions, blocked_actions, escalation_path, system_persona
) values (
  'b1b2c3d4-0000-0000-0000-000000000002',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Senior Legal Paralegal',
  'Legal Operations',
  'Mehta & Associates',
  'mehta-associates.com',
  'partner@mehta-associates.com',
  '[
    {"resource":"read_document",       "actions":["read"]},
    {"resource":"search_case_law",     "actions":["read","execute"]},
    {"resource":"lookup_client",       "actions":["read"]},
    {"resource":"list_matters",        "actions":["read"]},
    {"resource":"get_calendar",        "actions":["read"]},
    {"resource":"analyze_contract",    "actions":["read","execute"]},
    {"resource":"summarize_case",      "actions":["read","execute"]},
    {"resource":"draft_contract",      "actions":["write"]},
    {"resource":"draft_letter",        "actions":["write"]},
    {"resource":"create_task",         "actions":["write"]},
    {"resource":"schedule_meeting",    "actions":["write"]},
    {"resource":"update_matter",       "actions":["write"]},
    {"resource":"generate_invoice",    "actions":["write"]},
    {"resource":"send_external_email", "actions":["write"]},
    {"resource":"share_document",      "actions":["share"]},
    {"resource":"archive_matter",      "actions":["delete"]},
    {"resource":"file_court_document", "actions":["execute"]}
  ]',
  '[
    {"pattern":"give_legal_advice",        "reason":"Paralegal cannot form attorney-client relationships."},
    {"pattern":"sign_on_behalf",           "reason":"Paralegal cannot sign on behalf of attorneys or clients."},
    {"pattern":"settle_",                  "reason":"Settlement decisions require attorney authority."},
    {"pattern":"modify_billing_rate",      "reason":"Billing rate changes require partner authorization."},
    {"pattern":"delete_matter",            "reason":"Matter deletion requires partner authorization."},
    {"pattern":"contact_opposing_counsel", "reason":"All opposing counsel communication routes through the supervising attorney."},
    {"pattern":"admin_",                   "reason":"Admin operations are outside paralegal scope."}
  ]',
  '[
    {"level":"LOW",      "notify":[],                                                                   "requires_reason":false,"auto_execute_after_ms":0},
    {"level":"MEDIUM",   "notify":["partner@mehta-associates.com"],                                     "requires_reason":false,"auto_execute_after_ms":60000},
    {"level":"HIGH",     "notify":["partner@mehta-associates.com"],                                     "requires_reason":true},
    {"level":"CRITICAL", "notify":["partner@mehta-associates.com","admin@mehta-associates.com"],         "requires_reason":true}
  ]',
  'You are Aria, a Senior Legal Paralegal at Mehta & Associates. You specialize in contract drafting, case law research, court filing preparation, and client matter management. You never give legal advice — you are a paralegal, not a lawyer. All external communications require attorney sign-off. Client confidentiality is absolute.'
) on conflict (id) do nothing;

-- ─── Pilot Sample Client & Matter ────────────────────────────────────────────

insert into legal_clients (id, tenant_id, name, email, phone, kyc_status) values (
  'd1000000-0000-0000-0000-000000000001',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Patel Industries Pvt. Ltd.',
  'legal@patel-industries.com',
  '+91-9800000001',
  'verified'
) on conflict do nothing;

insert into legal_matters (id, tenant_id, client_id, title, matter_type, status, billing_rate, supervising_attorney) values (
  'e1000000-0000-0000-0000-000000000001',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000001',
  'Patel Industries — Commercial Lease Dispute',
  'Commercial Litigation',
  'open',
  6000,
  'partner@mehta-associates.com'
) on conflict do nothing;

-- ─── Procedural Memory SOPs (embeddings computed by ingest-legal-sops.ts) ────

insert into procedural_memory (id, role_id, tenant_id, title, steps, conditions, domain_tags, priority, version) values

  ('c1000000-0000-0000-0000-000000000001',
   'b1b2c3d4-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'New Client Intake SOP',
   ARRAY[
     'Verify client identity and collect KYC documents',
     'Run conflict-of-interest check against all existing matters',
     'Obtain signed engagement letter before any work begins',
     'Open new matter in the matter management system',
     'Set up secure client folder and document access permissions',
     'Schedule initial consultation with supervising attorney',
     'Send welcome email with firm contact details and next steps (requires attorney approval)'
   ],
   'Apply when onboarding any new client to the firm',
   ARRAY['intake','onboarding','kyc','conflict-check'],
   9, 1),

  ('c1000000-0000-0000-0000-000000000002',
   'b1b2c3d4-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Contract Review Workflow',
   ARRAY[
     'Read the full contract; identify all parties, effective dates, and governing law',
     'Flag non-standard clauses using firm checklist: indemnity, IP, jurisdiction, termination, liability caps',
     'Research jurisdiction-specific requirements using search_case_law',
     'Draft review memo: summarize key risks and recommended changes',
     'Prepare a redlined version with tracked changes',
     'Submit memo and redline to supervising attorney for final review',
     'Record completion in the matter file using update_matter'
   ],
   'Apply when asked to review any contract from a client or counterparty',
   ARRAY['contract','review','due-diligence'],
   8, 1),

  ('c1000000-0000-0000-0000-000000000003',
   'b1b2c3d4-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Court Filing Preparation SOP',
   ARRAY[
     'Confirm the filing deadline in court records — double-check with clerk if uncertain',
     'Verify correct court, case number, and judge assignment',
     'Ensure document complies with local court formatting rules',
     'Obtain attorney review and wet/digital signature on the document',
     'Prepare certificate of service listing all parties to be served',
     'Submit for CRITICAL approval via approval queue before any filing action',
     'Execute file_court_document only after CRITICAL approval is granted',
     'Confirm filing receipt and docket number from court',
     'Send copies to all parties per service requirements',
     'Update matter calendar with filed date using update_matter'
   ],
   'Apply when preparing any document for court submission',
   ARRAY['filing','court','litigation','deadlines'],
   10, 1),

  ('c1000000-0000-0000-0000-000000000004',
   'b1b2c3d4-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Monthly Billing Cycle SOP',
   ARRAY[
     'Review all open matters for the billing period',
     'Verify all time entries are correctly coded to matters',
     'Flag write-offs or non-billable time for attorney review',
     'Generate draft invoices using generate_invoice for each active matter',
     'Submit draft invoices to supervising attorney for approval',
     'Once approved, route to accounts for dispatch to clients',
     'Log invoice dispatch and update AR tracker'
   ],
   'Apply at the end of each billing cycle (typically end of month)',
   ARRAY['billing','invoicing','accounts-receivable'],
   7, 1),

  ('c1000000-0000-0000-0000-000000000005',
   'b1b2c3d4-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Matter Closing SOP',
   ARRAY[
     'Confirm matter is resolved and no open tasks remain',
     'Prepare final billing statement; clear outstanding invoices',
     'Return or destroy original client documents per firm retention policy',
     'Update matter status to "closed" using update_matter',
     'Draft matter closing letter for attorney signature using draft_letter',
     'Send closing letter only after attorney approves via send_external_email (HIGH approval)',
     'Archive all matter documents using archive_matter (requires attorney HIGH approval)',
     'Record closed date and outcome in the matter management system'
   ],
   'Apply when closing any completed or terminated matter',
   ARRAY['matter-closing','offboarding','records-retention'],
   6, 1)

on conflict (id) do nothing;
