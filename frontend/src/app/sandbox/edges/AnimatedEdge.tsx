import React from 'react'
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react'

const TOKEN_MAP: Record<string, string> = {
  data: 'var(--wire-data)',
  control: 'var(--wire-control)',
  context: 'var(--wire-context)',
  error: 'var(--wire-error)',
}

export function AnimatedEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Destructure custom props
  const wireType = (data?.wireType as string) || 'data'
  const isActive = !!data?.isActive
  const dataFlowing = !!data?.dataFlowing

  const strokeColor = TOKEN_MAP[wireType] || TOKEN_MAP.data

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: 2,
          opacity: isActive ? 0.8 : 0.3,
        }}
      />
      {isActive && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: strokeColor,
            strokeWidth: 2,
            strokeDasharray: '8 16',
          }}
          className="anim-dash-flow"
        />
      )}
      {dataFlowing && (
        <>
          <circle r="4" fill={strokeColor}>
            <animateMotion dur="0.9s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="4" fill={strokeColor}>
            <animateMotion dur="0.9s" begin="0.3s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="4" fill={strokeColor}>
            <animateMotion dur="0.9s" begin="0.6s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </>
      )}
    </>
  )
}
