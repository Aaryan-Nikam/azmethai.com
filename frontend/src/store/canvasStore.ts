import { create } from "zustand";
import { type Node, type Edge, addEdge, type Connection } from "@xyflow/react";

// ─── Unified Status & Control Types ─────────────────────────────────────────

export type NodeStatus = "idle" | "pending" | "running" | "awaiting_input" | "done" | "error";
export type AutonomyMode = "auto" | "approval_required";
export type AgentStatus = "idle" | "thinking" | "executing" | "error" | "done";
export type NodeType = "agent" | "tool" | "code" | "context" | "workflow" | "connector" | "plan" | "decision";
export type TaskStage = "init" | "planning" | "executing" | "reviewing" | "done";

// ─── Shared Node Fields (mixed into every node data type) ───────────────────

export interface BaseNodeFields {
  label: string;
  status: NodeStatus;
  autonomyMode: AutonomyMode;
  intentPreview?: string;       // What the agent plans to do — shown before execution
  confidence?: number;          // 0–1 score
  traceLog?: string[];          // Streaming execution trace visible inside the node
  userInput?: {                 // HITL pause/resume
    prompt: string;
    value?: string;
  };
}

// ─── Log Entry ──────────────────────────────────────────────────────────────

export type LogEntry = {
  id: string;
  timestamp: Date;
  actionType: "THINKING" | "TOOL" | "CODE" | "QUERY" | "WORKFLOW" | "DECISION";
  description: string;
  nodeId?: string;
};

// ─── Per-Node Data Types ────────────────────────────────────────────────────

export type AgentNodeData = BaseNodeFields & {
  currentTask?: string;
  lastAction?: string;
  progress?: number;           // 0–1
  model?: string;
};

export type ToolNodeData = BaseNodeFields & {
  toolName: string;
  toolIcon: string;
  inputParams?: Record<string, string>;
  output?: string;
  callCount: number;
  lastCalled?: Date;
  errorMessage?: string;
};

export type CodeNodeData = BaseNodeFields & {
  filename: string;
  language: string;
  code: string;
  mode: "editor" | "terminal" | "form";
  terminalLines: string[];
  exitCode?: number | null;
  isRunning: boolean;
};

export type ContextNodeData = BaseNodeFields & {
  dbName: string;
  recordCount: number;
  lastQuery?: string;
  queryResults?: Array<Record<string, string>>;
  relevanceScores?: number[];
};

export type WorkflowNodeData = BaseNodeFields & {
  workflowName: string;
  runMode: "MANUAL" | "AUTO" | "SCHEDULED";
  steps: Array<{ name: string; status: "pending" | "running" | "done" | "error"; icon: string }>;
  runCount: number;
  lastDuration?: string;
  triggerInfo?: string;
};

export type ConnectorNodeData = BaseNodeFields & {
  serviceName: string;
  serviceIcon: string;
  authStatus: "connected" | "expired" | "rate_limited";
  recentActivity: Array<{ endpoint: string; time: Date; status: number }>;
  rateLimitPercent: number;
  quotaRemaining: number;
};

export type PlanNodeData = BaseNodeFields & {
  taskTitle: string;
  subtasks: Array<{
    id: string;
    text: string;
    status: "pending" | "running" | "done" | "error";
    assignee?: string;
  }>;
};

export type DecisionNodeData = BaseNodeFields & {
  condition: string;              // The condition being evaluated
  result?: "true" | "false";     // Which branch was taken
  trueLabel?: string;            // Label for the true branch
  falseLabel?: string;           // Label for the false branch
  reasoning?: string;            // Why the agent chose this branch
};

export type AnyNodeData =
  | AgentNodeData
  | ToolNodeData
  | CodeNodeData
  | ContextNodeData
  | WorkflowNodeData
  | ConnectorNodeData
  | PlanNodeData
  | DecisionNodeData;

// ─── Store ──────────────────────────────────────────────────────────────────

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  logs: LogEntry[];
  agentStatus: AgentStatus;
  taskTitle: string;
  taskStage: TaskStage;
  activeModel: string;
  tokenUsed: number;
  tokenBudget: number;
  elapsedSeconds: number;
  highlightedNodeId: string | null;
  sidebarOpen: boolean;
  darkMode: boolean;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  addLog: (log: Omit<LogEntry, "id" | "timestamp">) => void;
  setAgentStatus: (status: AgentStatus) => void;
  setTaskStage: (stage: TaskStage) => void;
  highlightNode: (nodeId: string) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  updateNodeData: (nodeId: string, data: Partial<AnyNodeData>) => void;
  incrementElapsed: () => void;
  spawnNode: (type: string, sourceId: string, customData?: any) => void;
  approveNode: (nodeId: string) => void;
  rejectNode: (nodeId: string) => void;
  submitUserInput: (nodeId: string, value: string) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  logs: [],
  agentStatus: "idle",
  taskTitle: "Awaiting Task",
  taskStage: "init",
  activeModel: "GPT-4o",
  tokenUsed: 0,
  tokenBudget: 100000,
  elapsedSeconds: 0,
  highlightedNodeId: null,
  sidebarOpen: true,
  darkMode: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        { ...connection, animated: true, style: { stroke: "#3b82f6", strokeWidth: 1.5 } },
        state.edges
      ),
    })),
  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs,
        { ...log, id: uid(), timestamp: new Date() },
      ],
    })),
  setAgentStatus: (status) => set({ agentStatus: status }),
  setTaskStage: (stage) => set({ taskStage: stage }),
  highlightNode: (nodeId) => {
    set({ highlightedNodeId: nodeId });
    setTimeout(() => set({ highlightedNodeId: null }), 1500);
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),
  incrementElapsed: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

  // ── HITL Controls ───────────────────────────────────────────────────────
  approveNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status: "running" } } : n
      ),
    })),
  rejectNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status: "idle", intentPreview: undefined } } : n
      ),
    })),
  submitUserInput: (nodeId, value) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                status: "running",
                userInput: { ...(n.data as any).userInput, value },
              },
            }
          : n
      ),
    })),

  spawnNode: (type, sourceId, customData) => {
    set((state) => {
      const sourceNode = state.nodes.find(n => n.id === sourceId) || { position: { x: 400, y: 200 } };
      const newId = `${type}-${uid()}`;

      const newNode: Node = {
        id: newId,
        type,
        position: {
          x: sourceNode.position.x + (Math.random() > 0.5 ? 220 : -220),
          y: sourceNode.position.y + 150 + (Math.random() * 50)
        },
        data: {
          label: type.replace('Node', ''),
          status: 'idle',
          autonomyMode: 'approval_required',
          ...customData
        }
      };

      const newEdge: Edge = {
        id: `e-${sourceId}-${newId}`,
        source: sourceId,
        target: newId,
        type: 'animated',
        style: { stroke: "#3b82f6", strokeWidth: 1.5 }
      };

      return {
        nodes: [...state.nodes, newNode],
        edges: [...state.edges, newEdge]
      };
    });
  }
}));
