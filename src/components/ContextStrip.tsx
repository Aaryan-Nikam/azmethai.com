import { useEffect } from "react";
import { useCanvasStore } from "@/store/canvasStore";

const STAGE_MAP = {
  init:      { label: "Init",      color: "var(--text-muted)" },
  planning:  { label: "Planning",  color: "var(--blue)" },
  executing: { label: "Running",   color: "var(--accent)" },
  reviewing: { label: "Reviewing", color: "var(--amber)" },
  done:      { label: "Done",      color: "var(--accent)" },
};

function formatElapsed(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ContextStrip() {
  const taskTitle = useCanvasStore((s) => s.taskTitle);
  const taskStage = useCanvasStore((s) => s.taskStage);
  const model = useCanvasStore((s) => s.activeModel);
  const tokenUsed = useCanvasStore((s) => s.tokenUsed);
  const tokenBudget = useCanvasStore((s) => s.tokenBudget);
  const elapsed = useCanvasStore((s) => s.elapsedSeconds);
  const tick = useCanvasStore((s) => s.incrementElapsed);

  useEffect(() => {
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [tick]);

  const stageInfo = STAGE_MAP[taskStage];
  const tokenPct = (tokenUsed / tokenBudget) * 100;

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, height: 44,
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center",
      padding: "0 14px",
      gap: 0,
      zIndex: 20,
    }}>
      {/* Task name */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 20 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: stageInfo.color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {taskTitle}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>{stageInfo.label}</span>
      </div>

      <div style={{ width: 1, height: 16, background: "var(--border)", marginRight: 20 }} />

      {/* Model */}
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginRight: 20 }}>
        {model}
      </div>

      <div style={{ width: 1, height: 16, background: "var(--border)", marginRight: 20 }} />

      {/* Token usage */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 20 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Tokens</span>
        <div style={{ width: 80 }}>
          <div style={{ height: 2, background: "var(--border)", borderRadius: 1 }}>
            <div style={{
              height: "100%", borderRadius: 1,
              width: `${tokenPct}%`,
              background: tokenPct > 80 ? "var(--red)" : tokenPct > 50 ? "var(--amber)" : "var(--accent)",
              transition: "width 1s ease",
            }} />
          </div>
        </div>
        <span suppressHydrationWarning style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
          {(tokenUsed / 1000).toFixed(1)}k
        </span>
      </div>

      {/* Elapsed - push right */}
      <div suppressHydrationWarning style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
        {formatElapsed(elapsed)}
      </div>
    </div>
  );
}
