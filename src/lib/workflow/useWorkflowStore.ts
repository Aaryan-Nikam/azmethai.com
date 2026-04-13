import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  workflowName: string;
  logs: string[];
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  setSelectedNodeId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  addLog: (log: string) => void;
  
  addNode: (node: Node, targetEdgeId?: string) => void;
  updateNodeData: (id: string, data: any) => void;
  deleteNode: (id: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [
    {
      id: "code-exec-1",
      type: "code",
      position: { x: 400, y: 150 },
      data: { label: "Code Exec", status: "Idle", language: "Python", timeout: "30s", code: "print('Agent running')" }
    }
  ],
  edges: [],
  selectedNodeId: null,
  workflowName: "Brand New Automation",
  logs: [
    "[1m] Code Exec → executed in 1.2s ✓",
    "[30s] Browser → navigated google.com ✓"
  ],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, type: 'azmeth', animated: true }, get().edges),
    });
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setWorkflowName: (name) => set({ workflowName: name }),
  addLog: (log) => set({ logs: [log, ...get().logs] }),

  addNode: (newNode, targetEdgeId) => {
    const { nodes, edges } = get();
    
    // Logic to insert node into edge if targetEdgeId provided
    if (targetEdgeId) {
       const targetEdge = edges.find(e => e.id === targetEdgeId);
       if (targetEdge) {
          const newEdges = edges.filter(e => e.id !== targetEdgeId).concat([
            { id: `e_${targetEdge.source}-${newNode.id}`, source: targetEdge.source, target: newNode.id, type: 'azmeth', animated: true },
            { id: `e_${newNode.id}-${targetEdge.target}`, source: newNode.id, target: targetEdge.target, type: 'azmeth', animated: true }
          ]);
          set({ nodes: [...nodes, newNode], edges: newEdges });
          return;
       }
    }
    
    set({ nodes: [...nodes, newNode] });
  },

  updateNodeData: (id, newData) => {
    set({
      nodes: get().nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      ),
    });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },
}));
