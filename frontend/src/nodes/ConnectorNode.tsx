import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { Plug } from "lucide-react";
import { motion } from "framer-motion";
import { type ConnectorNodeData } from "@/store/canvasStore";
import BaseNode from "./BaseNode";

function ConnectorNode({ id, data }: NodeProps) {
  const d = data as unknown as ConnectorNodeData;
  const isConnected = d.authStatus === "connected";
  const isExpired = d.authStatus === "expired";

  const authChipClass = isConnected ? "chip-green" : isExpired ? "chip-red" : "chip-amber";
  const authDotClass = isConnected ? "dot-green" : isExpired ? "dot-red" : "dot-amber";
  const authLabel = isConnected ? "Live" : isExpired ? "Expired" : "Limited";

  return (
    <BaseNode
      nodeId={id}
      icon={Plug}
      title={d.serviceName}
      typeLabel="Connector"
      status={d.status}
      autonomy={d.autonomyMode}
      confidence={d.confidence}
      intentPreview={d.intentPreview}
      traceLog={d.traceLog}
      userInput={d.userInput}
      width={210}
      footerLeft={
        <span className={`chip ${authChipClass}`} style={{ gap: 4 }}>
          <div className={`dot ${authDotClass} ${isConnected ? "dot-pulse" : ""}`} />
          {authLabel}
        </span>
      }
    >
      {/* Recent API activity */}
      {d.recentActivity && d.recentActivity.length > 0 && (
        <div className="node-section">
          <div className="section-label">Recent</div>
          {d.recentActivity.slice(0, 3).map((act, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
              <span className="mono" style={{
                fontSize: 10, color: "var(--text-muted)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120,
              }}>
                {act.endpoint}
              </span>
              <span className="mono" style={{
                fontSize: 9, flexShrink: 0,
                color: act.status < 300 ? "var(--green)" : "var(--red)",
              }}>
                {act.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Rate limit */}
      <div className="node-section">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>Rate Limit</div>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{d.rateLimitPercent}%</span>
        </div>
        <div className="progress-track">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${d.rateLimitPercent}%` }}
            transition={{ duration: 0.8 }}
            className="progress-fill"
            style={{
              background: d.rateLimitPercent > 80 ? "var(--red)"
                : d.rateLimitPercent > 50 ? "var(--amber)"
                : "var(--green)",
            }}
          />
        </div>
        <div suppressHydrationWarning style={{ marginTop: 4, fontSize: 10, color: "var(--text-muted)" }}>
          {d.quotaRemaining?.toLocaleString()} remaining
        </div>
      </div>

      {/* Re-auth button */}
      {isExpired && (
        <button className="hitl-btn hitl-btn-reject" style={{ width: "100%", marginTop: 4, textAlign: "center" }}>
          Re-authenticate
        </button>
      )}
    </BaseNode>
  );
}

export default memo(ConnectorNode);
