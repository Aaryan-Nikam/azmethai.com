import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/store/canvasStore";

export default function CanvasHUD() {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const nodes = useCanvasStore((s) => s.nodes);
  const agentStatus = useCanvasStore((s) => s.agentStatus);
  const zoom = Math.round(getZoom() * 100);

  const statusColor = {
    idle: "var(--text-muted)",
    thinking: "var(--blue)",
    executing: "var(--accent)",
    error: "var(--red)",
    done: "var(--accent)",
  }[agentStatus] ?? "var(--text-muted)";

  const btnStyle = {
    background: "none",
    border: "none",
    padding: "7px 10px",
    cursor: "pointer",
    color: "var(--text-secondary)",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.1s",
    fontFamily: "inherit",
  } as const;

  return (
    <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 10 }}>
      {/* Status bar */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 6, padding: "5px 10px",
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 11,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
        <span style={{ color: statusColor }}>{agentStatus}</span>
        <div style={{ width: 1, height: 12, background: "var(--border)" }} />
        <span style={{ color: "var(--text-muted)" }}>{nodes.length} nodes</span>
        <div style={{ width: 1, height: 12, background: "var(--border)" }} />
        <span suppressHydrationWarning style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>{zoom}%</span>
      </div>

      {/* Zoom controls */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 6, overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <button style={{ ...btnStyle, borderBottom: "1px solid var(--border)" }} onClick={() => zoomIn()} title="Zoom in">+</button>
        <button style={{ ...btnStyle, borderBottom: "1px solid var(--border)" }} onClick={() => zoomOut()} title="Zoom out">−</button>
        <button style={{ ...btnStyle, fontSize: 11 }} onClick={() => fitView({ duration: 400, padding: 0.12 })} title="Fit view">⤢</button>
      </div>
    </div>
  );
}
