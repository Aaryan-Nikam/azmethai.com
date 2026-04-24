'use client';

import React, { useCallback, useEffect } from 'react';
import { ReactFlowProvider, type Edge, type Node } from '@xyflow/react';
import { Bot, Database, GitBranch, RotateCcw, Sparkles, Wrench, Split, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import AgentCanvas from '@/components/AgentCanvas';
import AgentSidebar from '@/components/AgentSidebar';
import ContextStrip from '@/components/ContextStrip';
import { useCanvasStore } from '@/store/canvasStore';

type LogType = 'THINKING' | 'TOOL' | 'CODE' | 'QUERY' | 'WORKFLOW' | 'DECISION';

type AgentSandboxWindowProps = {
  latestInstruction: string;
  onAdoptPrompt: (prompt: string) => void;
};

const ROOT_NODE_ID = 'agent-root-azmeth';

const createRootNode = (): Node => ({
  id: ROOT_NODE_ID,
  type: 'agentNode',
  position: { x: 200, y: 180 },
  data: {
    label: 'Azmeth Agent',
    status: 'idle',
    autonomyMode: 'auto',
    currentTask: 'Waiting for orchestration instructions',
    progress: 0,
  },
  draggable: true,
});

const toTaskTitle = (instruction: string) => {
  const clean = instruction.replace(/\s+/g, ' ').trim();
  if (!clean) return 'Azmeth Agent Sandbox';
  return clean.length > 56 ? `${clean.slice(0, 56)}...` : clean;
};

function AgentSandboxPanel({ latestInstruction, onAdoptPrompt }: AgentSandboxWindowProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const darkMode = useCanvasStore((s) => s.darkMode);
  const toggleDarkMode = useCanvasStore((s) => s.toggleDarkMode);

  const ensureRootNode = useCallback(() => {
    const state = useCanvasStore.getState();
    const existing = state.nodes.find((node) => node.id === ROOT_NODE_ID);
    if (existing) return existing;
    const root = createRootNode();
    state.setNodes([...state.nodes, root]);
    return root;
  }, []);

  useEffect(() => {
    ensureRootNode();
    if (useCanvasStore.getState().taskTitle === 'Awaiting Task') {
      useCanvasStore.setState({ taskTitle: 'Azmeth Agent Sandbox' });
    }
  }, [ensureRootNode]);

  const appendNode = useCallback(
    (nodeType: string, nodeData: Record<string, unknown>, logType: LogType, description: string) => {
      const state = useCanvasStore.getState();
      const root = ensureRootNode();
      const siblingCount = state.nodes.filter((node) => node.id !== ROOT_NODE_ID).length;
      const lane = siblingCount % 5;
      const stack = Math.floor(siblingCount / 5);
      const nodeId = `${nodeType}-${Math.random().toString(36).slice(2, 8)}`;

      const newNode: Node = {
        id: nodeId,
        type: nodeType,
        position: {
          x: root.position.x + 300 + (stack * 210),
          y: root.position.y - 200 + (lane * 110),
        },
        data: {
          status: 'idle',
          autonomyMode: 'approval_required',
          ...nodeData,
        },
        draggable: true,
      };

      const newEdge: Edge = {
        id: `edge-${ROOT_NODE_ID}-${nodeId}`,
        source: ROOT_NODE_ID,
        target: nodeId,
        type: 'animated',
        style: { stroke: '#3b82f6', strokeWidth: 1.5 },
      };

      state.setNodes([...state.nodes, newNode]);
      state.setEdges([...state.edges, newEdge]);
      state.setAgentStatus('executing');
      state.setTaskStage('executing');
      state.updateNodeData(ROOT_NODE_ID, {
        status: 'running',
        currentTask: description,
        progress: Math.min(0.95, 0.25 + ((siblingCount + 1) * 0.08)),
      });
      state.addLog({ actionType: logType, description, nodeId });
    },
    [ensureRootNode]
  );

  const addEmployeeNode = useCallback((presetName?: string, presetTask?: string) => {
    const agentName = presetName ?? window.prompt('Employee Role', 'Lead Qualifier Agent')?.trim();
    if (!agentName) return;
    const task = presetTask ?? 'Waiting for delegated task';

    appendNode(
      'agentNode',
      {
        label: agentName,
        currentTask: task,
        lastAction: 'Deployed to workspace',
        progress: 0,
      },
      'WORKFLOW',
      `Employee deployed: ${agentName}`
    );
    toast.success(`AI Employee deployed: ${agentName}`);
  }, [appendNode]);

  const addPlanNode = useCallback((instruction: string) => {
    const clean = instruction.replace(/\s+/g, ' ').trim();
    appendNode(
      'planNode',
      {
        label: 'Execution Plan',
        taskTitle: clean.slice(0, 52) || 'Agent task plan',
        subtasks: [
          { id: 'p1', text: 'Validate requirements from chat', status: 'done' },
          { id: 'p2', text: 'Wire MCP/tools and workflow nodes', status: 'running' },
          { id: 'p3', text: 'Run dry test and collect outputs', status: 'pending' },
        ],
      },
      'THINKING',
      'Generated plan from latest chat instruction'
    );
  }, [appendNode]);

  const buildFromLatestInstruction = useCallback(() => {
    const text = latestInstruction.trim();
    if (!text) {
      toast.info('Send a chat instruction first, then deploy employees for it');
      return;
    }

    useCanvasStore.setState({ taskTitle: toTaskTitle(text), taskStage: 'planning', agentStatus: 'thinking' });

    const lower = text.toLowerCase();
    let created = 0;

    if (/(leads|prospects|outbound|email|campaign)/.test(lower)) {
      addEmployeeNode('Outbound SDR', 'Sourcing leads based on instruction');
      created += 1;
    }
    if (/(inbox|reply|customer|support|message)/.test(lower)) {
      addEmployeeNode('Customer Success Rep', 'Monitoring inbox and drafting replies');
      created += 1;
    }
    if (/(data|research|scrape|web|search)/.test(lower)) {
      addEmployeeNode('Data Researcher', 'Extracting context from requested sources');
      created += 1;
    }
    
    // Default fallback employee
    if (created === 0 && !/(plan|steps|strategy|breakdown)/.test(lower)) {
      addEmployeeNode('General Assistant', 'Executing instruction');
      created += 1;
    }

    if (/(plan|steps|strategy|breakdown)/.test(lower)) {
      addPlanNode(text);
      created += 1;
    }

    useCanvasStore.getState().addLog({
      actionType: 'THINKING',
      description: `Deployed ${created} employee node${created > 1 ? 's' : ''} from latest chat instruction`,
      nodeId: ROOT_NODE_ID,
    });
    toast.success(`Deployed ${created} employee node${created > 1 ? 's' : ''}`);
  }, [addEmployeeNode, addPlanNode, latestInstruction]);

  const resetCanvas = useCallback(() => {
    useCanvasStore.setState({
      nodes: [createRootNode()],
      edges: [],
      logs: [],
      agentStatus: 'idle',
      taskStage: 'init',
      taskTitle: 'Azmeth Agent Sandbox',
      elapsedSeconds: 0,
      highlightedNodeId: null,
    });
    toast.success('Sandbox canvas reset');
  }, []);

  return (
    <div className={`relative h-full w-full rounded-2xl border border-gray-200 bg-white overflow-hidden ${darkMode ? 'dark-canvas' : ''}`}>
      <div className="absolute left-3 right-3 top-[52px] z-30 flex flex-wrap gap-2 pointer-events-none">
        <button onClick={buildFromLatestInstruction} className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
          <Sparkles size={12} /> Auto-Deploy Employees
        </button>
        <button onClick={() => addEmployeeNode()} className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
          <Bot size={12} /> Hire Employee
        </button>
        <div className="flex-1" />
        <button onClick={toggleDarkMode} className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
          {darkMode ? <Sun size={12} /> : <Moon size={12} />}
        </button>
        <button onClick={resetCanvas} className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition-colors">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <ContextStrip />
      <AgentSidebar />
      <AgentCanvas />

      <div className="absolute left-3 bottom-3 z-30 rounded-lg border border-gray-200 bg-white/90 px-2.5 py-1.5 text-[10px] font-medium text-gray-500">
        {Math.max(0, nodes.length - 1)} active employee{Math.max(0, nodes.length - 1) === 1 ? '' : 's'} running
      </div>
    </div>
  );
}

export default function AgentSandboxWindow(props: AgentSandboxWindowProps) {
  return (
    <ReactFlowProvider>
      <AgentSandboxPanel {...props} />
    </ReactFlowProvider>
  );
}
