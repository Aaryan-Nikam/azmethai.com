"use client";

import React, { useState } from "react";
import { 
  Puzzle, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  X, 
  Activity, 
  Zap, 
  Smartphone, 
  Globe, 
  ShieldCheck,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NodePropertiesPanelV2 } from "@/lib/workflow/fields/FieldTypeRegistry";
import { ConnectionModal } from "./ConnectionModal";

interface NodePropertiesPanelProps {
  nodeId: string;
  nodeName: string;
  schema: any[];
  data: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onNameChange?: (name: string) => void;
}

export function NodePropertiesPanel({
  nodeId,
  nodeName,
  schema,
  data,
  onChange,
  onNameChange
}: NodePropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<"parameters" | "settings">("parameters");
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);

  // Filter out credentials from parameters as they are handled specially
  const parametersSchema = (schema || []).filter(p => p.name !== 'credentials');
  const credentialsProp = (schema || []).find(p => p.name === 'credentials');

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)]">
      {/* Dynamic Header */}
      <div className="px-6 py-6 border-b border-[var(--border-subtle)] bg-gradient-to-b from-black/5 to-transparent">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-main)]/10 border border-[var(--accent-main)]/20 flex items-center justify-center text-[var(--accent-main)] shadow-inner">
             <Puzzle size={24} />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={nodeName}
              onChange={(e) => onNameChange?.(e.target.value)}
              className="text-lg font-bold bg-transparent border-b border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--accent-main)] outline-none w-full transition-all text-[var(--text-main)]"
            />
            <p className="text-[11px] text-[var(--text-muted)] font-mono uppercase tracking-widest mt-1">NODE_ID: {nodeId.slice(-8)}</p>
          </div>
        </div>

        {/* Credentials Section */}
        {credentialsProp && (
          <div className="mt-4 p-4 rounded-xl border border-[var(--accent-main)]/20 bg-[var(--accent-main)]/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-[var(--accent-main)]" />
              <div>
                <p className="text-[11px] font-bold text-[var(--text-main)] uppercase tracking-tight">Authentication</p>
                <p className="text-[10px] text-[var(--text-muted)] font-medium">Secure credential required</p>
              </div>
            </div>
            <button 
              onClick={() => setIsConnectionModalOpen(true)}
              className="px-4 py-1.5 bg-[var(--accent-main)] text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              {data.credentials ? 'Re-Connect' : 'Connect Account'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex px-4 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-surface)]/80 backdrop-blur-md z-10">
        {[
          { id: "parameters", label: "Parameters", icon: Settings },
          { id: "settings", label: "Node Settings", icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-[13px] font-bold border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-[var(--accent-main)] text-[var(--accent-main)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-root)]/30">
        <div className="p-8 max-w-2xl mx-auto">
          {activeTab === "parameters" ? (
            <div className="space-y-6">
              <NodePropertiesPanelV2 
                nodeId={nodeId} 
                schema={parametersSchema} 
                data={data} 
                onChange={onChange} 
              />
            </div>
          ) : (
            <div className="space-y-6 opacity-60 pointer-events-none select-none italic text-center py-12">
              <Activity className="mx-auto mb-4 text-[var(--text-muted)]" size={32} />
              <p className="text-sm font-medium">Advanced runtime settings coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] flex justify-between items-center px-6">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
           <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Input Configured</span>
        </div>
        <button className="text-[11px] font-bold text-[var(--accent-main)] hover:underline flex items-center gap-1.5">
          View Documentation <Globe size={12} />
        </button>
      </div>

      <ConnectionModal 
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        type={credentialsProp?.type || 'generic'}
      />
    </div>
  );
}
