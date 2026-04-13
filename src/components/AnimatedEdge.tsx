import { EdgeProps, getBezierPath } from '@xyflow/react';

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style = {},
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <defs>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Base dim path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke="var(--border-hover, #2e2e38)"
        strokeWidth={2}
        markerEnd={markerEnd}
        style={style}
      />
      
      {/* Dashed animated flow */}
      <path
        d={edgePath}
        fill="none"
        stroke="var(--accent, #4ade80)"
        strokeWidth={1.5}
        strokeDasharray="5 15"
        className="animate-edge-flow"
        style={{ opacity: 0.6 }}
      />
      
      {/* Data particle moving along the edge */}
      <circle r="4" fill="#4ade80" filter={`url(#glow-${id})`}>
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
}
