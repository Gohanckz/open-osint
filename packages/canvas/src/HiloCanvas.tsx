'use client';

import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  ReactFlowProvider,
  PanOnScrollMode,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import { HiloNode } from './HiloNode.js';
import { HiloEdge } from './HiloEdge.js';
import { NODE_TYPE_META } from '@hilo/shared';
import type { HiloNodeData, HiloEdgeData } from './types.js';

export interface HiloCanvasProps {
  nodes: Node<HiloNodeData>[];
  edges: Edge<HiloEdgeData>[];
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (conn: Connection) => void;
  onNodeDoubleClick?: (e: React.MouseEvent, node: Node<HiloNodeData>) => void;
  readOnly?: boolean;
}

const nodeTypes = { hilo: HiloNode };
const edgeTypes = { hilo: HiloEdge };

function CanvasInner(props: HiloCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDoubleClick,
    readOnly = false,
  } = props;

  const minimapNodeColor = useCallback(
    (n: Node) => NODE_TYPE_META[(n.data as HiloNodeData).type]?.color ?? '#8E9AAF',
    [],
  );

  const defaultEdgeOptions = useMemo(
    () => ({ type: 'hilo' as const, animated: false }),
    [],
  );

  return (
    <ReactFlow
      className="hilo-canvas"
      nodes={nodes}
      edges={edges}
      onNodesChange={readOnly ? undefined : onNodesChange}
      onEdgesChange={readOnly ? undefined : onEdgesChange}
      onConnect={readOnly ? undefined : onConnect}
      onNodeDoubleClick={onNodeDoubleClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
      elementsSelectable
      panOnScroll
      panOnScrollMode={PanOnScrollMode.Free}
      zoomOnPinch
      minZoom={0.15}
      maxZoom={2.5}
      fitView
      proOptions={{ hideAttribution: true }}
      // Desactivamos el delete nativo de ReactFlow porque lo manejamos
      // desde BoardCanvas (con confirmación + persistencia en DB).
      deleteKeyCode={null}
    >
      <MiniMap pannable zoomable nodeColor={minimapNodeColor} maskColor="rgba(60,40,25,0.5)" />
      <Controls position="bottom-right" showInteractive={false} />
    </ReactFlow>
  );
}

export function HiloCanvas(props: HiloCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
