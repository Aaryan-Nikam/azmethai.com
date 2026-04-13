import { Webhook, Mail, Target, Globe, MessageSquare, Database, Users, Zap, Bot } from "lucide-react";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  nodes: any[];
  edges: any[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "outbound-sales",
    name: "Outbound Sales (Lead Gen Pro)",
    description: "Automatically find leads via Hunter.io, verify them, and send personalized outreach via Gmail.",
    icon: Target,
    color: "emerald",
    nodes: [
      {
        id: "trigger",
        type: "trigger",
        position: { x: 400, y: 100 },
        data: {
          label: "Webhook Trigger",
          icon: Webhook,
          color: "cyan",
          desc: "Starts when HTTP called",
          config: { path: "sales-inbound", httpMethod: "POST" }
        }
      },
      {
        id: "hunter",
        type: "action",
        position: { x: 400, y: 300 },
        data: {
          label: "Hunter Domain Search",
          icon: Globe,
          color: "blue",
          desc: "Find emails for a domain",
          config: { operation: "domainSearch", domain: "={{$json.domain}}", limit: 5 }
        }
      },
      {
        id: "claude",
        type: "agent",
        position: { x: 400, y: 550 },
        data: {
          label: "Claude Personalization",
          icon: Bot,
          color: "violet",
          agentType: "openclaw",
          task: "Write a short, professional outreach email for {{$json.email}}."
        }
      },
      {
        id: "gmail",
        type: "action",
        position: { x: 400, y: 850 },
        data: {
          label: "Send Outreach Email",
          icon: Mail,
          color: "indigo",
          config: { resource: "message", operation: "send", sendTo: "={{$json.email}}" }
        }
      }
    ],
    edges: [
      { id: "e1-2", source: "trigger", target: "hunter", type: "azmeth" },
      { id: "e2-3", source: "hunter", target: "claude", type: "azmeth" },
      { id: "e3-4", source: "claude", target: "gmail", type: "azmeth" }
    ]
  },
  {
    id: "crm-sync",
    name: "HubSpot to Slack Sync",
    description: "Listen for new deals in HubSpot and post a notification to the Slack sales channel.",
    icon: Users,
    color: "orange",
    nodes: [
      {
        id: "trigger",
        type: "trigger",
        position: { x: 400, y: 100 },
        data: {
          label: "HubSpot Deal Created",
          icon: Users,
          color: "orange",
          desc: "Triggers on new deals",
          config: { resource: "deal", event: "created" }
        }
      },
      {
        id: "slack",
        type: "action",
        position: { x: 400, y: 300 },
        data: {
          label: "Post to Slack",
          icon: MessageSquare,
          color: "rose",
          desc: "Notify Sales Team",
          config: { channel: "sales-alerts", text: "New Deal: {{$json.properties.dealname}} - ${{$json.properties.amount}}" }
        }
      }
    ],
    edges: [
      { id: "e1-2", source: "trigger", target: "slack", type: "azmeth" }
    ]
  },
  {
    id: "ai-support",
    name: "AI Support Auto-Responder",
    description: "Extract support tickets from Postgres, analyze intent with AI, and reply via Gmail.",
    icon: MessageSquare,
    color: "violet",
    nodes: [
      {
        id: "trigger",
        type: "trigger",
        position: { x: 400, y: 100 },
        data: {
          label: "New Ticket (Postgres)",
          icon: Database,
          color: "emerald",
          desc: "Watch for new rows",
          config: { table: "support_tickets" }
        }
      },
      {
        id: "agent",
        type: "agent",
        position: { x: 400, y: 350 },
        data: {
          label: "Support Agent",
          icon: Bot,
          color: "violet",
          agentType: "ops",
          task: "Analyze the issue: {{$json.description}} and provide a helpful resolution steps."
        }
      },
      {
        id: "reply",
        type: "action",
        position: { x: 400, y: 650 },
        data: {
          label: "Send Reply",
          icon: Mail,
          color: "indigo",
          config: { operation: "send", subject: "Re: [Support] {{$json.ticket_id}}" }
        }
      }
    ],
    edges: [
      { id: "e1-2", source: "trigger", target: "agent", type: "azmeth" },
      { id: "e2-3", source: "agent", target: "reply", type: "azmeth" }
    ]
  }
];
