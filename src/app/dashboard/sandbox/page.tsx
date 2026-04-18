'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge,
  Handle, Position, Connection, Edge,
  BaseEdge, getBezierPath, EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Bot, Send, Play, Pause, Save, Download, RotateCcw,
  Terminal, Settings, X, Plus, Trash, PanelLeft,
  Check, Clock, Zap, Loader2, AlertCircle,
  Webhook, Database, Mail, Code, GitBranch, Globe,
  Search, MoreHorizontal, RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeState = 'draft' | 'approved' | 'running' | 'done' | 'error';

interface AgentMessage { role: 'user' | 'agent'; text: string; ts: number; toolsUsed?: number; }
interface CanvasNode { id: string; type: string; label: string; config: Record<string, unknown>; state: NodeState; position_x: number; position_y: number; }
interface CanvasEdge { id: string; source_id: string; target_id: string; }

// ─── Node State Colors ─────────────────────────────────────────────────────────

const STATE_STYLES: Record<NodeState, { border: string; glow: string; badge: string; icon: React.ElementType }> = {
  draft:    { border: 'border-dashed border-amber-300',   glow: '',                              badge: 'bg-amber-50 text-amber-600', icon: Clock },
  approved: { border: 'border-solid border-emerald-400',  glow: 'shadow-emerald-100 shadow-md',  badge: 'bg-emerald-50 text-emerald-700', icon: Check },
  running:  { border: 'border-solid border-blue-400',     glow: 'shadow-blue-200 shadow-md',     badge: 'bg-blue-50 text-blue-700', icon: Loader2 },
  done:     { border: 'border-solid border-gray-300',     glow: '',                              badge: 'bg-gray-50 text-gray-500', icon: Check },
  error:    { border: 'border-solid border-red-400',      glow: 'shadow-red-100 shadow-md',      badge: 'bg-red-50 text-red-600', icon: AlertCircle },
};

const NODE_TYPE_ICONS: Record<string, React.ElementType> = {
  trigger: Zap, action: Play, agent: Bot, code: Code,
  condition: GitBranch, delay: Clock, email: Mail,
  webhook: Webhook, database: Database, default: Settings,
};

// ─── Custom Canvas Node ──────────────────────────────────────────────────────

function SandboxCanvasNode({ data }: { data: CanvasNode & { onApprove: (id: string) => void; onDelete: (id: string) => void } }) {
  const style = STATE_STYLES[data.state] || STATE_STYLES.draft;
  const Icon = NODE_TYPE_ICONS[data.type] || NODE_TYPE_ICONS.default;
  const StateIcon = style.icon;
  const isDraft = data.state === 'draft';

  return (
    <div className={`relative bg-white border-2 ${style.border} ${style.glow} rounded-2xl w-[200px] overflow-hidden transition-all`}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-gray-400 !border-white !border-2" />
      
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDraft ? 'bg-amber-50' : 'bg-gray-900'}`}>
          <Icon size={13} className={isDraft ? 'text-amber-600' : 'text-white'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 truncate">{data.label}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">{data.type}</p>
        </div>
      </div>

      {/* State badge + actions */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${style.badge}`}>
          <StateIcon size={8} className={data.state === 'running' ? 'animate-spin' : ''} />
          {data.state.toUpperCase()}
        </span>

        {isDraft && (
          <button
            onClick={() => data.onApprove(data.id)}
            className="text-[9px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
          >
            Approve
          </button>
        )}
      </div>

      {/* Draft overlay prompt */}
      {isDraft && (
        <div className="absolute inset-0 bg-amber-50/30 pointer-events-none rounded-2xl" />
      )}

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-gray-400 !border-white !border-2" />
    </div>
  );
}

// ─── Custom Edge ──────────────────────────────────────────────────────────────

function AzmethEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd }: any) {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return <BaseEdge path={path} markerEnd={markerEnd} style={{ strokeWidth: 2, stroke: '#6366f1', strokeOpacity: 0.7 }} />;
}

const nodeTypes = { sandbox: SandboxCanvasNode };
const edgeTypes = { azmeth: AzmethEdge };

// ─── Chat Message ─────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: AgentMessage }) {
  const isAgent = msg.role === 'agent';
  return (
    <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'} mb-3`}>
      {isAgent && (
        <div className="w-7 h-7 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 mr-2 mt-0.5">
          <Bot size={13} className="text-white" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
        ${isAgent
          ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
          : 'bg-gray-900 text-white rounded-tr-sm'
        }`}>
        <p className="whitespace-pre-wrap">{msg.text}</p>
        {msg.toolsUsed ? (
          <p className="text-[9px] mt-1.5 opacity-50">{msg.toolsUsed} tool{msg.toolsUsed !== 1 ? 's' : ''} used</p>
        ) : null}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SandboxPage() {
  const workflowId = 'default-sandbox';

  // ── Agent Chat State ────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<AgentMessage[]>([
    { role: 'agent', text: 'I\'m your workflow co-pilot. Tell me what you want to build and I\'ll construct it on the canvas in real time.', ts: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Canvas State ─────────────────────────────────────────────────────────────
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<CanvasEdge[]>([]);
  const [rfNodes, setRFNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRFEdges, onEdgesChange] = useEdgesState([]);

  // ── Workflow name ─────────────────────────────────────────────────────────────
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [saving, setSaving] = useState(false);

  // ── Load workflow + subscribe to Realtime ──────────────────────────────────
  useEffect(() => {
    // Load existing nodes/edges
    const loadCanvas = async () => {
      const [{ data: nodes }, { data: edges }] = await Promise.all([
        supabase.from('workflow_nodes').select('*').eq('workflow_id', workflowId),
        supabase.from('workflow_edges').select('*').eq('workflow_id', workflowId),
      ]);
      if (nodes) applyNodes(nodes as CanvasNode[]);
      if (edges) applyEdges(edges as CanvasEdge[]);
    };
    loadCanvas();

    // Realtime subscription → canvas updates when agent creates nodes
    const channel = supabase
      .channel(`canvas:${workflowId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workflow_nodes',
        filter: `workflow_id=eq.${workflowId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setCanvasNodes(prev => {
            const exists = prev.find(n => n.id === (payload.new as CanvasNode).id);
            const updated = exists
              ? prev.map(n => n.id === (payload.new as CanvasNode).id ? payload.new as CanvasNode : n)
              : [...prev, payload.new as CanvasNode];
            applyNodes(updated);
            return updated;
          });
          toast.success(`Node "${(payload.new as CanvasNode).label}" ${payload.eventType === 'INSERT' ? 'added' : 'updated'} on canvas`);
        }
        if (payload.eventType === 'DELETE') {
          setCanvasNodes(prev => {
            const updated = prev.filter(n => n.id !== (payload.old as { id: string }).id);
            applyNodes(updated);
            return updated;
          });
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'workflow_edges',
        filter: `workflow_id=eq.${workflowId}`,
      }, (payload) => {
        setCanvasEdges(prev => {
          const updated = [...prev, payload.new as CanvasEdge];
          applyEdges(updated);
          return updated;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workflowId]);

  // ── Convert DB nodes → ReactFlow nodes ───────────────────────────────────────
  const applyNodes = useCallback((nodes: CanvasNode[]) => {
    setRFNodes(nodes.map(n => ({
      id: n.id,
      type: 'sandbox',
      position: { x: n.position_x, y: n.position_y },
      data: {
        ...n,
        onApprove: (nodeId: string) => approveNode(nodeId),
        onDelete: (nodeId: string) => deleteNode(nodeId),
      },
    })));
  }, []);

  const applyEdges = useCallback((edges: CanvasEdge[]) => {
    setRFEdges(edges.map(e => ({
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      type: 'azmeth',
    })));
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Node actions ──────────────────────────────────────────────────────────────
  const approveNode = useCallback(async (nodeId: string) => {
    await supabase.from('workflow_nodes').update({ state: 'approved' }).eq('id', nodeId);
    toast.success('Node approved');
  }, []);

  const deleteNode = useCallback(async (nodeId: string) => {
    await supabase.from('workflow_nodes').delete().eq('id', nodeId);
  }, []);

  const approveAll = useCallback(async () => {
    const draftIds = canvasNodes.filter(n => n.state === 'draft').map(n => n.id);
    if (!draftIds.length) return;
    await supabase.from('workflow_nodes').update({ state: 'approved' }).in('id', draftIds);
    toast.success(`${draftIds.length} nodes approved`);
  }, [canvasNodes]);

  // ── Save workflow ─────────────────────────────────────────────────────────────
  const saveWorkflow = async () => {
    setSaving(true);
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workflowName, data: { nodes: canvasNodes, edges: canvasEdges } }),
      });
      toast.success('Workflow saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Send message to agent ─────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || thinking) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', text: userMsg, ts: Date.now() }]);
    setThinking(true);

    // Inject sandbox context into the message so agent knows the workflow_id
    const contextualMessage = `[Sandbox context: workflow_id=${workflowId}]\n${userMsg}`;

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, text: m.text })),
            { role: 'user', text: contextualMessage },
          ],
        }),
      });
      const data = await res.json();
      setMessages(p => [...p, {
        role: 'agent',
        text: data.text || data.error || 'Something went wrong.',
        ts: Date.now(),
        toolsUsed: data.iterations ? data.iterations - 1 : 0,
      }]);
    } catch {
      setMessages(p => [...p, { role: 'agent', text: 'Connection error. Please try again.', ts: Date.now() }]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking, messages, workflowId]);

  const draftCount = canvasNodes.filter(n => n.state === 'draft').length;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#f7f8fa] font-sans overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <input
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
            className="font-bold text-sm text-gray-900 bg-transparent border-none outline-none w-48 hover:bg-gray-50 px-2 py-1 rounded-lg"
          />
          {draftCount > 0 && (
            <button
              onClick={approveAll}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <Check size={12} /> Approve All ({draftCount})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Save
          </button>
        </div>
      </div>

      {/* Main split layout */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        
        {/* Left: Agent Chat */}
        <Panel defaultSize={32} minSize={25} maxSize={50}>
          <div className="flex flex-col h-full bg-white border-r border-gray-200">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Azmeth Agent</p>
                <p className="text-[10px] text-emerald-600 font-semibold">● Live — watching canvas</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}
              {thinking && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                    <Bot size={13} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested prompts (shown when chat is empty-ish) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-3 grid grid-cols-1 gap-2">
                {[
                  'Build a lead qualification workflow',
                  'Create a welcome sequence for new Instagram leads',
                  'Add a condition node to filter by score',
                ].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="text-left text-xs text-gray-500 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 shrink-0">
              <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 focus-within:border-gray-400 focus-within:bg-white transition-all">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Ask anything or give a build instruction…"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none leading-relaxed"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || thinking}
                  className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center shrink-0 hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {thinking ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
                </button>
              </div>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1.5 bg-gray-200 hover:bg-blue-400 transition-colors cursor-col-resize" />

        {/* Right: Canvas */}
        <Panel defaultSize={68} minSize={40}>
          <div className="h-full relative bg-[#f7f8fa]">
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={(params: Connection) => {
                setRFEdges(eds => addEdge({ ...params, type: 'azmeth' }, eds));
              }}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ maxZoom: 1, padding: 0.3 }}
              proOptions={{ hideAttribution: true }}
              colorMode="light"
            >
              <Background color="#d1d5db" gap={20} size={1} />
              <Controls className="!bg-white !border-gray-200 shadow-sm" />
              <MiniMap
                className="!bg-white !border-gray-200 !rounded-xl shadow-sm"
                maskColor="rgba(0,0,0,0.05)"
                zoomable
                pannable
              />
            </ReactFlow>

            {/* Empty state overlay */}
            {rfNodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Zap size={22} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-500">Canvas is empty</p>
                  <p className="text-xs text-gray-400 mt-1">Tell the agent what to build →</p>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <div className="flex items-center gap-3">
                {Object.entries(STATE_STYLES).slice(0, 4).map(([state, s]) => (
                  <div key={state} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${state === 'draft' ? 'bg-amber-400' : state === 'approved' ? 'bg-emerald-400' : state === 'running' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                    <span className="text-[9px] text-gray-400 font-medium capitalize">{state}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
