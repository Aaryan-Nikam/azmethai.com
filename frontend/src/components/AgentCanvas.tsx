import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import AgentNode from "@/nodes/AgentNode";
import ToolNode from "@/nodes/ToolNode";
import CodeNode from "@/nodes/CodeNode";
import ContextNode from "@/nodes/ContextNode";
import WorkflowNode from "@/nodes/WorkflowNode";
import ConnectorNode from "@/nodes/ConnectorNode";
import PlanNode from "@/nodes/PlanNode";
import DecisionNode from "@/nodes/DecisionNode";
import CanvasHUD from "./CanvasHUD";
import AnimatedEdge from "./AnimatedEdge";

export const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
  toolNode: ToolNode,
  codeNode: CodeNode,
  contextNode: ContextNode,
  workflowNode: WorkflowNode,
  connectorNode: ConnectorNode,
  planNode: PlanNode,
  decisionNode: DecisionNode,
};

export const edgeTypes = {
  animated: AnimatedEdge,
};

export default function AgentCanvas() {
  const storeNodes = useCanvasStore((s) => s.nodes);
  const storeEdges = useCanvasStore((s) => s.edges);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const highlightedNodeId = useCanvasStore((s) => s.highlightedNodeId);
  const sidebarOpen = useCanvasStore((s) => s.sidebarOpen);
  const darkMode = useCanvasStore((s) => s.darkMode);

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  useEffect(() => { setNodes(storeNodes); }, [storeNodes, setNodes]);
  useEffect(() => { setEdges(storeEdges); }, [storeEdges, setEdges]);

  const displayNodes = nodes.map((n) =>
    n.id === highlightedNodeId
      ? { ...n, style: { ...n.style, outline: "2px solid #4ade80", outlineOffset: 3, borderRadius: 8 } }
      : n
  );

  return (
    <div
      className={darkMode ? "dark-canvas" : ""}
      style={{
        position: "absolute",
        top: 44, left: 0, right: 0, bottom: sidebarOpen ? "35vh" : 0,
        transition: "bottom 0.28s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.14, maxZoom: 1 }}
        minZoom={0.15}
        maxZoom={2}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ 
          type: "animated", 
          style: { stroke: "#94a3b8", strokeWidth: 1.5 } 
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color={darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}
          style={{ background: "var(--bg)" }}
        />
        <CanvasHUD />
      </ReactFlow>
    </div>
  );
}
