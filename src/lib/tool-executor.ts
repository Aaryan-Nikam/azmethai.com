/**
 * tool-executor.ts
 * Bridge between the agent's tool calls and the actual business logic.
 * Every tool name maps to an internal fetch call or direct Supabase query.
 * Returns JSON string that gets appended to the message history.
 */

import { createServerClient } from '@/lib/supabase';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  return res.json();
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  return res.json();
}

async function apiPatch(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  return res.json();
}

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    let result: unknown;

    switch (name) {
      // ── Setter ────────────────────────────────────────────────────────────────
      case 'get_inbox_threads': {
        const params = new URLSearchParams();
        if (args.limit) params.set('limit', String(args.limit));
        if (args.status && args.status !== 'all') params.set('status', args.status as string);
        if (args.channel) params.set('channel', args.channel as string);
        result = await apiGet(`/api/inbox?${params}`);
        break;
      }

      case 'reply_to_lead': {
        result = await apiPost('/api/inbox', { lead_id: args.lead_id, text: args.message });
        break;
      }

      case 'approve_message': {
        result = await apiPatch('/api/approvals', { id: args.approval_id, status: 'approved', edited_text: args.edits });
        break;
      }

      case 'get_setter_stats': {
        result = await apiGet('/api/analytics');
        break;
      }

      case 'configure_setter_agent': {
        const db = createServerClient();
        const { data } = await db.from('sales_agents').select('id').limit(1).maybeSingle();
        const patch = Object.fromEntries(
          Object.entries(args).filter(([, v]) => v !== undefined)
        );
        if (data?.id) {
          await db.from('sales_agents').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', data.id);
          result = { ok: true, updated: patch };
        } else {
          result = { error: 'No agent configured yet. Set up in AI Setter first.' };
        }
        break;
      }

      case 'list_agents_in_registry': {
        const db = createServerClient();
        const query = db.from('agent_registry').select('*').order('priority', { ascending: false });
        if (args.active_only !== false) query.eq('is_active', true);
        const { data } = await query;
        result = { agents: data || [] };
        break;
      }

      case 'add_agent_to_registry': {
        const db = createServerClient();
        const { data, error } = await db.from('agent_registry').insert({
          name: args.name,
          specializations: args.specializations,
          system_prompt: args.system_prompt,
          model: args.model || 'gpt-4o-mini',
          priority: args.priority || 0,
        }).select().single();
        result = error ? { error: error.message } : { ok: true, agent: data };
        break;
      }

      case 'update_agent_config': {
        const db = createServerClient();
        const { agent_id, ...patch } = args;
        const { error } = await db.from('agent_registry').update({
          ...patch,
          updated_at: new Date().toISOString(),
        }).eq('id', agent_id);
        result = error ? { error: error.message } : { ok: true };
        break;
      }

      // ── Outbound ──────────────────────────────────────────────────────────────
      case 'create_campaign': {
        result = await apiPost('/api/outbound/campaign', {
          name: args.name,
          icp: args.icp || {},
          config: { framework: args.framework, channels: args.channels },
        });
        break;
      }

      case 'get_campaign_status': {
        result = await apiGet(`/api/outbound/campaigns/${args.campaign_id}`);
        break;
      }

      case 'list_leads': {
        const db = createServerClient();
        let query = db.from('outbound_leads').select('*').limit(Number(args.limit) || 20);
        if (args.campaign_id) query = query.eq('campaign_id', args.campaign_id);
        if (args.stage) query = query.eq('stage', args.stage);
        const { data } = await query;
        result = { leads: data || [], count: data?.length || 0 };
        break;
      }

      case 'get_pipeline_stats': {
        const params = args.campaign_id ? `?campaign_id=${args.campaign_id}` : '';
        result = await apiGet(`/api/outbound/campaigns/summary${params}`);
        break;
      }

      case 'trigger_stage_for_lead': {
        result = await apiPost(`/api/outbound/${args.stage}`, { lead_id: args.lead_id });
        break;
      }

      case 'scrape_leads_from_url': {
        result = await apiPost('/api/outbound/scrape', {
          url: args.url,
          campaign_id: args.campaign_id,
          max_leads: args.max_leads || 50,
        });
        break;
      }

      case 'pause_campaign': {
        result = await apiPatch(`/api/outbound/campaigns/${args.campaign_id}`, { status: 'paused' });
        break;
      }

      case 'resume_campaign': {
        result = await apiPatch(`/api/outbound/campaigns/${args.campaign_id}`, { status: 'running' });
        break;
      }

      // ── Cross-system ──────────────────────────────────────────────────────────
      case 'get_unified_leads': {
        const params = new URLSearchParams();
        if (args.source && args.source !== 'all') params.set('source', args.source as string);
        if (args.stage) params.set('stage', args.stage as string);
        if (args.score_min) params.set('score_min', String(args.score_min));
        if (args.limit) params.set('limit', String(args.limit));
        result = await apiGet(`/api/leads/unified?${params}`);
        break;
      }

      case 'search_leads': {
        result = await apiGet(`/api/leads/unified?search=${encodeURIComponent(args.query as string)}&limit=${args.limit || 10}`);
        break;
      }

      case 'get_command_center_summary': {
        result = await apiGet('/api/command-center');
        break;
      }

      // ── Sandbox ───────────────────────────────────────────────────────────────
      case 'create_workflow_node': {
        const db = createServerClient();
        const { data, error } = await db.from('workflow_nodes').insert({
          workflow_id: args.workflow_id,
          type: args.type,
          label: args.label,
          config: args.config || {},
          position_x: args.position_x || 200,
          position_y: args.position_y || 200,
          state: 'draft',
        }).select().single();
        result = error ? { error: error.message } : { ok: true, node: data };
        break;
      }

      case 'connect_nodes': {
        const db = createServerClient();
        const { data, error } = await db.from('workflow_edges').insert({
          workflow_id: args.workflow_id,
          source_id: args.source_node_id,
          target_id: args.target_node_id,
        }).select().single();
        result = error ? { error: error.message } : { ok: true, edge: data };
        break;
      }

      case 'execute_workflow': {
        result = await apiPost(`/api/workflows/${args.workflow_id}/execute`, {
          inputData: args.input_data || {},
        });
        break;
      }

      case 'get_workflow_status': {
        const db = createServerClient();
        const [{ data: workflow }, { data: nodes }, { data: edges }] = await Promise.all([
          db.from('workflows').select('*').eq('id', args.workflow_id).maybeSingle(),
          db.from('workflow_nodes').select('*').eq('workflow_id', args.workflow_id),
          db.from('workflow_edges').select('*').eq('workflow_id', args.workflow_id),
        ]);
        result = {
          workflow,
          nodes: nodes || [],
          edges: edges || [],
          draft_count: nodes?.filter(n => n.state === 'draft').length || 0,
          approved_count: nodes?.filter(n => n.state === 'approved').length || 0,
        };
        break;
      }

      default:
        result = { error: `Unknown tool: ${name}` };
    }

    return JSON.stringify(result);
  } catch (err: any) {
    return JSON.stringify({ error: err.message || 'Tool execution failed', tool: name });
  }
}
