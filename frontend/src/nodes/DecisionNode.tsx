import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Split } from "lucide-react";
import { type DecisionNodeData } from "@/store/canvasStore";
import BaseNode from "./BaseNode";

function DecisionNode({ id, data }: NodeProps) {
  const d = data as unknown as DecisionNodeData;
  const resolved = d.result !== undefined;

  return (
    <BaseNode
      nodeId={id}
      icon={Split}
      title={d.label}
      typeLabel="Decision · If/Else"
      status={d.status}
      autonomy={d.autonomyMode}
      confidence={d.confidence}
      intentPreview={d.intentPreview}
      traceLog={d.traceLog}
      userInput={d.userInput}
      width={240}
      extraSourceHandle
    >
      {/* Condition */}
      <div className="node-section">
        <div className="section-label">Condition</div>
        <div className="mono" style={{
          fontSize: 11, lineHeight: 1.5,
          color: "var(--text-secondary)",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "6px 8px",
        }}>
          {d.condition || "No condition set"}
        </div>
      </div>

      {/* Branch indicators */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div className={`decision-branch decision-branch-true ${resolved && d.result === "true" ? "decision-branch-active" : ""}`}>
          <span style={{ fontSize: 10 }}>✓</span>
          <span style={{ flex: 1, fontSize: 11 }}>{d.trueLabel || "True"}</span>
          {resolved && d.result === "true" && (
            <span style={{ fontSize: 9, fontWeight: 700 }}>→ RIGHT</span>
          )}
        </div>
        <div className={`decision-branch decision-branch-false ${resolved && d.result === "false" ? "decision-branch-active" : ""}`}>
          <span style={{ fontSize: 10 }}>✗</span>
          <span style={{ flex: 1, fontSize: 11 }}>{d.falseLabel || "False"}</span>
          {resolved && d.result === "false" && (
            <span style={{ fontSize: 9, fontWeight: 700 }}>→ BOTTOM</span>
          )}
        </div>
      </div>

      {/* Reasoning */}
      {d.reasoning && (
        <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-muted)", lineHeight: 1.4, fontStyle: "italic" }}>
          {d.reasoning}
        </div>
      )}
    </BaseNode>
  );
}

export default memo(DecisionNode);
