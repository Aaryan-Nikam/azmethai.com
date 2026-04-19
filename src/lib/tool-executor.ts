/**
 * tool-executor.ts
 * Bridge between the agent's tool calls and the actual business logic.
 * Returns structured envelopes so the agent can request clarifications mid-run.
 */

import { createServerClient } from '@/lib/supabase';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export type ToolExecutionStatus = 'ok' | 'error' | 'needs_user_input';

export interface ToolUserInputRequest {
  key: string;
  label: string;
  question: string;
  sensitive?: boolean;
  expected_format?: string;
  reason?: string;
}

export interface ToolExecutionEnvelope {
  status: ToolExecutionStatus;
  tool: string;
  result?: unknown;
  error?: string;
  request?: ToolUserInputRequest;
}

interface ApiResponseEnvelope {
  ok: boolean;
  status: number;
  data: unknown;
}

function success(tool: string, result: unknown): ToolExecutionEnvelope {
  return { status: 'ok', tool, result };
}

function failure(tool: string, error: string, result?: unknown): ToolExecutionEnvelope {
  return { status: 'error', tool, error, result };
}

function needsInput(tool: string, request: ToolUserInputRequest): ToolExecutionEnvelope {
  return { status: 'needs_user_input', tool, request };
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

async function requestJson(path: string, init?: RequestInit): Promise<ApiResponseEnvelope> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') || '';
    let data: unknown;

    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : {};
    }

    if (!res.ok) {
      const err = (data as any)?.error || (data as any)?.message || `Request failed (${res.status})`;
      return {
        ok: false,
        status: res.status,
        data: typeof data === 'object' ? { ...(data as Record<string, unknown>), error: err } : { error: err },
      };
    }

    return { ok: true, status: res.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

async function apiGet(path: string): Promise<unknown> {
  const res = await requestJson(path);
  return res.data;
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await requestJson(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.data;
}

async function apiPatch(path: string, body: unknown): Promise<unknown> {
  const res = await requestJson(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function executeToolEnvelope(name: string, args: Record<string, unknown>): Promise<ToolExecutionEnvelope> {
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
        const leadId = asNonEmptyString(args.lead_id);
        const message = asNonEmptyString(args.message);

        if (!leadId) {
          return needsInput(name, {
            key: 'lead_id',
            label: 'Lead ID',
            question: 'Which lead should I reply to? Please share the lead ID.',
            expected_format: 'uuid',
          });
        }

        if (!message) {
          return needsInput(name, {
            key: 'message',
            label: 'Reply Message',
            question: 'What message should I send to that lead?',
          });
        }

        result = await apiPost('/api/inbox', { lead_id: leadId, text: message });
        break;
      }

      case 'approve_message': {
        const approvalId = asNonEmptyString(args.approval_id);
        if (!approvalId) {
          return needsInput(name, {
            key: 'approval_id',
            label: 'Approval ID',
            question: 'Please share the approval ID you want me to approve.',
            expected_format: 'uuid',
          });
        }

        result = await apiPatch('/api/approvals', {
          id: approvalId,
          status: 'approved',
          edited_text: args.edits,
        });
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
          const { error } = await db
            .from('sales_agents')
            .update({ ...patch, updated_at: new Date().toISOString() })
            .eq('id', data.id);

          result = error ? { error: error.message } : { ok: true, updated: patch };
        } else {
          result = { error: 'No agent configured yet. Set up in AI Setter first.' };
        }
        break;
      }

      case 'set_agent_api_key': {
        const apiKey = asNonEmptyString(args.api_key);

        if (!apiKey) {
          return needsInput(name, {
            key: 'OPENAI_API_KEY',
            label: 'OpenAI API Key',
            question: 'Please paste your OpenAI API key so I can configure custom billing mode.',
            sensitive: true,
            expected_format: 'starts with sk-',
            reason: 'Required for tenant-level custom LLM billing.',
          });
        }

        const db = createServerClient();
        const { data: current } = await db.from('sales_agents').select('id').limit(1).maybeSingle();

        if (!current?.id) {
          result = { error: 'No sales agent record found yet. Set up the AI Setter first, then retry.' };
          break;
        }

        const { error } = await db
          .from('sales_agents')
          .update({
            llm_billing_mode: 'custom',
            provider_api_key: apiKey,
            updated_at: new Date().toISOString(),
          })
          .eq('id', current.id);

        result = error
          ? { error: error.message }
          : { ok: true, billing_mode: 'custom', key_saved: true, masked_key: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` };
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
        const campaignName = asNonEmptyString(args.name);
        if (!campaignName) {
          return needsInput(name, {
            key: 'campaign_name',
            label: 'Campaign Name',
            question: 'What should I name this outbound campaign?',
          });
        }

        result = await apiPost('/api/outbound/campaign', {
          name: campaignName,
          icp: args.icp || {},
          config: { framework: args.framework, channels: args.channels },
        });
        break;
      }

      case 'get_campaign_status': {
        const campaignId = asNonEmptyString(args.campaign_id);
        if (!campaignId) {
          return needsInput(name, {
            key: 'campaign_id',
            label: 'Campaign ID',
            question: 'Which campaign should I check? Please share the campaign ID.',
            expected_format: 'uuid',
          });
        }

        result = await apiGet(`/api/outbound/campaigns/${campaignId}`);
        break;
      }

      case 'list_leads': {
        const db = createServerClient();
        let query = db.from('outbound_leads').select('*').limit(asNumber(args.limit, 20));
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
        const leadId = asNonEmptyString(args.lead_id);
        const rawStage = asNonEmptyString(args.stage);

        if (!leadId) {
          return needsInput(name, {
            key: 'lead_id',
            label: 'Lead ID',
            question: 'Which lead should I move to the next stage?',
          });
        }

        if (!rawStage) {
          return needsInput(name, {
            key: 'stage',
            label: 'Pipeline Stage',
            question: 'Which stage should I trigger? (qualify, personalise/personalize, or send)',
          });
        }

        const normalizedStage = rawStage.toLowerCase() === 'personalize' ? 'personalise' : rawStage.toLowerCase();

        if (!['research', 'qualify', 'personalise', 'send'].includes(normalizedStage)) {
          return needsInput(name, {
            key: 'stage',
            label: 'Pipeline Stage',
            question: 'Use one of: research, qualify, personalise (or personalize), send.',
          });
        }

        if (normalizedStage === 'send') {
          result = await apiPost('/api/outbound/send', { lead_id: leadId });
          break;
        }

        result = await apiPost(`/api/outbound/${normalizedStage}`, { lead_id: leadId });
        break;
      }

      case 'scrape_leads_from_url': {
        const campaignId = asNonEmptyString(args.campaign_id);
        const url = asNonEmptyString(args.url);
        const apifyApiKey = asNonEmptyString(args.apify_api_key);

        if (!campaignId) {
          return needsInput(name, {
            key: 'campaign_id',
            label: 'Campaign ID',
            question: 'Which campaign should receive these scraped leads? Share the campaign ID.',
            expected_format: 'uuid',
          });
        }

        if (!url) {
          return needsInput(name, {
            key: 'url',
            label: 'Source URL',
            question: 'Please share the source URL you want me to scrape.',
            expected_format: 'https://...',
          });
        }

        if (!apifyApiKey && !process.env.APIFY_API_KEY) {
          return needsInput(name, {
            key: 'APIFY_API_KEY',
            label: 'Apify API Key',
            question: 'I need an Apify API key to run scraping. Paste it here and I will continue the workflow.',
            sensitive: true,
            expected_format: 'starts with apify_api_',
            reason: 'Required by outbound scraper integration.',
          });
        }

        result = await apiPost('/api/outbound/scrape', {
          url,
          campaign_id: campaignId,
          max_leads: asNumber(args.max_leads, 50),
          apify_api_key: apifyApiKey || undefined,
        });
        break;
      }

      case 'pause_campaign': {
        const campaignId = asNonEmptyString(args.campaign_id);
        if (!campaignId) {
          return needsInput(name, {
            key: 'campaign_id',
            label: 'Campaign ID',
            question: 'Which campaign should I pause?',
          });
        }

        result = await apiPatch(`/api/outbound/campaigns/${campaignId}`, { status: 'paused' });
        break;
      }

      case 'resume_campaign': {
        const campaignId = asNonEmptyString(args.campaign_id);
        if (!campaignId) {
          return needsInput(name, {
            key: 'campaign_id',
            label: 'Campaign ID',
            question: 'Which campaign should I resume?',
          });
        }

        result = await apiPatch(`/api/outbound/campaigns/${campaignId}`, { status: 'running' });
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
        const query = asNonEmptyString(args.query);
        if (!query) {
          return needsInput(name, {
            key: 'query',
            label: 'Search Query',
            question: 'What should I search for across leads?',
          });
        }

        result = await apiGet(`/api/leads/unified?search=${encodeURIComponent(query)}&limit=${asNumber(args.limit, 10)}`);
        break;
      }

      case 'get_command_center_summary': {
        result = await apiGet('/api/command-center');
        break;
      }

      // ── Sandbox ───────────────────────────────────────────────────────────────
      case 'create_workflow_node': {
        const workflowId = asNonEmptyString(args.workflow_id);
        const type = asNonEmptyString(args.type);
        const label = asNonEmptyString(args.label);

        if (!workflowId) {
          return needsInput(name, {
            key: 'workflow_id',
            label: 'Workflow ID',
            question: 'Which workflow should I edit? Share the workflow ID (for Sandbox usually `default-sandbox`).',
          });
        }

        if (!type || !label) {
          return needsInput(name, {
            key: 'node_details',
            label: 'Node Details',
            question: 'Please tell me the node type and label to create.',
          });
        }

        const db = createServerClient();
        const { data, error } = await db.from('workflow_nodes').insert({
          workflow_id: workflowId,
          type,
          label,
          config: args.config || {},
          position_x: asNumber(args.position_x, 200),
          position_y: asNumber(args.position_y, 200),
          state: 'draft',
        }).select().single();
        result = error ? { error: error.message } : { ok: true, node: data };
        break;
      }

      case 'connect_nodes': {
        const workflowId = asNonEmptyString(args.workflow_id);
        const sourceId = asNonEmptyString(args.source_node_id);
        const targetId = asNonEmptyString(args.target_node_id);

        if (!workflowId || !sourceId || !targetId) {
          return needsInput(name, {
            key: 'edge_details',
            label: 'Edge Details',
            question: 'I need workflow_id, source_node_id, and target_node_id to connect nodes.',
          });
        }

        const db = createServerClient();
        const { data, error } = await db.from('workflow_edges').insert({
          workflow_id: workflowId,
          source_id: sourceId,
          target_id: targetId,
        }).select().single();
        result = error ? { error: error.message } : { ok: true, edge: data };
        break;
      }

      case 'execute_workflow': {
        const workflowId = asNonEmptyString(args.workflow_id);

        if (!workflowId) {
          return needsInput(name, {
            key: 'workflow_id',
            label: 'Workflow ID',
            question: 'Which workflow should I execute?',
          });
        }

        result = await apiPost(`/api/workflows/${workflowId}/execute`, {
          inputData: args.input_data || {},
        });

        if ((result as any)?.requires_input && (result as any)?.request) {
          const request = (result as any).request;
          return needsInput(name, {
            key: String(request.key || 'workflow_input'),
            label: String(request.label || 'Workflow Input'),
            question: String(request.question || 'I need additional input before I can execute this workflow.'),
            sensitive: Boolean(request.sensitive),
            reason: String(request.reason || ''),
          });
        }

        break;
      }

      case 'get_workflow_status': {
        const workflowId = asNonEmptyString(args.workflow_id);

        if (!workflowId) {
          return needsInput(name, {
            key: 'workflow_id',
            label: 'Workflow ID',
            question: 'Which workflow should I inspect?',
          });
        }

        const db = createServerClient();
        const [{ data: workflow }, { data: nodes }, { data: edges }] = await Promise.all([
          db.from('workflows').select('*').eq('id', workflowId).maybeSingle(),
          db.from('workflow_nodes').select('*').eq('workflow_id', workflowId),
          db.from('workflow_edges').select('*').eq('workflow_id', workflowId),
        ]);
        result = {
          workflow,
          nodes: nodes || [],
          edges: edges || [],
          draft_count: nodes?.filter(n => n.state === 'draft').length || 0,
          approved_count: nodes?.filter(n => n.state === 'approved').length || 0,
          running_count: nodes?.filter(n => n.state === 'running').length || 0,
        };
        break;
      }

      default:
        return failure(name, `Unknown tool: ${name}`);
    }

    if ((result as any)?.error) {
      return failure(name, String((result as any).error), result);
    }

    return success(name, result);
  } catch (err: any) {
    return failure(name, err?.message || 'Tool execution failed');
  }
}

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const envelope = await executeToolEnvelope(name, args);
  return JSON.stringify(envelope);
}
