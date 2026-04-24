-- Enable pgvector
create extension if not exists vector;

-- Tenants (one per company deploying Mantis)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  plan text default 'pilot',
  created_at timestamptz default now()
);

-- Role identities (one per AI employee deployment)
create table role_identities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  role text not null,
  department text,
  company_name text not null,
  company_domain text not null,
  reports_to text,
  permissions jsonb default '[]',
  blocked_actions jsonb default '[]',
  escalation_path jsonb default '[]',
  system_persona text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Episodic memory — what happened in past sessions
create table episodic_memory (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references role_identities(id) on delete cascade,
  tenant_id uuid not null,
  session_id text not null,
  summary text not null,
  key_decisions text[] default '{}',
  tasks_completed text[] default '{}',
  tasks_pending text[] default '{}',
  entities_involved text[] default '{}',
  embedding vector(1536),
  importance_score float default 0.5,
  created_at timestamptz default now(),
  compressed_at timestamptz
);

-- Semantic memory — durable facts extracted from episodes
create table semantic_memory (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references role_identities(id) on delete cascade,
  tenant_id uuid not null,
  subject text not null,
  predicate text not null,
  object text not null,
  confidence float default 0.8,
  embedding vector(1536),
  source text not null check (source in ('sop_ingest', 'episode_extract', 'explicit_input')),
  last_verified_at timestamptz default now()
);

-- Procedural memory — SOPs, workflows, domain rules
create table procedural_memory (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references role_identities(id) on delete cascade,
  tenant_id uuid not null,
  title text not null,
  steps text[] not null,
  conditions text,
  domain_tags text[] default '{}',
  embedding vector(1536),
  priority int default 5,
  version int default 1
);

-- Working memory — current task state, survives crashes
create table working_memory (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references role_identities(id) on delete cascade,
  tenant_id uuid not null,
  session_id text not null unique,
  task_description text,
  current_step text,
  steps_completed text[] default '{}',
  steps_remaining text[] default '{}',
  artifacts jsonb default '{}',
  pending_approvals text[] default '{}',
  checkpoint_at timestamptz default now(),
  status text default 'active' check (status in ('active', 'awaiting_approval', 'completed', 'failed'))
);

-- Approval queue — actions pending human sign-off
create table approval_queue (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  role_id uuid not null,
  session_id text not null,
  tool_name text not null,
  tool_input jsonb not null,
  risk_level text not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'declined')),
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz default now()
);

-- pgvector similarity search functions
create or replace function match_episodic_memory(
  p_role_id uuid, p_tenant_id uuid,
  p_embedding vector(1536), p_top_k int
)
returns table(
  id uuid, summary text, key_decisions text[],
  importance_score float, created_at timestamptz, similarity float
)
language sql stable as $$
  select id, summary, key_decisions, importance_score, created_at,
    1 - (embedding <=> p_embedding) as similarity
  from episodic_memory
  where role_id = p_role_id
    and tenant_id = p_tenant_id
    and embedding is not null
  order by embedding <=> p_embedding
  limit p_top_k;
$$;

create or replace function match_semantic_memory(
  p_role_id uuid, p_tenant_id uuid,
  p_embedding vector(1536), p_top_k int
)
returns table(
  id uuid, subject text, predicate text, object text,
  confidence float, similarity float
)
language sql stable as $$
  select id, subject, predicate, object, confidence,
    1 - (embedding <=> p_embedding) as similarity
  from semantic_memory
  where role_id = p_role_id
    and tenant_id = p_tenant_id
    and embedding is not null
  order by embedding <=> p_embedding
  limit p_top_k;
$$;

create or replace function match_procedural_memory(
  p_role_id uuid, p_tenant_id uuid,
  p_embedding vector(1536), p_top_k int
)
returns table(
  id uuid, title text, steps text[], conditions text, priority int, similarity float
)
language sql stable as $$
  select id, title, steps, conditions, priority,
    1 - (embedding <=> p_embedding) as similarity
  from procedural_memory
  where role_id = p_role_id
    and tenant_id = p_tenant_id
    and embedding is not null
  order by embedding <=> p_embedding
  limit p_top_k;
$$;

-- Row level security — tenant isolation is mandatory
alter table role_identities enable row level security;
alter table episodic_memory enable row level security;
alter table semantic_memory enable row level security;
alter table procedural_memory enable row level security;
alter table working_memory enable row level security;
alter table approval_queue enable row level security;

-- Service role bypasses RLS (for server-side operations)
-- Application uses service role key server-side only
-- Never expose service role key to client
