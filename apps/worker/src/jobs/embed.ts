import { prisma } from '@hilo/db';
import { makeWorker, QUEUES } from '../queue.js';

export interface EmbedJob {
  nodeId: string;
}

export const embedWorker = makeWorker<EmbedJob>(QUEUES.embed, async ({ data }) => {
  // Placeholder: en producción llamaríamos a Voyage / OpenAI / local embeddings.
  // Aquí dejamos pendiente el upsert real para no romper el flujo si no hay credenciales.
  const node = await prisma.node.findUnique({ where: { id: data.nodeId } });
  if (!node) return { skipped: true };
  return { ok: true, todo: 'embed via provider' };
});
