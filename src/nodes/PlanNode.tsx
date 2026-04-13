import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { type PlanNodeData } from "@/store/canvasStore";

const STATUS_ICONS = {
  pending: { icon: "○", color: "var(--text-muted)" },
  running: { icon: "●", color: "var(--accent)" },
  done:    { icon: "✓", color: "var(--accent)" },
  error:   { icon: "✗", color: "var(--red)" },
};

function PlanNode({ data }: NodeProps) {
  const d = data as PlanNodeData;
  const done = d.subtasks?.filter((t) => t.status === "done").length ?? 0;
  const total = d.subtasks?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="node"
      style={{ width: 260 }}
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
          }}>≡</div>
          <div>
            <div className="node-title">Plan</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{d.taskTitle}</div>
          </div>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{done}/{total}</span>
      </div>

      <div className="progress-track" style={{ borderRadius: 0 }}>
        <div className="progress-fill" style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }} />
      </div>

      <div className="node-body">
        {d.subtasks?.map((task, i) => {
          const st = STATUS_ICONS[task.status];
          return (
            <div key={task.id} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "5px 0",
              borderBottom: i < (d.subtasks?.length ?? 0) - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ fontSize: 12, color: st.color, width: 12, flexShrink: 0, lineHeight: 1.5 }}>{st.icon}</span>
              <span style={{
                fontSize: 12, flex: 1, lineHeight: 1.5,
                color: task.status === "done" ? "var(--text-muted)" : "var(--text-secondary)",
                textDecoration: task.status === "done" ? "line-through" : "none",
              }}>
                {task.text}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default memo(PlanNode);
