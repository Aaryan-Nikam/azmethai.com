/**
 * agent-tools.ts
 * 22 OpenAI-format tool definitions across 4 groups:
 * - Setter (8): inbox, replies, approvals, agent config
 * - Outbound (8): campaigns, leads, pipeline  
 * - Cross-system (3): unified leads, search, dashboard summary
 * - Sandbox (4): workflow node management, execution
 */

export type ToolDef = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
};

// ─── SETTER TOOLS ─────────────────────────────────────────────────────────────

const setterTools: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'get_inbox_threads',
      description: 'Fetch recent conversation threads from the AI Setter inbox. Use this when the user asks about leads, conversations, or inbox activity.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max threads to return (default 20)', default: 20 },
          status: {
            type: 'string',
            enum: ['all', 'new', 'contacted', 'qualified', 'meeting_set', 'disqualified'],
            description: 'Filter by lead status',
          },
          channel: {
            type: 'string',
            enum: ['instagram', 'whatsapp', 'email', 'linkedin', 'voice'],
            description: 'Filter by communication channel',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reply_to_lead',
      description: 'Send a manual reply to a specific lead in the inbox. Use when the user wants to respond to someone.',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string', description: 'The lead_id to reply to' },
          message: { type: 'string', description: 'The reply text to send' },
        },
        required: ['lead_id', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'approve_message',
      description: 'Approve a pending AI-drafted message in the approval queue.',
      parameters: {
        type: 'object',
        properties: {
          approval_id: { type: 'string', description: 'The approval queue item ID to approve' },
          edits: { type: 'string', description: 'Optional edited version of the message before approving' },
        },
        required: ['approval_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_setter_stats',
      description: 'Get AI Setter performance metrics: total leads, meetings booked, reply rate, funnel breakdown, channel distribution.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', '7d', '30d', 'all'],
            description: 'Time period for stats',
            default: '7d',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'configure_setter_agent',
      description: 'Update the AI setter agent configuration: model, system prompt, temperature, brand voice, primary goal.',
      parameters: {
        type: 'object',
        properties: {
          business_name: { type: 'string' },
          brand_voice: { type: 'string', enum: ['professional', 'casual', 'aggressive', 'consultative'] },
          primary_goal: { type: 'string' },
          system_prompt: { type: 'string' },
          model_version: { type: 'string' },
          temperature: { type: 'number', minimum: 0, maximum: 2 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_agent_api_key',
      description: 'Store or update the tenant OpenAI API key and switch billing mode to custom. Use this when the user provides their key in chat.',
      parameters: {
        type: 'object',
        properties: {
          api_key: { type: 'string', description: 'User-provided OpenAI API key (stored securely in backend config).' },
        },
        required: ['api_key'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_agents_in_registry',
      description: 'List all agents registered in the agent registry with their specializations and status.',
      parameters: {
        type: 'object',
        properties: {
          active_only: { type: 'boolean', default: true },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_agent_to_registry',
      description: 'Add a new specialized agent to the registry for intent-based routing.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Agent name' },
          specializations: {
            type: 'array',
            items: { type: 'string', enum: ['PRICING_INQUIRY', 'DEMO_REQUEST', 'DISCOVERY_CALL', 'OBJECTION', 'CLOSING', 'SUPPORT', 'COLD_RESPONSE', '*'] },
            description: 'Intent types this agent handles',
          },
          system_prompt: { type: 'string' },
          model: { type: 'string', default: 'gpt-4o-mini' },
          priority: { type: 'number', default: 0 },
        },
        required: ['name', 'specializations', 'system_prompt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_agent_config',
      description: 'Update an existing agent in the registry by ID.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          name: { type: 'string' },
          system_prompt: { type: 'string' },
          is_active: { type: 'boolean' },
          priority: { type: 'number' },
          specializations: { type: 'array', items: { type: 'string' } },
        },
        required: ['agent_id'],
      },
    },
  },
];

// ─── OUTBOUND TOOLS ───────────────────────────────────────────────────────────

const outboundTools: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'create_campaign',
      description: 'Create a new outbound campaign with a target ICP, framework, and channel config.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          icp: {
            type: 'object',
            description: 'Ideal customer profile: industry, company_size, job_titles, pain_points',
            properties: {
              industry: { type: 'string' },
              company_size: { type: 'string' },
              job_titles: { type: 'array', items: { type: 'string' } },
            },
          },
          framework: { type: 'string', enum: ['AIDA', 'PAS', 'SPIN', 'Challenger', 'SNAP'] },
          channels: { type: 'array', items: { type: 'string', enum: ['email', 'linkedin', 'instagram', 'whatsapp'] } },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_campaign_status',
      description: 'Get full status of a campaign: leads scraped, qualified, sent, replied, reply rate.',
      parameters: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string', description: 'Campaign UUID' },
        },
        required: ['campaign_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_leads',
      description: 'List outbound leads with optional filtering.',
      parameters: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string' },
          stage: { type: 'string', enum: ['scraped', 'qualified', 'personalized', 'sent', 'replied', 'meeting_set'] },
          limit: { type: 'number', default: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pipeline_stats',
      description: 'Get outbound pipeline totals: total leads, qualified, sent, replied, reply rate across all campaigns.',
      parameters: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string', description: 'Scope to specific campaign (optional)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'trigger_stage_for_lead',
      description: 'Move a specific outbound lead to the next pipeline stage (research, qualify, personalise/personalize, send).',
      parameters: {
        type: 'object',
        properties: {
          lead_id: { type: 'string' },
          stage: { type: 'string', enum: ['research', 'qualify', 'personalise', 'personalize', 'send'] },
        },
        required: ['lead_id', 'stage'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scrape_leads_from_url',
      description: 'Trigger the lead scraper to extract prospects from a URL (LinkedIn search, Apollo, etc.).',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Source URL to scrape leads from' },
          campaign_id: { type: 'string' },
          max_leads: { type: 'number', default: 50, maximum: 500 },
          apify_api_key: { type: 'string', description: 'Optional runtime Apify API key if not already configured in environment' },
        },
        required: ['url', 'campaign_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'pause_campaign',
      description: 'Pause a running outbound campaign.',
      parameters: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string' },
        },
        required: ['campaign_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resume_campaign',
      description: 'Resume a paused outbound campaign.',
      parameters: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string' },
        },
        required: ['campaign_id'],
      },
    },
  },
];

// ─── CROSS-SYSTEM TOOLS ───────────────────────────────────────────────────────

const crossSystemTools: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'get_unified_leads',
      description: 'Fetch leads from both inbound (AI Setter) and outbound (campaigns) in one view. Use when user asks about "all leads" or "total pipeline".',
      parameters: {
        type: 'object',
        properties: {
          source: { type: 'string', enum: ['all', 'inbound', 'outbound'], default: 'all' },
          stage: { type: 'string' },
          score_min: { type: 'number' },
          limit: { type: 'number', default: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_leads',
      description: 'Full-text search across all leads (inbound + outbound) by name, company, or email.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term' },
          limit: { type: 'number', default: 10 },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_command_center_summary',
      description: 'Get a full platform summary: total leads, meetings booked, outbound sent, system health, recent activity.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

// ─── SANDBOX TOOLS ────────────────────────────────────────────────────────────

const sandboxTools: ToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'create_workflow_node',
      description: 'Add a new node to the active workflow canvas. The node will appear in real time.',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string' },
          type: {
            type: 'string',
            enum: ['trigger', 'action', 'agent', 'code', 'condition', 'delay', 'email', 'webhook'],
          },
          label: { type: 'string' },
          config: { type: 'object', description: 'Node-specific configuration' },
          position_x: { type: 'number', default: 200 },
          position_y: { type: 'number', default: 200 },
        },
        required: ['workflow_id', 'type', 'label'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'connect_nodes',
      description: 'Connect two nodes on the workflow canvas with an edge.',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string' },
          source_node_id: { type: 'string' },
          target_node_id: { type: 'string' },
        },
        required: ['workflow_id', 'source_node_id', 'target_node_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_workflow',
      description: 'Execute a saved workflow. Shows a confirmation if nodes are still in draft state.',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string' },
          input_data: { type: 'object', description: 'Input data to pass to the workflow' },
        },
        required: ['workflow_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_workflow_status',
      description: 'Get the current state of a workflow and its nodes.',
      parameters: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string' },
        },
        required: ['workflow_id'],
      },
    },
  },
];

// ─── Export ───────────────────────────────────────────────────────────────────

export const agentTools: ToolDef[] = [
  ...setterTools,
  ...outboundTools,
  ...crossSystemTools,
  ...sandboxTools,
];

export const TOOL_NAMES = agentTools.map(t => t.function.name);
