import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  reconnectEdge, // <-- Added for shifting edge ends with mouse
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import BwNode from './components/BwNode';
import BwEdge from './components/BwEdge'; // <-- Import custom edge
import { generateTikZ } from './tikzGenerator';
import { getLayoutedElements } from './utils/layout';

const nodeTypes = { bwNode: BwNode };
const edgeTypes = { bwEdge: BwEdge }; // <-- Register custom edge type

const initialNodes = [
  { id: '1', type: 'bwNode', position: { x: 250, y: 50 }, data: { label: 'Classical Mechanics', variant: 'root' } },
  { id: '2', type: 'bwNode', position: { x: 100, y: 180 }, data: { label: 'Kinematics', variant: 'definition' } },
  { id: '3', type: 'bwNode', position: { x: 400, y: 180 }, data: { label: '$v = u + at$', variant: 'formula' } },
];

const initialEdges = [
  { id: 'e1-2', type: 'bwEdge', source: '1', target: '2', sourceHandle: 'bottom', targetHandle: 'top', data: { width: '1.2pt', label: '$F = ma$', fontStyle: '\\scriptsize' } },
  { id: 'e1-3', type: 'bwEdge', source: '1', target: '3', sourceHandle: 'bottom', targetHandle: 'top', data: { width: '0.8pt', label: 'yields', fontStyle: '\\scriptsize' } },
];

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedElement, setSelectedElement] = useState(null);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onConnect = useCallback((params) => {
    setEdges((eds) =>
      addEdge(
        {
          ...params,
          type: 'bwEdge', // <-- Ensure newly created lines use the custom KaTeX edge
          data: { width: '1.0pt', label: '', fontStyle: '\\scriptsize' },
        },
        eds
      )
    );
  }, []);

  // Enables detaching an existing edge endpoint and attaching it to another handle/node
  const onReconnect = useCallback((oldEdge, newConnection) => {
    setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
  }, []);

  const onSelectionChange = useCallback(({ nodes: selNodes, edges: selEdges }) => {
    if (selNodes?.length > 0) setSelectedElement({ type: 'node', item: selNodes[0] });
    else if (selEdges?.length > 0) setSelectedElement({ type: 'edge', item: selEdges[0] });
    else setSelectedElement(null);
  }, []);

  const handleAddNode = (variant = 'definition') => {
    const newId = String(Date.now());
    const newNode = {
      id: newId,
      type: 'bwNode',
      position: { x: 150 + Math.random() * 40, y: 150 + Math.random() * 40 },
      data: { label: 'New Concept', variant },
    };
    setNodes((nds) => [...nds, newNode]);

    if (selectedElement?.type === 'node') {
      const newEdge = {
        id: `e${selectedElement.item.id}-${newId}`,
        type: 'bwEdge',
        source: selectedElement.item.id,
        target: newId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        data: { width: '1.0pt', label: '', fontStyle: '\\scriptsize' },
      };
      setEdges((eds) => [...eds, newEdge]);
    }
  };

  const handleDeleteSelected = useCallback(() => {
    if (!selectedElement) return;
    if (selectedElement.type === 'node') {
      const targetId = selectedElement.item.id;
      setNodes((nds) => nds.filter((n) => n.id !== targetId));
      setEdges((eds) => eds.filter((e) => e.source !== targetId && e.target !== targetId));
    } else if (selectedElement.type === 'edge') {
      setEdges((eds) => eds.filter((e) => e.id !== selectedElement.item.id));
    }
    setSelectedElement(null);
  }, [selectedElement]);

  const updateNodeData = (key, val) => {
    setNodes((nds) => nds.map((n) => (n.id === selectedElement.item.id ? { ...n, data: { ...n.data, [key]: val } } : n)));
  };

  const updateEdgeData = (key, val) => {
    setEdges((eds) => eds.map((e) => (e.id === selectedElement.item.id ? { ...e, data: { ...e.data, [key]: val } } : e)));
  };

  const applyLayout = useCallback((direction) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges]);

  const tikzCode = useMemo(() => generateTikZ(nodes, edges), [nodes, edges]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* 1. Canvas Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: '8px', background: '#fff', padding: '6px', border: '1px solid #000', borderRadius: '4px' }}>
          <button onClick={() => handleAddNode('definition')} style={btnStyle}>+ Add Child</button>
          <button onClick={() => handleAddNode('formula')} style={btnStyle}>+ Add Formula</button>
          <button onClick={() => handleAddNode('root')} style={btnStyle}>+ Add Root</button>
          <span style={{ borderLeft: '1px solid #ccc', margin: '0 4px' }} />
          <button onClick={() => applyLayout('LR')} style={btnStyle}>Horizontal Auto-Layout</button>
          <button onClick={() => applyLayout('TB')} style={btnStyle}>Vertical Auto-Layout</button>
          <span style={{ borderLeft: '1px solid #ccc', margin: '0 4px' }} />
          <button onClick={handleDeleteSelected} disabled={!selectedElement} style={{ ...btnStyle, color: selectedElement ? '#b91c1c' : '#ccc' }}>Delete Selected</button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect} // <-- Enables dragging connector ends
          reconnectRadius={25}      // <-- Grabbable hot-zone radius at line ends
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}     // <-- Enables custom KaTeX edge renderer
          onSelectionChange={onSelectionChange}
          connectionMode="loose"    // <-- Allows arbitrary handle-to-handle snaps
          fitView
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>

      {/* 2. Inspector & TikZ Preview Sidebar */}
      <div style={{ width: '380px', borderLeft: '1px solid #000', display: 'flex', flexDirection: 'column', background: '#fafafa', height: '100vh' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #ddd' }}>
          <h2 style={{ fontSize: '15px', textTransform: 'uppercase', margin: 0, fontWeight: 800 }}>TikZ B&W Mindmap</h2>
          <span style={{ fontSize: '11px', color: '#666' }}>Publication vector exporter</span>
        </div>

        {/* Inspector Panel with constrained height */}
        <div style={{ padding: '16px', maxHeight: '42%', overflowY: 'auto', borderBottom: '1px solid #000', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>Inspector</div>
          {selectedElement?.type === 'node' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={labelStyle}>
                Node Label / LaTeX
                <input
                  type="text"
                  value={nodes.find((n) => n.id === selectedElement.item.id)?.data?.label || ''}
                  onChange={(e) => updateNodeData('label', e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Hierarchy Preset
                <select
                  value={nodes.find((n) => n.id === selectedElement.item.id)?.data?.variant || 'definition'}
                  onChange={(e) => updateNodeData('variant', e.target.value)}
                  style={inputStyle}
                >
                  <option value="root">Principal Field / Root</option>
                  <option value="law">Fundamental Law</option>
                  <option value="theorem">Theorem / Principle</option>
                  <option value="definition">Standard Definition</option>
                  <option value="formula">Key Equation (Double Frame)</option>
                  <option value="axiom">Postulate / Axiom (Dotted)</option>
                  <option value="hypothesis">Hypothesis (Dashed)</option>
                  <option value="constant">Constant / Unit (Capsule)</option>
                </select>
              </label>
            </div>
          )}

          {selectedElement?.type === 'edge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={labelStyle}>
                Connection Label / LaTeX (e.g. $F = ma$)
                <input
                  type="text"
                  value={edges.find((e) => e.id === selectedElement.item.id)?.data?.label || ''}
                  onChange={(e) => updateEdgeData('label', e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Line Width
                <select
                  value={edges.find((e) => e.id === selectedElement.item.id)?.data?.width || '1.0pt'}
                  onChange={(e) => updateEdgeData('width', e.target.value)}
                  style={inputStyle}
                >
                  <option value="0.5pt">Thin (0.5pt)</option>
                  <option value="1.0pt">Normal (1.0pt)</option>
                  <option value="1.8pt">Bold (1.8pt)</option>
                  <option value="2.5pt">Heavy (2.5pt)</option>
                </select>
              </label>

              <label style={labelStyle}>
                Style Modifier
                <select
                  value={edges.find((e) => e.id === selectedElement.item.id)?.data?.fontStyle || '\\scriptsize'}
                  onChange={(e) => updateEdgeData('fontStyle', e.target.value)}
                  style={inputStyle}
                >
                  <option value="\\scriptsize">Normal (\scriptsize)</option>
                  <option value="\\scriptsize\\itshape">Italic (\itshape)</option>
                  <option value="\\scriptsize\\bfseries">Bold (\bfseries)</option>
                </select>
              </label>
            </div>
          )}

          {!selectedElement && <span style={{ fontSize: '11px', color: '#999' }}>Click any node or connector to edit properties.</span>}
        </div>

        {/* Real-Time Code Box */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', background: '#fff', boxSizing: 'border-box', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>TikZ Source</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => navigator.clipboard.writeText(tikzCode)} style={btnStyle}>Copy</button>
              <form action="https://www.overleaf.com/docs" method="POST" target="_blank" style={{ margin: 0 }}>
                <input type="hidden" name="snip" value={tikzCode} />
                <button type="submit" style={{ ...btnStyle, background: '#000', color: '#fff' }}>Open in Overleaf</button>
              </form>
            </div>
          </div>
          <textarea
            readOnly
            value={tikzCode}
            style={{
              flex: 1,
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '11px',
              padding: '8px',
              border: '1px solid #000',
              borderRadius: '4px',
              background: '#111',
              color: '#5af78e',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
    </div>
  );
}

const btnStyle = { background: '#fff', border: '1px solid #000', borderRadius: '3px', padding: '4px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: 600 };
const inputStyle = { padding: '6px', border: '1px solid #000', borderRadius: '3px', fontSize: '12px' };