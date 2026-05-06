// Hooks Yjs ↔ React Flow.
// Mantiene un Y.Map<HiloNodeData> y Y.Array<HiloEdgeData> sincronizado con el canvas.

import * as Y from 'yjs';
import type { Node, Edge } from '@xyflow/react';
import type { HiloNodeData, HiloEdgeData } from './types.js';

export interface YBoardDoc {
  doc: Y.Doc;
  nodes: Y.Map<Y.Map<unknown>>;
  edges: Y.Array<Y.Map<unknown>>;
  meta: Y.Map<unknown>;
}

export function createBoardDoc(): YBoardDoc {
  const doc = new Y.Doc();
  return {
    doc,
    nodes: doc.getMap('nodes'),
    edges: doc.getArray('edges') as unknown as Y.Array<Y.Map<unknown>>,
    meta: doc.getMap('meta'),
  };
}

export function ymapToNode(id: string, m: Y.Map<unknown>): Node<HiloNodeData> {
  return {
    id,
    type: 'hilo',
    position: { x: (m.get('x') as number) ?? 0, y: (m.get('y') as number) ?? 0 },
    data: {
      type: (m.get('type') as HiloNodeData['type']) ?? 'CUSTOM',
      title: (m.get('title') as string) ?? '',
      subtitle: m.get('subtitle') as string | undefined,
      tags: (m.get('tags') as string[]) ?? [],
      attachmentsCount: (m.get('attachmentsCount') as number) ?? 0,
      commentsCount: (m.get('commentsCount') as number) ?? 0,
      status: (m.get('status') as HiloNodeData['status']) ?? 'APPROVED',
      color: m.get('color') as string | undefined,
      fields: (m.get('fields') as Record<string, string | number | null>) ?? {},
    },
    width: (m.get('width') as number) ?? 240,
    height: (m.get('height') as number) ?? 160,
  };
}

export function ymapToEdge(m: Y.Map<unknown>): Edge<HiloEdgeData> {
  return {
    id: m.get('id') as string,
    type: 'hilo',
    source: m.get('source') as string,
    target: m.get('target') as string,
    data: {
      type: (m.get('type') as HiloEdgeData['type']) ?? 'CUSTOM',
      label: m.get('label') as string | undefined,
      strength: (m.get('strength') as number) ?? 1,
      verified: (m.get('verified') as boolean) ?? false,
      directional: (m.get('directional') as boolean) ?? true,
    },
  };
}

export function snapshotToReactFlow(y: YBoardDoc): {
  nodes: Node<HiloNodeData>[];
  edges: Edge<HiloEdgeData>[];
} {
  const nodes: Node<HiloNodeData>[] = [];
  y.nodes.forEach((m, id) => nodes.push(ymapToNode(id, m)));
  const edges = y.edges.toArray().map(ymapToEdge);
  return { nodes, edges };
}

export function upsertNode(y: YBoardDoc, id: string, patch: Partial<HiloNodeData & { x: number; y: number }>) {
  y.doc.transact(() => {
    let m = y.nodes.get(id);
    if (!m) {
      m = new Y.Map();
      y.nodes.set(id, m);
    }
    for (const [k, v] of Object.entries(patch)) m.set(k, v);
  });
}

export function removeNode(y: YBoardDoc, id: string) {
  y.doc.transact(() => {
    y.nodes.delete(id);
    const toRemove: number[] = [];
    y.edges.forEach((e, i) => {
      if (e.get('source') === id || e.get('target') === id) toRemove.push(i);
    });
    for (let i = toRemove.length - 1; i >= 0; i--) y.edges.delete(toRemove[i]!, 1);
  });
}
