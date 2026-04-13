import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { type AgentNodeData } from "@/store/canvasStore";

const STATUS_MAP = {
  idle:      { label: "Idle",      dot: "dot-muted", chip: "chip-default" },
  thinking:  { label: "Thinking",  dot: "dot-blue dot-pulse", chip: "chip-blue" },
  executing: { label: "Running",   dot: "dot-green dot-pulse", chip: "chip-green" },
  error:     { label: "Error",     dot: "dot-red", chip: "chip-red" },
  done:      { label: "Done",      dot: "dot-green", chip: "chip-green" },
};

function AgentNode({ data }: NodeProps) {
  const d = data as AgentNodeData;
  const s = STATUS_MAP[d.status ?? "idle"];
  const isThinking = d.status === "thinking";
  const isExecuting = d.status === "executing";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`node ${d.status === "executing" || d.status === "thinking" ? "node-active" : ""}`}
      style={{ width: 240 }}
    >
      {/* Header */}
      <div className="node-header" style={{ background: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 5,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12,
          }}>◈</div>
          <span className="node-title">Agent</span>
        </div>
        <div className={`chip ${s.chip}`} style={{ gap: 5 }}>
          <div className={`dot ${s.dot}`} />
          {s.label}
        </div>
      </div>

      {/* Body */}
      <div className="node-body">
        {isThinking && (
          <div className="node-section">
            <div className="section-label">Reasoning</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[1, 0.6, 0.85, 0.45, 0.7].map((w, i) => (
                <motion.div
                  key={i}
                  style={{ height: 2, borderRadius: 1, background: "var(--blue)", transformOrigin: "left" }}
                  animate={{ scaleX: [w * 0.3, w, w * 0.5, w * 0.9, w * 0.4], opacity: [0.2, 0.7, 0.4, 0.8, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                />
              ))}
            </div>
          </div>
        )}

        {isExecuting && (
          <div className="node-section">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div className="section-label">Progress</div>
              <span className="mono" style={{ color: "var(--accent)", fontSize: 10 }}>
                {Math.round((d.progress ?? 0.5) * 100)}%
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(d.progress ?? 0.5) * 100}%` }} />
            </div>
          </div>
        )}

        {d.currentTask && (
          <div className="node-section" style={{ marginTop: isThinking || isExecuting ? 10 : 0 }}>
            <div className="section-label">Current task</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.5 }}>
              {d.currentTask}
            </div>
          </div>
        )}

        {d.lastAction && (
          <div style={{
            marginTop: 10, paddingTop: 10,
            borderTop: "1px solid var(--border)",
            fontSize: 11, color: "var(--text-muted)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {d.lastAction}
          </div>
        )}
      </div>

      {/* Handles */}
      {[
        { id: "tools", top: "25%" },
        { id: "code", top: "40%" },
        { id: "workflows", top: "55%" },
        { id: "context", top: "70%" },
        { id: "connectors", top: "85%" },
        { id: "plan", top: "12%" },
      ].map((h) => (
        <Handle key={h.id} type="source" position={Position.Right} id={h.id}
          style={{ top: h.top, right: -4, width: 8, height: 8, background: "var(--border-hover)", border: "1.5px solid var(--border)", borderRadius: "50%", cursor: "crosshair" }}
        />
      ))}
      <Handle type="target" position={Position.Left}
        style={{ top: "50%", left: -4, width: 8, height: 8, background: "var(--border-hover)", border: "1.5px solid var(--border)", borderRadius: "50%" }}
      />
    </motion.div>
  );
}

export default memo(AgentNode);
