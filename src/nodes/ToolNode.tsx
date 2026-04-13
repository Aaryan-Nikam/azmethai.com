import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { type ToolNodeData } from "@/store/canvasStore";

function formatTime(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
}

function ToolNode({ data }: NodeProps) {
  const d = data as ToolNodeData;
  const [open, setOpen] = useState(false);
  const isCalling = d.status === "calling";
  const isDone = d.status === "done";
  const isError = d.status === "error";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`node ${isCalling ? "node-active" : ""}`}
      style={{ width: 210 }}
    >
      <Handle type="target" position={Position.Left}
        style={{ top: "50%", left: -4, width: 8, height: 8, background: "var(--border-hover)", border: "1.5px solid var(--border)", borderRadius: "50%" }}
      />
      <Handle type="source" position={Position.Right}
        style={{ top: "50%", right: -4, width: 8, height: 8, background: "var(--border-hover)", border: "1.5px solid var(--border)", borderRadius: "50%" }}
      />

      <div className="node-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: "var(--surface-2)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "var(--text-secondary)",
          }}>⚡</div>
          <span className="node-title">{d.toolName}</span>
        </div>
        {isCalling && (
          <div style={{ width: 12, height: 12, border: "1.5px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%" }} className="spin" />
        )}
        {isDone && <div className="chip chip-green">Done</div>}
        {isError && <div className="chip chip-red">Error</div>}
        {d.status === "idle" && <div className="chip chip-default">Idle</div>}
      </div>

      <div className="node-body">
        {d.inputParams && Object.keys(d.inputParams).length > 0 && (
          <div className="node-section">
            <div className="section-label">Input</div>
            {Object.entries(d.inputParams).map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 6, marginBottom: 2, alignItems: "baseline" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 11, flexShrink: 0 }}>{k}</span>
                <span className="mono" style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {String(v)}
                </span>
              </div>
            ))}
          </div>
        )}

        {d.output && (
          <div className="node-section">
            <div
              className="section-label"
              style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              onClick={() => setOpen(!open)}
            >
              <span>Output</span>
              <span style={{ color: "var(--accent)", fontSize: 9 }}>{open ? "▲" : "▼"}</span>
            </div>
            <div className="mono" style={{
              color: "var(--text-secondary)",
              maxHeight: open ? 100 : 28,
              overflow: "hidden",
              transition: "max-height 0.2s ease",
              fontSize: 10,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}>
              {d.output}
            </div>
          </div>
        )}

        {isError && d.errorMessage && (
          <div style={{ fontSize: 11, color: "var(--red)", marginTop: 6, lineHeight: 1.4 }}>
            {d.errorMessage}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Called {d.callCount}×</span>
          {d.lastCalled && <span suppressHydrationWarning style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatTime(d.lastCalled)}</span>}
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ToolNode);
