// Semantic zoom: agrupa nodos por proximidad espacial cuando el zoom es bajo.
// Implementación simple O(n log n) con grid bucketing — suficiente hasta ~5k nodos.

import type { Node } from '@xyflow/react';
import type { HiloNodeData } from './types.js';

export interface Cluster {
  id: string;
  x: number;
  y: number;
  count: number;
  nodeIds: string[];
  topTags: string[];
}

export function clusterByZoom(
  nodes: Node<HiloNodeData>[],
  zoom: number,
  thresholdZoom = 0.4,
): { clusters: Cluster[]; visibleNodes: Node<HiloNodeData>[] } {
  if (zoom >= thresholdZoom) return { clusters: [], visibleNodes: nodes };

  const cellSize = 220 / Math.max(zoom, 0.05);
  const buckets = new Map<string, Node<HiloNodeData>[]>();

  for (const n of nodes) {
    const cx = Math.floor(n.position.x / cellSize);
    const cy = Math.floor(n.position.y / cellSize);
    const key = `${cx}:${cy}`;
    const arr = buckets.get(key);
    if (arr) arr.push(n);
    else buckets.set(key, [n]);
  }

  const clusters: Cluster[] = [];
  const visibleNodes: Node<HiloNodeData>[] = [];

  for (const [key, arr] of buckets) {
    if (arr.length <= 2) {
      visibleNodes.push(...arr);
      continue;
    }
    const x = arr.reduce((s, n) => s + n.position.x, 0) / arr.length;
    const y = arr.reduce((s, n) => s + n.position.y, 0) / arr.length;
    const tagCount = new Map<string, number>();
    for (const n of arr) {
      for (const t of n.data.tags ?? []) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }
    const topTags = [...tagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    clusters.push({
      id: `cluster-${key}`,
      x,
      y,
      count: arr.length,
      nodeIds: arr.map((n) => n.id),
      topTags,
    });
  }

  return { clusters, visibleNodes };
}
