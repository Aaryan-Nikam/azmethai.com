-- Azmeth OS: Queue claim RPCs for cron worker
-- Run in Supabase SQL Editor before enabling cron if these functions do not exist.

create or replace function public.claim_webhook_jobs(batch_size integer default 5)
returns setof public.webhook_queue
language sql
security definer
set search_path = public
as $$
  update public.webhook_queue
  set status = 'processing'
  where id in (
    select id
    from public.webhook_queue
    where status = 'pending'
    order by created_at asc
    for update skip locked
    limit greatest(batch_size, 0)
  )
  returning *;
$$;

create or replace function public.claim_outbound_jobs(batch_size integer default 5)
returns setof public.outbound_queue
language sql
security definer
set search_path = public
as $$
  update public.outbound_queue
  set status = 'processing'
  where id in (
    select id
    from public.outbound_queue
    where status = 'pending'
    order by created_at asc
    for update skip locked
    limit greatest(batch_size, 0)
  )
  returning *;
$$;

grant execute on function public.claim_webhook_jobs(integer) to service_role;
grant execute on function public.claim_outbound_jobs(integer) to service_role;
