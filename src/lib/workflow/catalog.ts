import {
  Webhook, Clock, Bot, Code, Globe, Database, Network,
  GitBranch, Repeat, Link, User, Zap, Image as ImageIcon,
  FileText, Activity, Layers, Send, Play, MessageSquare
} from 'lucide-react';
import type { AzmethNodeDefinition } from './types';

export interface CatalogNode {
  id: string;
  category: "AGENT TRIGGERS" | "AGENT LOGIC" | "AGENT CAPABILITIES" | "AGENT OUTPUT";
  label: string;
  desc: string;
  icon: any;
  color: string;
  schema?: AzmethNodeDefinition;
}

export const STATIC_CATALOG_NODES: CatalogNode[] = [
  // AGENT TRIGGERS
  { id: 'agent-activated', category: "AGENT TRIGGERS", label: 'Agent Activated', desc: 'role/prompt trigger', icon: Zap, color: 'cyan' },
  { id: 'webhook', category: "AGENT TRIGGERS", label: 'Webhook', desc: 'external signal', icon: Webhook, color: 'blue' },
  { id: 'timer', category: "AGENT TRIGGERS", label: 'Timer', desc: 'recurring agent task', icon: Clock, color: 'violet' },
  { id: 'human-message', category: "AGENT TRIGGERS", label: 'Human Message', desc: 'chat/inbox input', icon: User, color: 'emerald' },

  // AGENT LOGIC
  { id: 'branch', category: "AGENT LOGIC", label: 'Branch', desc: 'if/else based on reasoning', icon: GitBranch, color: 'amber' },
  { id: 'loop', category: "AGENT LOGIC", label: 'Loop', desc: 'agent retries', icon: Repeat, color: 'orange' },
  { id: 'parallel', category: "AGENT LOGIC", label: 'Parallel', desc: 'multi-agent swarm', icon: Network, color: 'rose' },

  // AGENT CAPABILITIES
  { id: 'code-exec', category: "AGENT CAPABILITIES", label: 'CODE EXEC', desc: 'Python/JS/shell', icon: Code, color: 'slate' },
  { id: 'vapi-call', category: "AGENT CAPABILITIES", label: 'VAPI CALL', desc: 'voice conversation node', icon: MessageSquare, color: 'indigo' },
  { id: 'llm-chain', category: "AGENT CAPABILITIES", label: 'LLM CHAIN', desc: 'prompt → model → output', icon: Bot, color: 'violet' },
  { id: 'image-gen', category: "AGENT CAPABILITIES", label: 'IMAGE GEN', desc: 'DALL-E/Stable Diffusion', icon: ImageIcon, color: 'pink' },
  { id: 'browser-agent', category: "AGENT CAPABILITIES", label: 'BROWSER AGENT', desc: 'headless Chrome + actions', icon: Globe, color: 'sky' },
  { id: 'file-process', category: "AGENT CAPABILITIES", label: 'FILE PROCESS', desc: 'upload/analyze/export', icon: FileText, color: 'emerald' },
  { id: 'database-agent', category: "AGENT CAPABILITIES", label: 'DATABASE AGENT', desc: 'SQL/NoSQL query', icon: Database, color: 'teal' },
  { id: 'api-agent', category: "AGENT CAPABILITIES", label: 'API AGENT', desc: 'REST/GraphQL caller', icon: Link, color: 'blue' },
  { id: 'open-canvas', category: "AGENT CAPABILITIES", label: 'OPEN CANVAS', desc: 'freestyle drawing/editing', icon: Layers, color: 'emerald' },

  // AGENT OUTPUT
  { id: 'human-notify', category: "AGENT OUTPUT", label: 'Human Notify', desc: 'Slack/Email', icon: Send, color: 'rose' },
  { id: 'webhook-emit', category: "AGENT OUTPUT", label: 'Webhook Emit', desc: 'Fire external HTTP', icon: Activity, color: 'cyan' },
  { id: 'file-save', category: "AGENT OUTPUT", label: 'File Save', desc: 'Write to bucket', icon: FileText, color: 'emerald' },
  { id: 'agent-end', category: "AGENT OUTPUT", label: 'Agent End', desc: 'Terminate flow', icon: Play, color: 'slate' },
];

export async function getAllCatalogNodes(): Promise<CatalogNode[]> {
  return STATIC_CATALOG_NODES;
}

export function getCatalogNodesSync(): CatalogNode[] {
  return STATIC_CATALOG_NODES;
}
