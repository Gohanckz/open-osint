import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@hilo/db';
import { makeWorker, QUEUES } from '../queue.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AiSuggestionJob {
  boardId: string;
  kind: 'DUPLICATE' | 'CONNECTION' | 'TAG' | 'SUMMARY' | 'CLUSTER';
}

export const aiWorker = makeWorker<AiSuggestionJob>(QUEUES.ai, async ({ data }) => {
  const nodes = await prisma.node.findMany({
    where: { boardId: data.boardId, status: 'APPROVED' },
    select: { id: true, type: true, title: true, subtitle: true, tags: true, fields: true },
    take: 200,
  });

  if (nodes.length < 3) return { skipped: true, reason: 'too few nodes' };

  // Prompt-cached system: el catálogo de tipos cambia raramente.
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text:
          'You are an investigation graph analyst. Suggest links between entities or duplicates. Respond strictly as JSON array of {kind, payload, confidence}.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `kind=${data.kind}\nnodes=${JSON.stringify(nodes).slice(0, 12000)}`,
      },
    ],
  });

  const text = message.content
    .map((c) => ('text' in c ? c.text : ''))
    .join('');

  let parsed: Array<{ kind: string; payload: unknown; confidence: number }> = [];
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = [];
  }

  for (const s of parsed.slice(0, 20)) {
    await prisma.aiSuggestion.create({
      data: {
        boardId: data.boardId,
        kind: s.kind,
        payload: s.payload as object,
        confidence: Math.min(1, Math.max(0, s.confidence ?? 0)),
      },
    });
  }

  return { count: parsed.length };
});
