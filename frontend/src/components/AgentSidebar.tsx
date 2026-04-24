import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore, type LogEntry } from "@/store/canvasStore";

const ACTION_STYLE = {
  THINKING: { color: "var(--blue)", label: "think" },
  TOOL:     { color: "var(--accent)", label: "tool" },
  CODE:     { color: "var(--accent)", label: "code" },
  QUERY:    { color: "var(--amber)", label: "query" },
  WORKFLOW: { color: "#a78bfa", label: "flow" },
};

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function LogRow({ entry }: { entry: LogEntry }) {
  const highlight = useCanvasStore((s) => s.highlightNode);
  const s = ACTION_STYLE[entry.actionType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onClick={() => entry.nodeId && highlight(entry.nodeId)}
      style={{
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
        cursor: entry.nodeId ? "pointer" : "default",
        transition: "background 0.1s",
      }}
      whileHover={entry.nodeId ? { backgroundColor: "rgba(255,255,255,0.015)" } : {}}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>
          {s.label}
        </span>
        <span suppressHydrationWarning style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
          {formatTime(entry.timestamp)}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.45 }}>
        {entry.description}
      </div>
    </motion.div>
  );
}

export default function AgentSidebar() {
  const logs = useCanvasStore((s) => s.logs);
  const open = useCanvasStore((s) => s.sidebarOpen);
  const toggle = useCanvasStore((s) => s.toggleSidebar);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              position: "absolute",
              left: 0, right: 0, bottom: 0,
              height: "35vh",
              minHeight: 250,
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              display: "flex", flexDirection: "column",
              zIndex: 40,
            }}
          >
            {/* Header */}
            <div style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--bg)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Activity & Execution Logs</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "2px 6px", background: "var(--surface-2)", borderRadius: 4 }}>{logs.length} EVENTS</div>
              </div>
              <button onClick={toggle} style={{
                background: "none", border: "1px solid var(--border)",
                borderRadius: 5, width: 28, height: 28,
                cursor: "pointer", color: "var(--text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>
                ↓
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {logs.map((e) => <LogRow key={e.id} entry={e} />)}
              {logs.length === 0 && (
                <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  Waiting for agent execution to begin...
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <button
          onClick={toggle}
          style={{
            position: "absolute",
            left: "50%", bottom: 0, transform: "translateX(-50%)",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0", padding: "6px 16px",
            cursor: "pointer", color: "var(--text-secondary)",
            fontSize: 12, fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 8,
            zIndex: 10,
            boxShadow: "0 -4px 12px rgba(0,0,0,0.2)"
          }}
        >
          Execution Logs
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
        </button>
      )}
    </>
  );
}
