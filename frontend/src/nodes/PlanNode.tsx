import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { ListChecks } from "lucide-react";
import { motion } from "framer-motion";
import { type PlanNodeData } from "@/store/canvasStore";
import BaseNode from "./BaseNode";

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  pending: { icon: "○", color: "var(--text-muted)" },
  running: { icon: "●", color: "var(--accent)" },
  done:    { icon: "✓", color: "var(--green)" },
  error:   { icon: "✗", color: "var(--red)" },
};

function PlanNode({ id, data }: NodeProps) {
  const d = data as unknown as PlanNodeData;
  const done = d.subtasks?.filter((t) => t.status === "done").length ?? 0;
  const total = d.subtasks?.length ?? 0;
  const progress = total > 0 ? done / total : 0;

  return (
    <BaseNode
      nodeId={id}
      icon={ListChecks}
      title={d.taskTitle}
      typeLabel="Execution Plan"
      status={d.status}
      autonomy={d.autonomyMode}
      confidence={d.confidence}
      intentPreview={d.intentPreview}
      traceLog={d.traceLog}
      progress={progress}
      userInput={d.userInput}
      width={270}
      footerLeft={
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {done}/{total} complete
        </span>
      }
    >
      {d.subtasks?.map((task, i) => {
        const st = STATUS_ICONS[task.status] || STATUS_ICONS.pending;
        return (
          <div key={task.id} style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            padding: "5px 0",
            borderBottom: i < (d.subtasks?.length ?? 0) - 1 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{ fontSize: 12, color: st.color, width: 14, flexShrink: 0, lineHeight: 1.5, textAlign: "center" }}>
              {task.status === "running" ? (
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>●</motion.span>
              ) : st.icon}
            </span>
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: 12, lineHeight: 1.5,
                color: task.status === "done" ? "var(--text-muted)" : "var(--text-secondary)",
                textDecoration: task.status === "done" ? "line-through" : "none",
              }}>
                {task.text}
              </span>
              {task.assignee && (
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>→ {task.assignee}</div>
              )}
            </div>
          </div>
        );
      })}
    </BaseNode>
  );
}

export default memo(PlanNode);
