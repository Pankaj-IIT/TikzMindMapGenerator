import React from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import katex from 'katex';

function renderMathText(text = '') {
  if (!text) return null;
  const tokens = [];
  const regex = /\$([^$]+)\$/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) tokens.push(text.substring(lastIndex, match.index));
    try {
      const html = katex.renderToString(match[1], { throwOnError: false });
      tokens.push(
        <span key={match.index} dangerouslySetInnerHTML={{ __html: html }} style={{ display: 'inline-block' }} />
      );
    } catch {
      tokens.push(match[0]);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) tokens.push(text.substring(lastIndex));
  return tokens.length > 0 ? tokens : text;
}

export default function BwEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const width = parseFloat(data?.width) || 1.2;
  const isItalic = data?.fontStyle?.includes('itshape');
  const isBold = data?.fontStyle?.includes('bfseries');

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: '#000',
          strokeWidth: width,
          strokeDasharray: data?.dashed ? '5,5' : undefined,
          filter: selected ? 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' : 'none',
        }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#fff',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid #000',
              fontSize: '11px',
              fontWeight: isBold ? 700 : 400,
              fontStyle: isItalic ? 'italic' : 'normal',
              pointerEvents: 'all', // Allows clicking edge label directly
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {renderMathText(data.label)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}