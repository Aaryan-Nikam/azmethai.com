import { memo, useState } from "react";
import { type NodeProps } from "@xyflow/react";
import { Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type CodeNodeData } from "@/store/canvasStore";
import BaseNode from "./BaseNode";

type Mode = "editor" | "terminal";

function CodeNode({ id, data }: NodeProps) {
  const d = data as unknown as CodeNodeData;
  const [mode, setMode] = useState<Mode>(d.mode === "form" ? "terminal" : d.mode ?? "terminal");
  const exitOk = d.exitCode === 0;

  // Map internal running state to unified NodeStatus
  const nodeStatus = d.isRunning ? "running" as const : d.status;

  return (
    <BaseNode
      nodeId={id}
      icon={Code}
      title={d.filename}
      typeLabel={`Code · ${d.language}`}
      status={nodeStatus}
      autonomy={d.autonomyMode}
      confidence={d.confidence}
      intentPreview={d.intentPreview}
      traceLog={d.traceLog}
      userInput={d.userInput}
      width={300}
      footerLeft={
        <div style={{ display: "flex", gap: 2 }}>
          {(["editor", "terminal"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              background: mode === m ? "var(--surface-3)" : "transparent",
              border: `1px solid ${mode === m ? "var(--border-hover)" : "transparent"}`,
              borderRadius: 4, padding: "3px 7px",
              fontSize: 10, color: mode === m ? "var(--text-secondary)" : "var(--text-muted)",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {m === "editor" ? "<>" : ">_"}
            </button>
          ))}
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {mode === "editor" && (
          <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
            <div style={{
              background: "var(--surface-2)", padding: "10px 12px", maxHeight: 160,
              overflowY: "auto", borderRadius: 6, border: "1px solid var(--border)",
            }}>
              <pre className="mono" style={{ color: "var(--text-secondary)", fontSize: 11, lineHeight: 1.65, whiteSpace: "pre", overflow: "hidden", margin: 0 }}>
                {d.code}
              </pre>
            </div>
          </motion.div>
        )}

        {mode === "terminal" && (
          <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
            <div style={{
              background: "var(--surface-2)", padding: "10px 12px", minHeight: 80, maxHeight: 160,
              overflowY: "auto", position: "relative", borderRadius: 6, border: "1px solid var(--border)",
            }}>
              {d.exitCode != null && !d.isRunning && (
                <div style={{
                  position: "absolute", top: 6, right: 8,
                  fontSize: 10, fontFamily: "'Menlo', monospace",
                  color: exitOk ? "var(--green)" : "var(--red)",
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
                    : "var(--text-muted)",
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
          </motion.div>
        )}
      </AnimatePresence>
    </BaseNode>
  );
}

export default memo(CodeNode);
