import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";
import { motion } from "framer-motion";
import { type ContextNodeData } from "@/store/canvasStore";
import BaseNode from "./BaseNode";

function ContextNode({ id, data }: NodeProps) {
  const d = data as unknown as ContextNodeData;

  return (
    <BaseNode
      nodeId={id}
      icon={Database}
      title={d.label}
      typeLabel={`Context · ${d.dbName}`}
      status={d.status}
      autonomy={d.autonomyMode}
      confidence={d.confidence}
      intentPreview={d.intentPreview}
      traceLog={d.traceLog}
      userInput={d.userInput}
      width={240}
      footerLeft={
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {d.recordCount?.toLocaleString()} records
        </span>
      }
    >
      {/* Last query */}
      {d.lastQuery && (
        <div className="node-section">
          <div className="section-label">Last Query</div>
          <div className="mono" style={{
            color: "var(--text-secondary)", fontSize: 10, lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {d.lastQuery}
          </div>
        </div>
      )}

      {/* Query results mini-table */}
      {d.queryResults && d.queryResults.length > 0 && (
        <div className="node-section">
          <div className="section-label">Preview</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {Object.keys(d.queryResults[0]).map((k) => (
                    <th key={k} style={{ textAlign: "left", fontSize: 10, color: "var(--text-muted)", padding: "2px 4px", fontWeight: 500 }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.queryResults.slice(0, 3).map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="mono" style={{ fontSize: 10, color: "var(--text-secondary)", padding: "3px 4px", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Relevance scores bar chart */}
      {d.relevanceScores && d.relevanceScores.length > 0 && (
        <div className="node-section">
          <div className="section-label">Relevance</div>
          <div style={{ display: "flex", gap: 2, height: 20, alignItems: "flex-end" }}>
            {d.relevanceScores.map((score, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  flex: 1, height: `${Math.max(score * 100, 8)}%`,
                  borderRadius: 2, transformOrigin: "bottom",
                  background: score > 0.7 ? "var(--accent)" : score > 0.4 ? "var(--green)" : "var(--border-hover)",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </BaseNode>
  );
}

export default memo(ContextNode);
