import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { type ContextNodeData } from "@/store/canvasStore";

function ContextNode({ data }: NodeProps) {
  const d = data as ContextNodeData;
  const isQuerying = d.status === "querying";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`node ${isQuerying ? "node-active" : ""}`}
      style={{ width: 230 }}
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
          }}>◫</div>
          <div>
            <div className="node-title">{d.label}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{d.dbName}</div>
          </div>
        </div>
        <div className={`chip ${isQuerying ? "chip-blue" : "chip-default"}`} style={{ gap: 4 }}>
          {isQuerying && <div className="dot dot-blue dot-pulse" />}
          {isQuerying ? "Querying" : "Idle"}
        </div>
      </div>

      <div className="node-body">
        <div className="node-section">
          <div className="section-label">Records</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            {d.recordCount?.toLocaleString()}
          </div>
        </div>

        {d.lastQuery && (
          <div className="node-section">
            <div className="section-label">Last query</div>
            <div className="mono" style={{
              color: "var(--text-secondary)", fontSize: 10, lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {d.lastQuery}
            </div>
          </div>
        )}

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
                    background: score > 0.7 ? "var(--accent)" : score > 0.4 ? "rgba(74,222,128,0.4)" : "var(--border-hover)",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default memo(ContextNode);
