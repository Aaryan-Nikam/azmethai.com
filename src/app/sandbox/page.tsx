'use client'

import React, { useEffect, useRef } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Store and Components
import { useCanvasStore } from '@/store/canvasStore'
import AgentCanvas from '@/components/AgentCanvas'
import ContextStrip from '@/components/ContextStrip'
import AgentSidebar from '@/components/AgentSidebar'
import ChatBar from '@/components/ChatBar'

function LiveAgent() {
  const { spawnNode, updateNodeData, addLog } = useCanvasStore()
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    connectGateway()
    return () => ws.current?.close()
  }, [])

  const connectGateway = () => {
    const socket = new WebSocket('ws://localhost:4002/engine')
    
    socket.onopen = () => {
      addLog({ actionType: 'WORKFLOW', description: 'Gateway Connected (ws://localhost:4002/engine)', nodeId: 'agent-1' })
      updateNodeData('agent-1', { status: 'idle', currentTask: 'Connected to gateway' })
    }
    
    socket.onclose = () => {
      addLog({ actionType: 'WORKFLOW', description: 'Connection Lost. Reconnecting...', nodeId: 'agent-1' })
      updateNodeData('agent-1', { status: 'error', currentTask: 'Reconnecting...' })
      setTimeout(connectGateway, 3000)
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'engine:ready') return
        handleEngineEvent(data)
      } catch (e) {
        console.error('Failed to parse WS msg', e)
      }
    }

    ws.current = socket
  }

  const handleEngineEvent = (data: any) => {
    const type = data.type.replace(/^engine:/, '')
    
    if (type === 'thinking') {
      updateNodeData('agent-1', { status: 'thinking', currentTask: data.content?.substring(0, 100) + '...' })
      addLog({ actionType: 'THINKING', description: data.content?.substring(0, 100) + '...', nodeId: 'agent-1' })
    }
    
    else if (type === 'tool_use') {
      updateNodeData('agent-1', { status: 'executing' })
      addLog({ actionType: 'TOOL', description: `Executing tool: ${data.toolName}`, nodeId: 'agent-1' })
      
      spawnNode('toolNode', 'agent-1', {
        status: 'calling',
        toolName: data.toolName,
        inputParams: data.input,
      })
    }
    
    else if (type === 'observation') {
      const { nodes } = useCanvasStore.getState()
      const pendingTool = [...nodes].reverse().find(n => n.type === 'toolNode' && n.data.status === 'calling')
      
      if (pendingTool) {
        updateNodeData(pendingTool.id, { status: 'done', output: JSON.stringify(data.result, null, 2) })
      }
      
      updateNodeData('agent-1', { status: 'thinking' })
      addLog({ actionType: 'WORKFLOW', description: `Gathered observation from tool.`, nodeId: pendingTool?.id })
    }
    
    else if (type === 'interruption') {
      updateNodeData('agent-1', { status: 'idle', currentTask: 'Waiting for user input' })
      addLog({ actionType: 'QUERY', description: `Interruption: ${data.reason || 'Approval requested'}`, nodeId: 'agent-1' })
      
      spawnNode('codeNode', 'agent-1', {
        mode: 'form',
        exitCode: 0,
        isRunning: false,
        terminalLines: ['Approval Required...'],
      })
    }
  }

  const handleSend = (message: string) => {
    if (!ws.current) return;
    
    // Create an initial agent node if canvas is empty
    const { nodes, setNodes, setTaskStage, setAgentStatus } = useCanvasStore.getState();
    if (!nodes.find(n => n.id === 'agent-1')) {
      setNodes([
        {
          id: "agent-1",
          type: "agentNode",
          position: { x: window.innerWidth / 2 - 150, y: 150 },
          data: {
            label: "AI Employee",
            status: "thinking",
            currentTask: "Starting task...",
            progress: 0,
          },
          draggable: true,
        }
      ]);
    }
    
    setTaskStage('executing');
    setAgentStatus('thinking');
    updateNodeData('agent-1', { status: 'thinking', currentTask: 'Awaiting first steps...' });
    
    ws.current.send(JSON.stringify({
      type: "engine:start",
      message,
      sessionId: "agent-1",
      tenantId: "t-1",
      roleId: "r-1"
    }));
  };

  return <ChatBar onSend={handleSend} />
}

export default function SandboxCanvasFlow() {
  return (
    <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden", background: "var(--bg)" }}>
      <ReactFlowProvider>
        <LiveAgent />
        <ContextStrip />
        <AgentSidebar />
        <AgentCanvas />
      </ReactFlowProvider>
    </div>
  )
}
