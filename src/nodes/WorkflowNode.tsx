import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { type WorkflowNodeData } from "@/store/canvasStore";

const STEP_STATUS = {
  pending: { color: "var(--text-muted)", icon: "○" },
  running: { color: "var(--accent)", icon: "●" },
  done:    { color: "var(--accent)", icon: "✓" },
  error:   { color: "var(--red)",    icon: "✗" },
};

function WorkflowNode({ data }: NodeProps) {
  const d = data as WorkflowNodeData;
  const isRunning = d.status === "running";
  const done = d.steps?.filter((s) => s.status === "done").length ?? 0;
  const total = d.steps?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`node ${isRunning ? "node-active" : ""}`}
      style={{ width: 240 }}
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
          }}>⟁</div>
          <span className="node-title">{d.workflowName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{done}/{total}</span>
          {isRunning && (
            <div style={{ width: 12, height: 12, border: "1.5px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%" }} className="spin" />
          )}
          {d.status === "done" && <div className="chip chip-green">Done</div>}
          {d.status === "error" && <div className="chip chip-red">Error</div>}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-track" style={{ borderRadius: 0 }}>
        <div className="progress-fill" style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }} />
      </div>

      <div className="node-body">
        {d.steps?.map((step, i) => {
          const st = STEP_STATUS[step.status];
          return (
            <div
              key={i}
              className={step.status === "running" ? "step-running" : ""}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 0",
                borderBottom: i < (d.steps?.length ?? 0) - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span style={{ fontSize: 11, color: st.color, width: 12, textAlign: "center", flexShrink: 0 }}>
                {st.icon}
              </span>
              <span style={{
                fontSize: 12, flex: 1,
                color: step.status === "done" ? "var(--text-muted)" : "var(--text-secondary)",
              }}>
                {step.name}
              </span>
            </div>
          );
        })}

        {(d.runCount > 0 || d.lastDuration) && (
          <div style={{
            marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between",
            fontSize: 10, color: "var(--text-muted)",
          }}>
            <span>Run #{d.runCount}</span>
            {d.lastDuration && <span>{d.lastDuration}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default memo(WorkflowNode);
