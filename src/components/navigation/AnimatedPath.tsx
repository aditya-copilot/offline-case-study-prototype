import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Vector2 } from '@core/spatial/types';

interface PathSegment {
  from: Vector2;
  to: Vector2;
  completed: boolean;
}

interface AnimatedPathProps {
  segments: PathSegment[];
  scale?: number;
  strokeWidth?: number;
  color?: string;
  completedColor?: string;
  animationDuration?: number;
  showArrows?: boolean;
}

export const AnimatedPath: React.FC<AnimatedPathProps> = ({
  segments,
  scale = 1,
  strokeWidth = 3,
  color = '#3b82f6',
  completedColor = '#10b981',
  animationDuration = 1.5,
  showArrows = true
}) => {
  const [animatedSegments, setAnimatedSegments] = useState<number[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    segments.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedSegments(prev => [...prev, index]);
      }, index * 200);
    });
  }, [segments]);

  const createPathD = (from: Vector2, to: Vector2): string => {
    return `M ${from.x * scale} ${from.y * scale} L ${to.x * scale} ${to.y * scale}`;
  };

  const calculateArrowPosition = (from: Vector2, to: Vector2): { x: number; y: number; rotation: number } => {
    const midX = ((from.x + to.x) / 2) * scale;
    const midY = ((from.y + to.y) / 2) * scale;
    const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
    return { x: midX, y: midY, rotation: angle };
  };

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
        <marker
          id="arrowhead-completed"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={completedColor} />
        </marker>
      </defs>

      {segments.map((segment, index) => {
        const isAnimated = animatedSegments.includes(index);
        const isCompleted = segment.completed;
        const pathD = createPathD(segment.from, segment.to);
        const arrow = showArrows ? calculateArrowPosition(segment.from, segment.to) : null;

        return (
          <g key={index}>
            <motion.path
              ref={el => { pathRefs.current[index] = el; }}
              d={pathD}
              fill="none"
              stroke={isCompleted ? completedColor : color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={isCompleted ? 'url(#arrowhead-completed)' : 'url(#arrowhead)'}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: isAnimated ? 1 : 0, 
                opacity: isAnimated ? 1 : 0 
              }}
              transition={{ 
                pathLength: { duration: animationDuration, ease: "easeInOut" },
                opacity: { duration: 0.3 }
              }}
            />

            {arrow && (
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: isAnimated ? 1 : 0, 
                  scale: isAnimated ? 1 : 0 
                }}
                transition={{ delay: animationDuration * 0.5, duration: 0.3 }}
                transform={`translate(${arrow.x}, ${arrow.y}) rotate(${arrow.rotation})`}
              >
                <polygon
                  points="-8,-5 0,0 -8,5"
                  fill={isCompleted ? completedColor : color}
                />
              </motion.g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
