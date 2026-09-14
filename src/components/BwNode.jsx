import React from 'react';
import { Handle, Position } from '@xyflow/react';
import katex from 'katex';

function renderMathText(text = '') {
  if (!text) return null;

  const tokens = [];
  const regex = /\$([^$]+)\$/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }
    try {
      const html = katex.renderToString(match[1], { throwOnError: false });
      tokens.push(
        <span
          key={match.index}
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ display: 'inline-block' }}
        />
      );
    } catch {
      tokens.push(match[0]);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}

export const styleVariants = {
  root: {
    backgroundColor: '#000',
    color: '#fff',
    border: '2px solid #000',
    borderRadius: '24px',
    fontWeight: '700',
    fontSize: '15px',
  },
  law: {
    backgroundColor: '#fff',
    color: '#000',
    border: '3px solid #000',
    borderRadius: '0px',
    fontWeight: '800',
    letterSpacing: '0.04em',
    fontSize: '14px',
  },
  theorem: {
    backgroundColor: '#fff',
    color: '#000',
    border: '1.5px solid #000',
    borderLeft: '6px solid #000',
    borderRadius: '2px',
    fontWeight: '600',
    fontSize: '13px',
  },
  definition: {
    backgroundColor: '#fff',
    color: '#000',
    border: '1.5px solid #000',
    borderRadius: '4px',
    fontWeight: '600',
    fontSize: '13px',
  },
  formula: {
    backgroundColor: '#fff',
    color: '#000',
    border: '3.5px double #000',
    borderRadius: '4px',
    fontSize: '13px',
  },
  axiom: {
    backgroundColor: '#fff',
    color: '#000',
    border: '1.5px dotted #000',
    borderRadius: '4px',
    fontSize: '12px',
  },
  hypothesis: {
    backgroundColor: '#fff',
    color: '#000',
    border: '1.5px dashed #000',
    borderRadius: '4px',
    fontStyle: 'italic',
    fontSize: '12px',
  },
  constant: {
    backgroundColor: '#f5f5f5',
    color: '#000',
    border: '1px solid #000',
    borderRadius: '16px',
    fontSize: '11px',
    padding: '4px 10px',
  },
};

const handleStyle = {
  background: '#000',
  width: 7,
  height: 7,
  borderRadius: '50%',
  border: '1px solid #fff',
};

export default function BwNode({ data, selected }) {
  const currentVariant = styleVariants[data.variant] || styleVariants.definition;

  return (
    <div
      style={{
        ...currentVariant,
        padding: '10px 18px',
        textAlign: 'center',
        minWidth: '110px',
        outline: selected ? '2px solid #000' : 'none',
        outlineOffset: '2px',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* 4 Multi-Directional Handles */}
      <Handle type="source" position={Position.Top} id="top" isConnectable style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable style={handleStyle} />
      <Handle type="source" position={Position.Left} id="left" isConnectable style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable style={handleStyle} />

      <div>{renderMathText(data.label)}</div>
    </div>
  );
}