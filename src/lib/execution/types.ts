import { 
  INodeExecutionData,
  IExecuteData,
  IWorkflowExecuteAdditionalData,
  INodeType,
  INodeTypes
} from 'n8n-workflow';

export interface AzmethWorkflow {
  id: string;
  name: string;
  nodes: AzmethNode[];
  edges: AzmethEdge[];
}

export interface AzmethNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    config?: Record<string, any>;
    credentials?: Record<string, any>;
  };
}

export interface AzmethEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
}

export interface AzmethNodeDefinition {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number] | { x: number, y: number };
  parameters: Record<string, any>;
  credentials?: Record<string, string>;
}

export interface AzmethConnection {
  node: string;
  type: string;
  index: number;
}

export interface AzmethWorkflowDefinition {
  id: string;
  name: string;
  nodes: AzmethNodeDefinition[];
  connections: Record<string, { main: AzmethConnection[][] }>;
  active: boolean;
  settings?: any;
  staticData?: any;
}
