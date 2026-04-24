/**
 * Azmeth Workflow Node Catalog Bridge
 *
 * Converts generated Azmeth Engine node definitions into the lightweight catalog format
 * used by the workflow builder UI. This avoids loading all 240 node schemas
 * upfront — schemas are loaded on-demand when a node is selected.
 */

import { Globe, Database, Mail, MessageSquare, Webhook, Clock,
         Code, Zap, Bot, Shield, Activity, Package, FileText,
         BarChart, Settings, Hash, Phone, CreditCard,
         GitBranch, Image, Music, ShoppingCart, Users, Cloud,
         Link, Layout, Video, Bookmark, Bell, Key } from 'lucide-react';
import type { AzmethNodeDefinition } from './types';

// ── Icon mapping: Azmeth Engine icon names → Lucide React ──────────────────────────

const ICON_MAP: Record<string, any> = {
  default: Globe,
  webhook: Webhook,
  clock: Clock,
  database: Database,
  mail: Mail,
  gmail: Mail,
  slack: MessageSquare,
  code: Code,
  bot: Bot,
  zap: Zap,
  activity: Activity,
  shield: Shield,
  package: Package,
  'file-text': FileText,
  'bar-chart': BarChart,
  settings: Settings,
  hash: Hash,
  phone: Phone,
  'credit-card': CreditCard,
  'git-branch': GitBranch,
  image: Image,
  music: Music,
  'shopping-cart': ShoppingCart,
  users: Users,
  cloud: Cloud,
  link: Link,
  layout: Layout,
  video: Video,
  bookmark: Bookmark,
  bell: Bell,
  key: Key,
};

// ── Color mapping: group → color class ───────────────────────────────────

const GROUP_COLOR_MAP: Record<string, string> = {
  trigger: 'amber',
  output: 'rose',
  input: 'blue',
  transform: 'violet',
  utility: 'slate',
  ai: 'violet',
};

function iconForNode(node: AzmethNodeDefinition): any {
  // Try exact name match first
  const lower = (node.icon || node.name || '').toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return Globe;
}

function colorForNode(node: AzmethNodeDefinition): string {
  return GROUP_COLOR_MAP[node.group] || 'indigo';
}

function tabForNode(node: AzmethNodeDefinition): string {
  if (node.group === 'trigger') return 'explore';
  if (node.group === 'ai') return 'ai';
  const name = node.name.toLowerCase();
  if (name.includes('webhook') || name.includes('schedule') || name.includes('cron')) return 'explore';
  if (name.includes('code') || name.includes('router') || name.includes('filter') || name.includes('split')) return 'utility';
  return 'apps';
}

// ── Catalog entry type (matches tool-builder NODE_COMPONENTS shape) ───────

export interface CatalogNode {
  id: string;
  label: string;
  desc: string;
  icon: any;
  color: string;
  tab: string;
  /** Schema properties (loaded lazily from generated nodes) */
  schema?: AzmethNodeDefinition;
}

// ── Static node catalog (hand-curated priority nodes, shown first) ────────

export const STATIC_CATALOG_NODES: CatalogNode[] = [
  { id: 'webhook',    label: 'Webhook Trigger',  desc: 'Starts when HTTP called',   icon: Webhook,        color: 'amber',   tab: 'explore' },
  { id: 'schedule',   label: 'Schedule',          desc: 'Run on cron interval',       icon: Clock,          color: 'blue',    tab: 'explore' },
  { id: 'llm',        label: 'AI Agent',          desc: 'Process with LLM',           icon: Bot,            color: 'violet',  tab: 'ai' },
  { id: 'postgres',   label: 'PostgreSQL',        desc: 'Run SQL Query',              icon: Database,       color: 'emerald', tab: 'apps' },
  { id: 'http',       label: 'HTTP Request',      desc: 'Fetch external API',         icon: Globe,          color: 'slate',   tab: 'utility' },
  { id: 'code',       label: 'Code',              desc: 'Execute JS/TS',              icon: Code,           color: 'slate',   tab: 'utility' },
  { id: 'slack',      label: 'Slack',             desc: 'Post to channel',            icon: MessageSquare,  color: 'rose',    tab: 'apps' },
  { id: 'gmail',      label: 'Gmail',             desc: 'Send or read email',         icon: Mail,           color: 'indigo',  tab: 'apps' },
  { id: 'router',     label: 'Router',            desc: 'Branching logic',            icon: GitBranch,      color: 'sky',     tab: 'utility' },
  { id: 'google-sheets', label: 'Google Sheets',  desc: 'Read & Write Rows',          icon: BarChart,       color: 'emerald', tab: 'apps' },
];

// ── Static node version mapping (short ID → latest generated ID) ──────────
const STATIC_VERSION_MAP: Record<string, string> = {
  slack: 'slackv2',
  gmail: 'gmailv2',
  'google-sheets': 'googlesheetsv2',
  hubspot: 'hubspotv2',
  postgres: 'postgresv2',
  http: 'httprequestv3',
  webhook: 'webhook',
  schedule: 'scheduletrigger',
  router: 'if',
};

// ── Lazy loader: imports single node schema on demand ─────────────────────

const nodeSchemaCache: Record<string, AzmethNodeDefinition | null> = {};

export async function loadNodeSchema(nodeId: string): Promise<AzmethNodeDefinition | null> {
  const mappedId = STATIC_VERSION_MAP[nodeId] || nodeId;
  const lookupId = mappedId.toLowerCase();
  
  if (nodeSchemaCache[lookupId] !== undefined) return nodeSchemaCache[lookupId];

  try {
    const mod = await import('./nodes/generated/index');
    const def = mod.GENERATED_NODES[lookupId] ?? null;
    nodeSchemaCache[lookupId] = def;
    return def;
  } catch {
    nodeSchemaCache[lookupId] = null;
    return null;
  }
}

// ── Get all catalog nodes including generated ones ─────────────────────────

let _generatedCatalog: CatalogNode[] | null = null;

export async function getAllCatalogNodes(): Promise<CatalogNode[]> {
  if (_generatedCatalog) return _generatedCatalog;

  try {
    const mod = await import('./nodes/generated/index');
    const allGenerated = mod.GENERATED_NODES;

    // 1. Build catalog entries from ALL generated nodes
    const generatedEntries: CatalogNode[] = Object.values(allGenerated).map((n: any) => ({
      id: n.name,
      label: n.displayName,
      desc: n.description || '',
      icon: iconForNode(n),
      color: colorForNode(n),
      tab: tabForNode(n),
      schema: n,
    }));

    // 2. Enrich and filter STATIC_CATALOG_NODES
    const staticIds = new Set(STATIC_CATALOG_NODES.map(n => n.id));
    
    const enrichedStatic: CatalogNode[] = STATIC_CATALOG_NODES.map(s => {
      const generatedId = STATIC_VERSION_MAP[s.id] || s.id;
      const schema = allGenerated[generatedId.toLowerCase()];
      return { ...s, schema: schema || s.schema };
    });

    // 3. Combine, ensuring no duplicates if a static node is also in generated
    const finalNodes = [...enrichedStatic];
    const enrichedIds = new Set(enrichedStatic.map(n => n.id));
    const generatedNameIds = new Set(Object.values(allGenerated).map((n: any) => n.name));

    generatedEntries.forEach(n => {
       // Only add if it's not a static node (we already have it) 
       // and not a versioned alias of a static node
       const isStaticAlias = Object.values(STATIC_VERSION_MAP).includes(n.id);
       if (!enrichedIds.has(n.id) && !isStaticAlias) {
         finalNodes.push(n);
       }
    });

    _generatedCatalog = finalNodes;
    return _generatedCatalog;
  } catch (e) {
    console.warn('Failed to load generated node catalog:', e);
    _generatedCatalog = STATIC_CATALOG_NODES;
    return STATIC_CATALOG_NODES;
  }
}

// ── Synchronous version (returns static + cached generated) ───────────────

export function getCatalogNodesSync(): CatalogNode[] {
  return _generatedCatalog ?? STATIC_CATALOG_NODES;
}

// ── Search helper ─────────────────────────────────────────────────────────

export function searchCatalog(nodes: CatalogNode[], query: string): CatalogNode[] {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();
  return nodes.filter(n =>
    n.label.toLowerCase().includes(q) ||
    n.desc.toLowerCase().includes(q) ||
    n.id.toLowerCase().includes(q)
  );
}
