'use client';

import { Handle, Position } from '@xyflow/react';
import { Agent3DAvatar } from '@/components/ui/Agent3DAvatar';

// Mocked AGENTS data to ensure it works without external dependencies
const AGENTS_MOCK: Record<string, any> = {
  openclaw: { name: 'OpenClaw', role: 'General Analyst', col: '#8b5cf6', icon: '🤖' },
  sales: { name: 'Sales Closer', role: 'Growth Expert', col: '#10b981', icon: '💰' },
  ops: { name: 'Ops Orchestrator', role: 'Process Automation', col: '#3b82f6', icon: '⚙️' }
};

export function AgentNode({ data, selected }: any) {
  const agentKey = (data.agentType || 'openclaw');
  const agentConfig = AGENTS_MOCK[agentKey] || AGENTS_MOCK['openclaw'];
  const enabledSkills = (data.skills || []).filter((s: any) => s.enabled);

  return (
    <div className={`flex flex-col bg-[var(--bg-surface)] backdrop-blur-xl border-2 transition-all rounded-2xl overflow-hidden w-[320px] shadow-2xl ${
      selected ? 'border-[var(--accent-main)] shadow-[0_0_30px_rgba(99,102,241,0.3)] scale-[1.02]' : 'border-[var(--border-subtle)]'
    }`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !rounded-full !bg-[var(--accent-main)] !border-2 !border-[var(--bg-root)] -top-1.5" />
      
      <div className="p-5">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border text-xl shadow-lg"
              style={{ background: agentConfig.col + '20', borderColor: agentConfig.col + '30' }}
            >
              {agentConfig.icon}
            </div>
            <div>
              <h3 className="text-[var(--text-main)] font-bold tracking-tight text-sm">{agentConfig.name}</h3>
              <p className="text-[10px] font-mono mt-0.5 uppercase tracking-wider" style={{ color: agentConfig.col }}>{agentConfig.role}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>
          </div>
        </div>

        <div className="group relative rounded-xl overflow-hidden mb-5 border border-[var(--border-subtle)] bg-black/5">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />
          <Agent3DAvatar agent={data.agent || { status: 'running' }} size="small" interactive={false} />
        </div>
        
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Objective</label>
            {enabledSkills.length > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[var(--accent-main)]/10 text-[var(--accent-main)] rounded-md border border-[var(--accent-main)]/20">
                {enabledSkills.length} SKILLS
              </span>
            )}
          </div>
          <div className="bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-xl p-3.5 text-xs text-[var(--text-main)] font-medium leading-relaxed min-h-[60px] shadow-inner">
            {data.task || data.desc || 'Waiting for mission parameters...'}
          </div>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-[var(--bg-surface-hover)] border-t border-[var(--border-subtle)] flex items-center justify-between">
         <span className="text-[10px] font-mono text-[var(--text-muted)]">SYSTEM.v2.0</span>
         <div className="flex gap-1.5">
            {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />)}
         </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !rounded-full !bg-[var(--accent-main)] !border-2 !border-[var(--bg-root)] -bottom-1.5" />
    </div>
  );
}
