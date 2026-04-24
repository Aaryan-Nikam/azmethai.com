import { memo, useState } from "react";
import { type NodeProps } from "@xyflow/react";
import { Wrench } from "lucide-react";
import { type ToolNodeData } from "@/store/canvasStore";
import BaseNode from "./BaseNode";

function formatTime(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
}

function ToolNode({ id, data }: NodeProps) {
  const d = data as unknown as ToolNodeData;
  const [outputOpen, setOutputOpen] = useState(false);

  return (
    <BaseNode
      nodeId={id}
      icon={Wrench}
      title={d.toolName}
      typeLabel="Tool"
      status={d.status}
      autonomy={d.autonomyMode}
      confidence={d.confidence}
      intentPreview={d.intentPreview}
      traceLog={d.traceLog}
      userInput={d.userInput}
      width={220}
      footerLeft={
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {d.callCount}× called
          {d.lastCalled && <> · <span suppressHydrationWarning>{formatTime(d.lastCalled)}</span></>}
        </span>
      }
    >
      {/* Input params */}
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

      {/* Output */}
      {d.output && (
        <div className="node-section">
          <div
            className="section-label"
            style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            onClick={() => setOutputOpen(!outputOpen)}
          >
            <span>Output</span>
            <span style={{ color: "var(--accent)", fontSize: 9 }}>{outputOpen ? "▲" : "▼"}</span>
          </div>
          <div className="mono" style={{
            color: "var(--text-secondary)",
            maxHeight: outputOpen ? 100 : 28,
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

      {/* Error */}
      {d.status === "error" && d.errorMessage && (
        <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4, lineHeight: 1.4 }}>
          {d.errorMessage}
        </div>
      )}
    </BaseNode>
  );
}

export default memo(ToolNode);
