import { create } from "zustand";
import { type Node, type Edge, addEdge, type Connection } from "@xyflow/react";

export type AgentStatus = "idle" | "thinking" | "executing" | "error" | "done";
export type NodeType = "agent" | "tool" | "code" | "context" | "workflow" | "connector" | "plan";

export type LogEntry = {
  id: string;
  timestamp: Date;
  actionType: "THINKING" | "TOOL" | "CODE" | "QUERY" | "WORKFLOW";
  description: string;
  nodeId?: string;
};

export type TaskStage = "init" | "planning" | "executing" | "reviewing" | "done";

export type AgentNodeData = {
  label: string;
  status: AgentStatus;
  currentTask?: string;
  lastAction?: string;
  progress?: number;
};

export type ToolNodeData = {
  label: string;
  toolName: string;
  toolIcon: string;
  status: "idle" | "calling" | "done" | "error";
  inputParams?: Record<string, string>;
  output?: string;
  callCount: number;
  lastCalled?: Date;
  errorMessage?: string;
};

export type CodeNodeData = {
  label: string;
  filename: string;
  language: string;
  code: string;
  mode: "editor" | "terminal" | "form";
  terminalLines: string[];
  exitCode?: number | null;
  isRunning: boolean;
};

export type ContextNodeData = {
  label: string;
  dbName: string;
  recordCount: number;
  lastQuery?: string;
  queryResults?: Array<Record<string, string>>;
  status: "idle" | "querying" | "writing";
  relevanceScores?: number[];
};

export type WorkflowNodeData = {
  label: string;
  workflowName: string;
  runMode: "MANUAL" | "AUTO" | "SCHEDULED";
  steps: Array<{ name: string; status: "pending" | "running" | "done" | "error"; icon: string }>;
  status: "idle" | "running" | "done" | "error";
  runCount: number;
  lastDuration?: string;
  triggerInfo?: string;
};

export type ConnectorNodeData = {
  label: string;
  serviceName: string;
  serviceIcon: string;
  authStatus: "connected" | "expired" | "rate_limited";
  recentActivity: Array<{ endpoint: string; time: Date; status: number }>;
  rateLimitPercent: number;
  quotaRemaining: number;
};

export type PlanNodeData = {
  label: string;
  taskTitle: string;
  subtasks: Array<{
    id: string;
    text: string;
    status: "pending" | "running" | "done" | "error";
    assignee?: string;
  }>;
};

export type AnyNodeData =
  | AgentNodeData
  | ToolNodeData
  | CodeNodeData
  | ContextNodeData
  | WorkflowNodeData
  | ConnectorNodeData
  | PlanNodeData;

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

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  addLog: (log: Omit<LogEntry, "id" | "timestamp">) => void;
  setAgentStatus: (status: AgentStatus) => void;
  setTaskStage: (stage: TaskStage) => void;
  highlightNode: (nodeId: string) => void;
  toggleSidebar: () => void;
  updateNodeData: (nodeId: string, data: Partial<AnyNodeData>) => void;
  incrementElapsed: () => void;
  spawnNode: (type: string, sourceId: string, customData?: any) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const initialNodes: Node[] = [];

const edgeBase = {
  type: "animated" as const,
  style: { stroke: "#2a2a32", strokeWidth: 1.5 },
};

const initialEdges: Edge[] = [];

const initialLogs: LogEntry[] = [];

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: initialNodes,
  edges: initialEdges,
  logs: initialLogs,
  agentStatus: "idle",
  taskTitle: "Awaiting Task",
  taskStage: "init",
  activeModel: "Claude 3.7 Sonnet",
  tokenUsed: 0,
  tokenBudget: 100000,
  elapsedSeconds: 0,
  highlightedNodeId: null,
  sidebarOpen: true,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        { ...connection, animated: true, style: { stroke: "#00ffb4", strokeWidth: 2 } },
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
  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),
  incrementElapsed: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
  spawnNode: (type, sourceId, customData) => {
    set((state) => {
      const sourceNode = state.nodes.find(n => n.id === sourceId) || { position: { x: 400, y: 200 } };
      const newId = `${type}-${uid()}`;
      
      const newNode: Node = {
        id: newId,
        type: type, // ReactFlow looks at this prop to map to `nodeTypes` Component
        position: {
          x: sourceNode.position.x + (Math.random() > 0.5 ? 200 : -200),
          y: sourceNode.position.y + 150 + (Math.random() * 50)
        },
        data: {
          label: type.replace('Node', ''),
          ...customData
        }
      };

      const newEdge: Edge = {
        id: `e-${sourceId}-${newId}`,
        source: sourceId,
        target: newId,
        type: 'animated',
        style: { stroke: "#4ade80", strokeWidth: 1.5 }
      };

      return {
        nodes: [...state.nodes, newNode],
        edges: [...state.edges, newEdge]
      };
    });
  }
}));
