import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { type WorkflowNodeData } from "@/store/canvasStore";
import BaseNode from "./BaseNode";

const STEP_STATUS: Record<string, { color: string; icon: string }> = {
  pending: { color: "var(--text-muted)", icon: "○" },
  running: { color: "var(--accent)",     icon: "●" },
  done:    { color: "var(--green)",      icon: "✓" },
  error:   { color: "var(--red)",        icon: "✗" },
};

function WorkflowNode({ id, data }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  const done = d.steps?.filter((s) => s.status === "done").length ?? 0;
  const total = d.steps?.length ?? 0;
  const progress = total > 0 ? done / total : 0;

  return (
    <BaseNode
      nodeId={id}
      icon={GitBranch}
      title={d.workflowName}
      typeLabel={`Workflow · ${d.runMode}`}
      status={d.status}
      autonomy={d.autonomyMode}
      confidence={d.confidence}
      intentPreview={d.intentPreview}
      traceLog={d.traceLog}
      progress={progress}
      userInput={d.userInput}
      width={250}
      footerLeft={
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {done}/{total} steps
          {d.runCount > 0 && <> · Run #{d.runCount}</>}
          {d.lastDuration && <> · {d.lastDuration}</>}
        </span>
      }
    >
      {/* Steps checklist */}
      {d.steps?.map((step, i) => {
        const st = STEP_STATUS[step.status] || STEP_STATUS.pending;
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
            <span style={{ fontSize: 11, color: st.color, width: 14, textAlign: "center", flexShrink: 0 }}>
              {step.status === "running" ? (
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>●</motion.span>
              ) : st.icon}
            </span>
            <span style={{
              fontSize: 12, flex: 1,
              color: step.status === "done" ? "var(--text-muted)" : "var(--text-secondary)",
              textDecoration: step.status === "done" ? "line-through" : "none",
            }}>
              {step.name}
            </span>
          </div>
        );
      })}
    </BaseNode>
  );
}

export default memo(WorkflowNode);
