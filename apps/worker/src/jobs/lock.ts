import { prisma } from '@hilo/db';
import { sealContent, merkleRoot } from '@hilo/shared';
import { makeWorker, QUEUES } from '../queue.js';

export interface LockJob {
  boardId: string;
  nodeId?: string;
}

export const lockWorker = makeWorker<LockJob>(QUEUES.lock, async ({ data }) => {
  const privateKey = process.env.HILO_LOCK_PRIVATE_KEY;
  if (!privateKey) return { skipped: true, reason: 'no key configured' };

  const board = await prisma.board.findUnique({
    where: { id: data.boardId },
    include: {
      nodes: data.nodeId
        ? { where: { id: data.nodeId } }
        : { orderBy: { id: 'asc' } },
      connections: { orderBy: { id: 'asc' } },
    },
  });
  if (!board) return { skipped: true };

  const canonical = {
    id: board.id,
    nodes: board.nodes.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      x: n.x,
      y: n.y,
      tags: n.tags,
    })),
    connections: board.connections.map((c) => ({
      id: c.id,
      from: c.fromNodeId,
      to: c.toNodeId,
      type: c.type,
    })),
  };

  const proof = sealContent(canonical, privateKey);

  // Anclaje periódico: agrupar últimos N hashes en merkle root.
  const recent = await prisma.hiloLock.findMany({
    where: { boardId: data.boardId, anchoredAt: null },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const root = merkleRoot([...recent.map((r) => r.payloadHash), proof.payloadHash]);

  await prisma.hiloLock.create({
    data: {
      boardId: data.boardId,
      nodeId: data.nodeId,
      payloadHash: proof.payloadHash,
      signature: proof.signature,
      publicKey: proof.publicKey,
      merkleRoot: root,
    },
  });

  return { ok: true, hash: proof.payloadHash };
});
