import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { type ConnectorNodeData } from "@/store/canvasStore";

function formatTime(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
}

function ConnectorNode({ data }: NodeProps) {
  const d = data as ConnectorNodeData;
  const isConnected = d.authStatus === "connected";
  const isExpired = d.authStatus === "expired";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="node"
      style={{ width: 200 }}
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
          }}>⬡</div>
          <span className="node-title">{d.serviceName}</span>
        </div>
        <div className={`chip ${isConnected ? "chip-green" : isExpired ? "chip-red" : "chip-amber"}`} style={{ gap: 4 }}>
          <div className={`dot ${isConnected ? "dot-green" : isExpired ? "dot-red" : "dot-amber"}`} />
          {isConnected ? "Live" : isExpired ? "Expired" : "Limited"}
        </div>
      </div>

      <div className="node-body">
        {d.recentActivity && d.recentActivity.length > 0 && (
          <div className="node-section">
            <div className="section-label">Recent</div>
            {d.recentActivity.slice(0, 4).map((act, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>
                  {act.endpoint.replace("GET /sobjects/", "").replace("POST /sobjects/", "").replace("PATCH /sobjects/", "").replace("GET /query/?q=SELECT...", "query…")}
                </span>
                <span className="mono" style={{ fontSize: 9, color: act.status < 300 ? "var(--accent)" : "var(--red)", flexShrink: 0 }}>
                  {act.status}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="node-section">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Rate limit</div>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{d.rateLimitPercent}%</span>
          </div>
          <div className="progress-track">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${d.rateLimitPercent}%` }}
              transition={{ duration: 0.8 }}
              className="progress-fill"
              style={{ background: d.rateLimitPercent > 80 ? "var(--red)" : d.rateLimitPercent > 50 ? "var(--amber)" : "var(--accent)" }}
            />
          </div>
          <div suppressHydrationWarning style={{ marginTop: 5, fontSize: 10, color: "var(--text-muted)" }}>
            {d.quotaRemaining?.toLocaleString()} remaining
          </div>
        </div>

        {isExpired && (
          <button style={{
            width: "100%", padding: "5px 0",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: 5, color: "var(--red)",
            fontFamily: "inherit", fontSize: 11, cursor: "pointer",
          }}>
            Re-authenticate
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default memo(ConnectorNode);
