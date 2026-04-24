import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";
import { type AgentNodeData } from "@/store/canvasStore";
import BaseNode from "./BaseNode";

function AgentNode({ id, data }: NodeProps) {
  const d = data as unknown as AgentNodeData;

  return (
    <BaseNode
      nodeId={id}
      icon={Bot}
      title={d.label}
      typeLabel={d.model ? `Agent · ${d.model}` : "Agent"}
      status={d.status}
      autonomy={d.autonomyMode}
      confidence={d.confidence}
      intentPreview={d.intentPreview}
      traceLog={d.traceLog}
      progress={d.progress}
      userInput={d.userInput}
      width={250}
    >
      {/* Current task */}
      {d.currentTask && (
        <div className="node-section">
          <div className="section-label">Current Task</div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {d.currentTask}
          </div>
        </div>
      )}

      {/* Last action */}
      {d.lastAction && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
          Last: {d.lastAction}
        </div>
      )}
    </BaseNode>
  );
}

export default memo(AgentNode);
