'use client';

import React, { useCallback, useState } from 'react';
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import AgentNode from '@/components/nodes/AgentNode';
import { Play } from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes = {
  agentNode: AgentNode,
};

const initialNodes = [
  {
    id: 'agent-1',
    type: 'agentNode',
    position: { x: 150, y: 150 },
    data: { 
      label: 'Edge Router', 
      model: 'GPT-4o Turbo', 
      status: 'running',
      autonomyMode: 'auto',
      currentTask: 'Ingesting inbound webhook payloads',
      lastAction: 'Route matrix initialized'
    },
  },
  {
    id: 'agent-2',
    type: 'agentNode',
    position: { x: 650, y: 50 },
    data: { 
      label: 'Sales SDR', 
      model: 'Claude 3.5', 
      status: 'idle',
      autonomyMode: 'approval_required',
      currentTask: 'Waiting for route assignment'
    },
  },
];

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: 'agent-1', 
    target: 'agent-2', 
    animated: true, 
    style: { stroke: '#00E5FF', strokeWidth: 3, filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.6))' } 
  },
];

export default function SquadBuilderMaster() {
  const [nodes, setNodes] = useState<any[]>(initialNodes);
  const [edges, setEdges] = useState<any[]>(initialEdges);
  const [linkActive, setLinkActive] = useState(true);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds as any) as any),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds as any) as any),
    []
  );

  const deployHardware = () => {
    setNodes(prev => prev.map((node, idx) => ({
        ...node,
        data: {
          ...node.data,
          status: 'running',
          currentTask: `Hardware profile deployed (${360 + (idx * 80)}ms latency target)`,
          lastAction: 'Hardware matrix recalibrated',
        },
      })));
    toast.success('Hardware profile deployed to squad');
  };

  const routeMatrix = () => {
    setEdges(prev => {
      if (prev.length > 0) {
        return prev.map(edge => ({
          ...edge,
          animated: true,
          style: {
            ...edge.style,
            stroke: '#00E5FF',
            strokeWidth: 3,
            filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.6))',
          },
        }));
      }
      if (nodes.length < 2) return prev;
      return [{
        id: `${nodes[0].id}-${nodes[1].id}`,
        source: nodes[0].id,
        target: nodes[1].id,
        animated: true,
        style: { stroke: '#00E5FF', strokeWidth: 3, filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.6))' },
      }];
    });
    toast.success('Route matrix recalculated');
  };

  const activateLink = () => {
    setLinkActive(prev => {
      const next = !prev;
      setEdges(curr => curr.map(edge => ({
        ...edge,
        animated: next,
        style: {
          ...edge.style,
          stroke: next ? '#00E5FF' : '#64748b',
          filter: next ? 'drop-shadow(0 0 8px rgba(0,229,255,0.6))' : 'none',
        },
      })));
      if (next) toast.success('Primary link activated');
      else toast.info('Primary link paused');
      return next;
    });
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-[#000000]">
      {/* Heavy IDE Toolbars */}
      <header className="h-10 border-b border-[var(--border)] bg-[#070707] flex items-center justify-between px-4 shrink-0 z-20">
         <span className="text-xs font-mono text-[#E5E5E5]">squads / live_production_matrix.flow</span>
      </header>

      <div className="flex-1 w-full h-full relative z-10">
         <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
        >
          {/* Custom Aeroplane Grid */}
          <Background color="rgba(255,255,255,0.03)" gap={32} size={2} />
          <Controls className="fill-white [&>button]:bg-[#070707] [&>button]:border-[var(--border)] [&>button]:text-[#E5E5E5] shadow-2xl" />
        </ReactFlow>
      </div>

      {/* Floating Action Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-[#111111]/90 backdrop-blur-3xl border border-[var(--border)] rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-30">
         <button onClick={deployHardware} className="px-5 py-2 rounded-md bg-transparent hover:bg-white/5 text-[11px] font-mono font-bold text-[var(--text-secondary)] hover:text-white transition uppercase tracking-widest">
            Deploy Hardware
         </button>
         <button onClick={routeMatrix} className="px-5 py-2 rounded-md bg-transparent hover:bg-white/5 text-[11px] font-mono font-bold text-[var(--text-secondary)] hover:text-white transition uppercase tracking-widest">
            Route Matrix
         </button>
         <div className="w-[1px] h-6 bg-[var(--border)] mx-1" />
         <button onClick={activateLink} className="flex items-center gap-2 px-6 py-2 rounded border border-[#00E5FF]/50 bg-[#00E5FF]/10 hover:bg-[#00E5FF] hover:text-black text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.2)] text-[11px] font-bold uppercase tracking-widest transition-all">
            <Play size={12} fill="currentColor" /> {linkActive ? 'Pause Link' : 'Activate Link'}
         </button>
      </div>
    </div>
  );
}
