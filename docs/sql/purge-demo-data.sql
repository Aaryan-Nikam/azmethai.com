-- Azmeth OS: Demo Data Purge
-- Where: Supabase Dashboard -> SQL Editor
--
-- This script is meant to reset the system to a clean state before a client trial.
-- It is destructive (deletes rows). Read before running.

begin;

-- ---------------------------------------------------------------------------
-- SOFT RESET (recommended)
-- Keeps: integrations + agent configuration
-- Deletes: inbound/outbound operational data (leads, campaigns, queues, messages)
-- ---------------------------------------------------------------------------

truncate table
  outbound_messages,
  outbound_queue,
  outbound_scraper_jobs,
  outbound_leads,
  outbound_campaigns,
  webhook_queue,
  message_queue,
  n8n_chat_histories,
  chat_leads
restart identity
cascade;

commit;

-- ---------------------------------------------------------------------------
-- FULL RESET (optional)
-- WARNING: This removes connected channel tokens and your sales agent config.
-- Uncomment to use.
-- ---------------------------------------------------------------------------
--
-- begin;
-- truncate table
--   platform_connections,
--   sales_agents
-- restart identity
-- cascade;
-- commit;

