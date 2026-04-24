import { Webhook, Mail, Target, Globe } from "lucide-react";

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
        type: "webhook",
        position: { x: 100, y: 200 },
        data: {
          label: "Webhook Trigger",
          config: {
            path: "sales-inbound",
            httpMethod: "POST"
          }
        }
      },
      {
        id: "hunter",
        type: "hunter",
        position: { x: 400, y: 200 },
        data: {
          label: "Hunter Domain Search",
          config: {
            operation: "domainSearch",
            domain: "={{$json.domain}}",
            limit: 10,
            onlyEmails: true
          }
        }
      },
      {
        id: "claude",
        type: "llm",
        position: { x: 700, y: 200 },
        data: {
          label: "Claude Personalization",
          config: {
            provisionType: "claude-3-5",
            prompt: "Write a short, professional outreach email for {{$json.email}} at {{$json.domain}}. Context: They are {{$json.signal}}. Mention we can help with AI automation."
          }
        }
      },
      {
        id: "gmail",
        type: "gmail",
        position: { x: 1000, y: 200 },
        data: {
          label: "Send Outreach Email",
          config: {
            resource: "message",
            operation: "send",
            sendTo: "={{$json.email}}",
            subject: "Quick question about automation",
            bodyType: "html",
            body: "={{$node[\"claude\"].data.text}}"
          }
        }
      }
    ],
    edges: [
      { id: "e1-2", source: "trigger", target: "hunter", animated: true },
      { id: "e2-3", source: "hunter", target: "claude", animated: true },
      { id: "e3-4", source: "claude", target: "gmail", animated: true }
    ]
  }
];
