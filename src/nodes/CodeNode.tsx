import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { type CodeNodeData } from "@/store/canvasStore";

type Mode = "editor" | "terminal";

function CodeNode({ data }: NodeProps) {
  const d = data as CodeNodeData;
  const [mode, setMode] = useState<Mode>(d.mode === "form" ? "terminal" : d.mode ?? "terminal");

  const exitOk = d.exitCode === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`node ${d.isRunning ? "node-active" : ""}`}
      style={{ width: 300 }}
    >
      <Handle type="target" position={Position.Left}
        style={{ top: "50%", left: -4, width: 8, height: 8, background: "var(--border-hover)", border: "1.5px solid var(--border)", borderRadius: "50%" }}
      />
      <Handle type="source" position={Position.Right}
        style={{ top: "50%", right: -4, width: 8, height: 8, background: "var(--border-hover)", border: "1.5px solid var(--border)", borderRadius: "50%" }}
      />

      <div className="node-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px" }}>
            {d.language}
          </div>
          <span className="node-title">{d.filename}</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {(["editor", "terminal"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              background: mode === m ? "var(--surface-2)" : "transparent",
              border: `1px solid ${mode === m ? "var(--border-hover)" : "transparent"}`,
              borderRadius: 4, padding: "3px 7px",
              fontSize: 10, color: mode === m ? "var(--text-secondary)" : "var(--text-muted)",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {m === "editor" ? "<>" : ">_"}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "editor" && (
          <motion.div key="editor"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <div style={{ background: "#0c0c0e", padding: "10px 12px", maxHeight: 180, overflowY: "auto" }}>
              <pre className="mono" style={{ color: "#8b949e", fontSize: 11, lineHeight: 1.65, whiteSpace: "pre", overflow: "hidden" }}>
                {d.code}
              </pre>
            </div>
          </motion.div>
        )}

        {mode === "terminal" && (
          <motion.div key="terminal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <div style={{ background: "#0c0c0e", padding: "10px 12px", minHeight: 100, maxHeight: 180, overflowY: "auto", position: "relative" }}>
              {d.exitCode != null && !d.isRunning && (
                <div style={{
                  position: "absolute", top: 6, right: 8,
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  color: exitOk ? "var(--accent)" : "var(--red)",
                }}>
                  {exitOk ? "✓ 0" : `✗ ${d.exitCode}`}
                </div>
              )}
              {d.isRunning && (
                <div style={{
                  position: "absolute", top: 7, right: 9,
                  width: 10, height: 10,
                  border: "1.5px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                }} className="spin" />
              )}
              {(d.terminalLines ?? []).map((line, i) => (
                <div key={i} className="mono" style={{
                  fontSize: 11, lineHeight: 1.6,
                  color: line.startsWith("$") ? "var(--accent)"
                    : line.toLowerCase().includes("error") ? "var(--red)"
                    : "#6b7280",
                }}>
                  {line}
                </div>
              ))}
              {d.isRunning && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  style={{ display: "inline-block", width: 7, height: 13, background: "var(--accent)", verticalAlign: "middle", borderRadius: 1 }}
                />
              )}
            </div>
            <div style={{ padding: "6px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 6, alignItems: "center" }}>
              <span className="mono" style={{ color: "var(--accent)", fontSize: 11 }}>$</span>
              <input style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6b7280",
              }} placeholder="enter command..." />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default memo(CodeNode);
