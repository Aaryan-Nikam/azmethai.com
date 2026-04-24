import { memo, useState, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { Check, X, Pencil, Lock, Zap, Loader2 } from "lucide-react";
import { useCanvasStore, type NodeStatus, type AutonomyMode } from "@/store/canvasStore";

interface BaseNodeProps {
  nodeId: string;
  icon: React.ElementType;
  title: string;
  typeLabel: string;
  status: NodeStatus;
  autonomy?: AutonomyMode;
  confidence?: number;
  intentPreview?: string;
  traceLog?: string[];
  progress?: number;          // 0–1
  userInput?: { prompt: string; value?: string };
  width?: number;
  children?: ReactNode;       // Node-specific body content
  /** Extra content rendered inside the footer, before the confidence badge */
  footerLeft?: ReactNode;
  /** If true, shows a second source handle on the bottom (for decision nodes) */
  extraSourceHandle?: boolean;
}

const STATUS_CONFIG: Record<NodeStatus, { class: string; label: string; color: string }> = {
  idle:           { class: "node-idle",     label: "Idle",       color: "chip-default" },
  pending:        { class: "node-pending",  label: "Pending",    color: "chip-amber" },
  running:        { class: "node-running",  label: "Running",    color: "chip-blue" },
  awaiting_input: { class: "node-awaiting", label: "Awaiting",   color: "chip-amber" },
  done:           { class: "node-done",     label: "Done",       color: "chip-green" },
  error:          { class: "node-error",    label: "Error",      color: "chip-red" },
};

function BaseNode({
  nodeId,
  icon: Icon,
  title,
  typeLabel,
  status,
  autonomy = "approval_required",
  confidence,
  intentPreview,
  traceLog,
  progress,
  userInput,
  width = 240,
  children,
  footerLeft,
  extraSourceHandle,
}: BaseNodeProps) {
  const approveNode = useCanvasStore((s) => s.approveNode);
  const rejectNode = useCanvasStore((s) => s.rejectNode);
  const submitUserInput = useCanvasStore((s) => s.submitUserInput);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const [inputValue, setInputValue] = useState("");
  const cfg = STATUS_CONFIG[status];
  const isRunning = status === "running";
  const isPending = status === "pending";
  const isAwaiting = status === "awaiting_input";

  const confidenceClass = confidence !== undefined
    ? confidence >= 0.8 ? "confidence-high"
    : confidence >= 0.5 ? "confidence-medium"
    : "confidence-low"
    : "";

  const toggleAutonomy = () => {
    const next: AutonomyMode = autonomy === "auto" ? "approval_required" : "auto";
    updateNodeData(nodeId, { autonomyMode: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={`node ${cfg.class}`}
      style={{ width }}
    >
      {/* ── Handles ── */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          top: "50%", left: -5, width: 10, height: 10,
          background: "var(--surface)", border: "2px solid var(--border-hover)",
          borderRadius: "50%", transition: "all 0.15s",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          top: "50%", right: -5, width: 10, height: 10,
          background: "var(--surface)", border: "2px solid var(--border-hover)",
          borderRadius: "50%", transition: "all 0.15s",
        }}
      />
      {extraSourceHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="false-branch"
          style={{
            bottom: -5, left: "50%", width: 10, height: 10,
            background: "var(--surface)", border: "2px solid var(--red)",
            borderRadius: "50%", transition: "all 0.15s",
          }}
        />
      )}

      {/* ── Header ── */}
      <div className="node-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className={`node-icon ${isRunning ? "node-icon-active" : ""}`}>
            {isRunning
              ? <Loader2 size={13} style={{ color: "white" }} className="spin" />
              : <Icon size={13} style={{ color: "var(--text-muted)" }} />
            }
          </div>
          <div>
            <div className="node-title">{title}</div>
            <div className="node-type-label">{typeLabel}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Autonomy toggle */}
          <button
            className={`autonomy-toggle ${autonomy === "auto" ? "autonomy-auto" : "autonomy-approval"}`}
            onClick={toggleAutonomy}
            title={autonomy === "auto" ? "Auto-execute (click to require approval)" : "Requires approval (click for auto)"}
          >
            {autonomy === "auto"
              ? <><Zap size={8} style={{ marginRight: 2 }} /> Auto</>
              : <><Lock size={8} style={{ marginRight: 2 }} /> HITL</>
            }
          </button>
          {/* Status chip */}
          <span className={`chip ${cfg.color}`}>
            {isRunning && <div className="dot dot-blue dot-pulse" />}
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ── Progress bar (only when running) ── */}
      {isRunning && progress !== undefined && (
        <div className="progress-track" style={{ borderRadius: 0 }}>
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* ── Body ── */}
      <div className="node-body">
        {/* Intent preview (shown in pending state) */}
        {isPending && intentPreview && (
          <div className="intent-preview">{intentPreview}</div>
        )}

        {/* HITL input (shown in awaiting_input state) */}
        {isAwaiting && userInput && (
          <div className="hitl-input-wrap" style={{ marginBottom: 8 }}>
            <div className="hitl-input-prompt">{userInput.prompt}</div>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                className="hitl-input"
                placeholder="Enter value…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) {
                    submitUserInput(nodeId, inputValue.trim());
                    setInputValue("");
                  }
                }}
              />
              <button
                className="hitl-btn hitl-btn-approve"
                onClick={() => {
                  if (inputValue.trim()) {
                    submitUserInput(nodeId, inputValue.trim());
                    setInputValue("");
                  }
                }}
              >
                ↵
              </button>
            </div>
          </div>
        )}

        {/* Live trace (shown while running) */}
        {isRunning && traceLog && traceLog.length > 0 && (
          <div className="trace-log" style={{ marginBottom: 8 }}>
            {traceLog.slice(-5).map((line, i) => (
              <div key={i} className="trace-line">{line}</div>
            ))}
          </div>
        )}

        {/* Node-specific content */}
        {children}
      </div>

      {/* ── Footer ── */}
      <div className="node-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* HITL action buttons (only for pending state with approval_required) */}
          {isPending && autonomy === "approval_required" && (
            <>
              <button className="hitl-btn hitl-btn-approve" onClick={() => approveNode(nodeId)}>
                <Check size={9} style={{ marginRight: 2 }} /> Approve
              </button>
              <button className="hitl-btn hitl-btn-reject" onClick={() => rejectNode(nodeId)}>
                <X size={9} style={{ marginRight: 2 }} /> Skip
              </button>
            </>
          )}
          {footerLeft}
        </div>
        {/* Confidence */}
        {confidence !== undefined && (
          <span className={`confidence-badge ${confidenceClass}`}>
            {confidence.toFixed(2)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default memo(BaseNode);
