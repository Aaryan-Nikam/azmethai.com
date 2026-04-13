"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  Connection,
  Edge,
  useReactFlow
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Play, Pause, StepForward, RotateCcw, Monitor, ZoomIn, Download, Save, Undo,
  Webhook, Clock, Bot, Database, Globe, Mail, MessageSquare, Code, Layout, Link,
  Search, X, Plus, Terminal, Activity, FileText, Send, Network, GitBranch, Repeat,
  Image as ImageIcon, Layers, Zap, User, Trash, Settings, PanelLeft
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Node Components
import { AgentNode } from "@/components/workflow-builder/nodes/AgentNode";
import { TriggerNode } from "@/components/workflow-builder/nodes/TriggerNode";
import { ActionNode } from "@/components/workflow-builder/nodes/ActionNode";
import { CodeNode } from "@/components/workflow-builder/nodes/CodeNode";
import { VapiNode } from "@/components/workflow-builder/nodes/VapiNode";
import { ImageGenNode } from "@/components/workflow-builder/nodes/ImageGenNode";
import { BrowserAgentNode } from "@/components/workflow-builder/nodes/BrowserAgentNode";

// State and UI
import { useWorkflowStore } from "@/lib/workflow/useWorkflowStore";
import { getAllCatalogNodes, type CatalogNode } from "@/lib/workflow/catalog";

// Editor
import { Editor } from "@monaco-editor/react";

// --- CUSTOM EDGE ---
const AzmethEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}: any) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 3, stroke: '#3b82f6', filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.6))' }} />
    </>
  );
};

const nodeTypes = {
  agent: AgentNode,
  trigger: TriggerNode,
  action: ActionNode,
  code: CodeNode,
  vapi: VapiNode,
  image: ImageGenNode,
  browser: BrowserAgentNode
};

const edgeTypes = {
  azmeth: AzmethEdge
};

export default function VapiCloneCanvas() {
  const { 
    nodes, edges, selectedNodeId, workflowName, logs,
    onNodesChange, onEdgesChange, onConnect,
    setNodes, setEdges, addNode, updateNodeData, setSelectedNodeId, setWorkflowName, addLog
  } = useWorkflowStore();

  const [catalogNodes, setCatalogNodes] = useState<CatalogNode[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [logExpanded, setLogExpanded] = useState(false);
  const [leftPinned, setLeftPinned] = useState(false);
  const [isHoveringLeft, setIsHoveringLeft] = useState(false);

  useEffect(() => {
    getAllCatalogNodes().then(setCatalogNodes);
  }, []);

  const onDragStart = (event: any, nodeData: CatalogNode) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: any) => {
      event.preventDefault();
      const nodeDataStr = event.dataTransfer.getData('application/reactflow');
      if (!nodeDataStr) return;

      const nodeData: CatalogNode = JSON.parse(nodeDataStr);
      let type = 'action';
      if (nodeData.id === 'code-exec') type = 'code';
      if (nodeData.id === 'vapi-call') type = 'vapi';
      if (nodeData.id === 'image-gen') type = 'image';
      if (nodeData.id === 'browser-agent') type = 'browser';
      if (nodeData.category === 'AGENT TRIGGERS') type = 'trigger';

      // Very simple dropping logic (would normally translate coords via reactFlowInstance)
      const newNodeId = `${nodeData.id}_${Date.now()}`;
      addNode({
        id: newNodeId,
        type,
        position: { x: event.clientX - 300, y: event.clientY - 150 }, // Approximation
        data: { label: nodeData.label, status: 'Idle', config: {} }
      });
      addLog(`[SYSTEM] Node ${nodeData.label} added to canvas.`);
      setSelectedNodeId(newNodeId);
    },
    [addNode, addLog, setSelectedNodeId]
  );

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  // Group catalog nodes
  const categories = ["AGENT TRIGGERS", "AGENT LOGIC", "AGENT CAPABILITIES", "AGENT OUTPUT"];

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] bg-[var(--bg-root)] text-[var(--text-main)] font-sans overflow-hidden">
      
      {/* TOOLBAR (Top) */}
      <div className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-6">
           <input 
             value={workflowName}
             onChange={(e) => setWorkflowName(e.target.value)}
             className="bg-transparent border-none outline-none font-bold text-[var(--text-main)] text-md w-64 hover:bg-[var(--bg-root)] px-2 py-1 rounded"
           />
           <div className="flex items-center gap-1 border-l border-[var(--border-subtle)] pl-4">
             <button className="p-2 hover:bg-[var(--bg-root)] rounded-md text-green-600" title="Run Flow"><Play size={18} fill="currentColor" /></button>
             <button className="p-2 hover:bg-[var(--bg-root)] rounded-md text-yellow-600" title="Pause"><Pause size={18} fill="currentColor" /></button>
             <button className="p-2 hover:bg-[var(--bg-root)] rounded-md text-blue-600" title="Step"><StepForward size={18} /></button>
             <button className="p-2 hover:bg-[var(--bg-root)] rounded-md text-[var(--text-muted)]" title="Reset"><RotateCcw size={18} /></button>
           </div>
           <div className="flex items-center gap-2 border-l border-[var(--border-subtle)] pl-4">
             <select className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-xs text-[var(--text-main)]">
                <option>Env: Sandbox</option>
                <option>Env: Prod</option>
             </select>
             <select className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-xs text-[var(--text-main)]">
                <option>Zoom: Fit</option>
                <option>100%</option>
                <option>200%</option>
             </select>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--bg-root)] border border-transparent rounded-md text-xs font-bold text-[var(--text-muted)] transition-colors">
              <Undo size={14} /> Undo
           </button>
           <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--bg-root)] border border-transparent rounded-md text-xs font-bold text-[var(--text-muted)] transition-colors">
              <Download size={14} /> Export JSON
           </button>
           <button className="flex items-center gap-2 px-4 py-1.5 bg-[var(--accent-main)] hover:opacity-90 rounded-md text-xs font-bold text-white shadow-sm transition-opacity">
              <Save size={14} /> Save
           </button>
        </div>
      </div>

      {/* MAIN 3-PANEL LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANEL: Node Library (Button Expandable) */}
        <motion.div 
           initial={false}
           animate={{ width: leftPinned ? 280 : 64 }}
           className="relative bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col z-30 overflow-hidden shadow-sm shrink-0"
        >
           <div className={`p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-root)]/50 flex flex-row items-center transition-all ${leftPinned ? 'justify-between' : 'justify-center'}`}>
             {leftPinned && (
               <div className="relative flex-1 mr-2 opacity-100 transition-opacity">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   value={catalogSearch}
                   onChange={e => setCatalogSearch(e.target.value)}
                   className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md pl-9 pr-3 py-2 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-main)] focus:ring-1 focus:ring-[var(--accent-main)] transition-colors shadow-sm"
                 />
               </div>
             )}
             <button onClick={() => setLeftPinned(!leftPinned)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-gray-100 rounded transition-colors shrink-0" title={leftPinned ? "Collapse Library" : "Expand Library"}>
                <PanelLeft size={18} />
             </button>
           </div>
           
           <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2">
             {categories.map(category => (
               <div key={category} className="mb-4">
                 <motion.h4 
                    initial={false}
                    animate={{ opacity: leftPinned ? 1 : 0, height: leftPinned ? 'auto' : 0, marginBottom: leftPinned ? 8 : 0 }}
                    className="text-[10px] font-bold text-[var(--text-muted)] px-4 tracking-widest uppercase overflow-hidden whitespace-nowrap"
                 >
                    {category}
                 </motion.h4>
                 <div className="space-y-1">
                   {catalogNodes.filter(n => n.category === category && n.label.toLowerCase().includes(catalogSearch.toLowerCase())).map(node => (
                     <div 
                       key={node.id} 
                       draggable 
                       onDragStart={(e) => onDragStart(e, node)}
                       className={`flex items-center p-2 hover:bg-[var(--bg-root)] rounded-lg cursor-grab active:cursor-grabbing group transition-all border border-transparent hover:border-[var(--border-subtle)] overflow-hidden ${leftPinned ? 'gap-3 mx-2' : 'justify-center mx-2 h-[40px]'}`}
                       title={!leftPinned ? node.label : undefined}
                     >
                        <div 
                          className="w-8 h-8 rounded-md flex items-center justify-center border shadow-sm transition-colors shrink-0"
                          style={{ 
                            backgroundColor: node.color ? `rgba(var(--${node.color}-rgb), 0.1)` : 'var(--bg-root)',
                            borderColor: node.color ? `rgba(var(--${node.color}-rgb), 0.2)` : 'var(--border-subtle)',
                            color: node.color ? `var(--${node.color}-main)` : 'var(--text-muted)'
                          }}
                        >
                           {React.createElement(node.icon as any, { size: 16 })}
                        </div>
                        <motion.div 
                          initial={false}
                          animate={{ opacity: leftPinned ? 1 : 0, width: leftPinned ? 'auto' : 0 }}
                          className="flex flex-col whitespace-nowrap overflow-hidden"
                        >
                          <p className="text-[11px] font-bold text-[var(--text-main)] truncate">{node.label}</p>
                          <p className="text-[9px] text-[var(--text-muted)] truncate mt-0.5">{node.desc}</p>
                        </motion.div>
                     </div>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        </motion.div>

        {/* CENTER PANEL: Canvas (60%) */}
        <div className="flex-1 relative bg-[var(--bg-root)]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={() => {}}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            fitViewOptions={{ maxZoom: 1, padding: 0.5 }}
            colorMode="light"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#cbd5e1" gap={24} size={1} />
            <Controls className="!bg-[var(--bg-surface)] !border-[var(--border-subtle)] !fill-[var(--text-muted)] [&_path]:!fill-[var(--text-muted)] shadow-md" style={{ marginBottom: logExpanded ? '200px' : '40px' }} />
            <MiniMap 
              className="!bg-[var(--bg-surface)] !border-[var(--border-subtle)] !rounded-lg overflow-hidden shadow-sm" 
              maskColor="var(--bg-root)"
              style={{ bottom: logExpanded ? '190px' : '30px' }}
              zoomable pannable 
            />
          </ReactFlow>

          {/* BOTTOM LOG TERMINAL */}
          <div className="absolute bottom-0 left-0 right-0 z-50">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)] text-xs font-mono">
               <div className="flex items-center gap-2 text-[var(--text-muted)] font-bold">
                 <Terminal size={14} /> Execution Log
               </div>
               <button onClick={() => setLogExpanded(!logExpanded)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] w-6 h-6 flex justify-center items-center rounded hover:bg-[var(--bg-root)]">
                 {logExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
               </button>
            </div>
            {logExpanded && (
              <div className="h-48 bg-white p-4 overflow-y-auto font-mono text-[12px] leading-relaxed relative">
                <div className="absolute top-0 left-0 bottom-0 w-8 bg-gray-50 border-r border-gray-100 flex flex-col items-center py-4 text-[10px] text-gray-400 select-none">
                  {logs.map((_, i) => <span key={i}>{i+1}</span>)}
                </div>
                <div className="pl-6">
                  {logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.includes('ERROR') ? 'text-red-500 font-bold' : log.includes('SYSTEM') ? 'text-[var(--accent-main)] font-semibold' : 'text-[var(--text-main)]'}`}>
                      {log}
                    </div>
                  ))}
                  {logs.length === 0 && <div className="text-[var(--text-muted)] italic">Waiting for execution...</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Inspector (Floating & Sliding) */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
               initial={{ x: 320, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: 320, opacity: 0 }}
               transition={{ type: 'spring', stiffness: 300, damping: 30 }}
               className="absolute right-0 top-0 bottom-0 w-[320px] bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col z-40 shadow-2xl"
            >
              {/* Inspector Header */}
              <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm">
                 <div className="flex justify-between items-start mb-3">
                   <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                     <Settings size={12} /> NODE PROPERTIES
                   </h3>
                   <button onClick={() => setSelectedNodeId(null)} className="text-[var(--text-muted)] hover:text-red-500 w-6 h-6 flex justify-center items-center rounded hover:bg-red-50 transition-colors" title="Close"><X size={16} /></button>
                 </div>
                 <input 
                   type="text" 
                   value={selectedNode.data.label as string} 
                   onChange={e => updateNodeData(selectedNode.id, { label: e.target.value })}
                   className="bg-transparent text-xl font-black text-[var(--text-main)] border-b border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--accent-main)] outline-none w-full pb-1 transition-colors"
                 />
                 <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">Type: <span className="text-[var(--text-main)] bg-[var(--bg-root)] px-1.5 py-0.5 rounded ml-1">{selectedNode.type}</span></p>
              </div>

              {/* Config Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-0 flex flex-col">
                 <div className="p-5 border-b border-[var(--border-subtle)]">
                    <h4 className="text-[10px] font-bold text-[var(--text-main)] mb-4 uppercase tracking-widest">Configuration</h4>
                    
                    {/* Dynamic fields based on node type */}
                    <div className="space-y-4">
                      {selectedNode.type === 'code' && (
                         <>
                           <div>
                             <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">Language</label>
                             <select 
                               value={selectedNode.data.language as string || 'Python'} 
                               onChange={e => updateNodeData(selectedNode.id, { language: e.target.value })}
                               className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg p-2 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-main)] focus:ring-1"
                             >
                               <option>Python</option><option>JS Shell</option>
                             </select>
                           </div>
                           <div>
                             <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">Timeout</label>
                             <select 
                               value={selectedNode.data.timeout as string || '30s'} 
                               onChange={e => updateNodeData(selectedNode.id, { timeout: e.target.value })}
                               className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg p-2 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-main)] focus:ring-1"
                             >
                               <option>10s</option><option>30s</option><option>60s</option>
                             </select>
                           </div>
                         </>
                      )}

                      {selectedNode.type === 'vapi' && (
                        <>
                          <div>
                            <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">Assistant ID</label>
                            <input type="text" className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg p-2 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-main)] focus:ring-1" placeholder="asst_..." />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-[var(--text-muted)] mb-1.5 block">Model</label>
                            <select className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg p-2 text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-main)] focus:ring-1">
                               <option>GPT-4o</option><option>Claude 3.5</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                 </div>

                 {/* Editor Section for Code Nodes */}
                 {selectedNode.type === 'code' && (
                   <div className="flex flex-col flex-1 border-b border-[var(--border-subtle)] min-h-[300px]">
                     <div className="px-4 py-2 bg-[var(--bg-root)] border-b border-[var(--border-subtle)] flex justify-between items-center text-xs shadow-inner">
                       <span className="font-mono text-[var(--text-muted)] font-bold">script.{selectedNode.data.language === 'Python' ? 'py' : 'js'}</span>
                     </div>
                     <div className="flex-1 bg-white">
                       <Editor
                         height="100%"
                         defaultLanguage={selectedNode.data.language === 'Python' ? 'python' : 'javascript'}
                         theme="light"
                         value={selectedNode.data.code as string || "# Agent code here\nreturn {\"status\": \"done\"}"}
                         onChange={(val) => updateNodeData(selectedNode.id, { code: val })}
                         options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'off', padding: { top: 16 } }}
                       />
                     </div>
                   </div>
                 )}

                 {/* I/O Mapping */}
                 <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <h4 className="text-[10px] font-bold text-[var(--text-main)] mb-3 uppercase tracking-widest">Inputs / Outputs</h4>
                    <div className="space-y-2 font-mono text-xs">
                       <div className="bg-[var(--bg-root)] p-2.5 rounded-lg border border-[var(--border-subtle)] flex justify-between shadow-sm">
                          <span className="text-[var(--text-muted)]">Input: <span className="text-[var(--text-main)] font-bold">prompt</span></span>
                          <span className="text-indigo-500 font-bold bg-indigo-50 px-1.5 rounded">[text]</span>
                       </div>
                       <div className="bg-[var(--bg-root)] p-2.5 rounded-lg border border-[var(--border-subtle)] flex justify-between shadow-sm">
                          <span className="text-[var(--text-muted)]">Output: <span className="text-[var(--text-main)] font-bold">result</span></span>
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">[json]</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Test & Debug Actions */}
              <div className="p-4 bg-[var(--bg-surface)] mt-auto flex gap-2">
                 <button className="flex-1 flex items-center justify-center gap-2 bg-[var(--accent-main)] hover:opacity-90 text-white rounded-lg py-3 text-xs font-bold transition-all shadow-md active:scale-95">
                    <Play size={14} fill="currentColor" /> Run Sequence
                 </button>
                 <button className="px-4 bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Delete">
                    <Trash size={16} />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const ChevronDown = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
const ChevronUp = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>;
