"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Shield, AlertCircle, CheckCircle2 } from "lucide-react";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrationName?: string;
  connectionType?: string;
  type?: string | any;
}

export function ConnectionModal({ isOpen, onClose, integrationName = "Service", connectionType = "API", type }: ConnectionModalProps) {
  const [step, setStep] = useState<"form" | "testing" | "success">("form");

  if (!isOpen) return null;

  const handleSave = () => {
    setStep("testing");
    setTimeout(() => setStep("success"), 1500);
    setTimeout(() => {
      onClose();
      setStep("form");
    }, 3000);
  };

  const getFieldsForType = () => {
    switch (connectionType) {
      case "oauth2":
        return (
          <>
            <div>
              <label className="text-[12px] font-bold text-[var(--text-muted)] mb-1.5 block">Client ID <span className="text-rose-500">*</span></label>
              <input type="text" className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-main)] focus:border-[var(--accent-main)]/50 focus:ring-1 outline-none font-mono" placeholder="Enter Client ID" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-[var(--text-muted)] mb-1.5 block">Client Secret <span className="text-rose-500">*</span></label>
              <input type="password" className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-main)] focus:border-[var(--accent-main)]/50 focus:ring-1 outline-none font-mono" placeholder="••••••••••••••••" />
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-2 flex gap-3">
               <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
               <p className="text-[11px] text-amber-500/90 leading-relaxed">
                 You will be redirected to {integrationName.charAt(0).toUpperCase() + integrationName.slice(1)} to authorize Azmeth AI after clicking Save & Connect.
               </p>
            </div>
          </>
        );
      case "botToken":
      case "httpBearerAuth":
      case "httpHeaderAuth":
      default:
        return (
          <div>
            <label className="text-[12px] font-bold text-[var(--text-muted)] mb-1.5 block">API / Bearer Token <span className="text-rose-500">*</span></label>
            <input type="password" className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-main)] focus:border-[var(--accent-main)]/50 focus:ring-1 outline-none font-mono" placeholder="xoxb-your-token-here or api_key" />
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 h-screen w-screen nodrag">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[0_15px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden flex flex-col relative"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] flex items-center justify-center shrink-0">
                <Shield size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
             </div>
             <div>
                <h2 className="text-[16px] font-bold text-[var(--text-main)] tracking-wide">
                   New {integrationName.charAt(0).toUpperCase() + integrationName.slice(1)} Connection
                </h2>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Securely link your account via {connectionType}</p>
             </div>
          </div>

          {/* Body */}
          <div className="p-6 relative">
            {step === "form" && (
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-bold text-[var(--text-muted)] mb-1.5 block">Connection Name <span className="text-rose-500">*</span></label>
                  <input type="text" defaultValue={`My ${integrationName} Account`} className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--text-main)] focus:border-[var(--accent-main)]/50 focus:ring-1 outline-none font-medium" />
                </div>
                
                {getFieldsForType()}
              </div>
            )}

            {step === "testing" && (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--accent-main)]/20 border-t-[var(--accent-main)] rounded-full animate-spin mb-4" />
                <p className="text-[13px] font-bold text-[var(--text-main)]">Verifying Credentials...</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Establishing secure connection</p>
              </div>
            )}

            {step === "success" && (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4">
                   <CheckCircle2 size={24} />
                </div>
                <p className="text-[13px] font-bold text-[var(--text-main)] text-emerald-400">Connection Established!</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Ready to use in your workflow.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {step === "form" && (
            <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="bg-[var(--accent-main)] hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-[12px] font-bold shadow-[0_0_15px_var(--accent-glow)] transition-all flex items-center gap-2">
                <Key size={14} />
                Save & Connect
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
