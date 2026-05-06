import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { revalidateTag } from 'next/cache';
import type { Prisma } from '@hilo/db';
import { router, boardProcedure } from '../trpc.js';
import { prisma } from '@hilo/db';
import { CreateNodeSchema, NodeFieldsSchema } from '@hilo/shared';

/**
 * Whitelist de campos editables por un EDITOR/OWNER.
 * NUNCA permitas: boardId, createdById, status (mass-assignment / cross-board).
 * Cambios de status van por endpoints específicos (remove, etc.).
 */
const NodePatchSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(200).nullish(),
    fields: NodeFieldsSchema.optional(),
    contentMd: z.string().max(50_000).nullish(),
    tags: z.array(z.string().max(40)).max(30).optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .nullish(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  })
  .strict();

/** Subset de campos que NO requieren snapshot en NodeVersion (movimientos). */
const POSITION_KEYS = new Set(['x', 'y', 'width', 'height']);

/**
 * Reduce el peso de `fields` en respuestas de lista: los `attachments` solo
 * llevan metadatos (sin dataURL). El cliente debe pedir el nodo individual
 * vía `node.byId` para obtener los blobs binarios. `photoUrl` se mantiene
 * (suele ser <200 KB y se ve en el canvas).
 */
function stripHeavyFields(fields: unknown): unknown {
  if (!fields || typeof fields !== 'object') return fields;
  const f = fields as Record<string, unknown>;
  if (!Array.isArray(f.attachments)) return f;
  const trimmed = (f.attachments as Array<Record<string, unknown>>).map((a) => ({
    name: a.name,
    mime: a.mime,
    size: a.size,
    // dataUrl omitido — disponible vía node.byId
  }));
  return { ...f, attachments: trimmed };
}

export const nodeRouter = router({
  list: boardProcedure('VIEWER').query(async ({ input }) => {
    const nodes = await prisma.node.findMany({
      where: { boardId: input.boardId, status: { not: 'ARCHIVED' } },
      orderBy: { createdAt: 'asc' },
    });
    return nodes.map((n) => ({ ...n, fields: stripHeavyFields(n.fields) }));
  }),

  /** Devuelve un nodo completo con todos sus blobs (para Inspector). */
  byId: boardProcedure('VIEWER')
    .input(z.object({ boardId: z.string().cuid(), id: z.string().cuid() }))
    .query(async ({ input }) => {
      const node = await prisma.node.findFirst({
        where: { id: input.id, boardId: input.boardId, status: { not: 'ARCHIVED' } },
      });
      if (!node) throw new TRPCError({ code: 'NOT_FOUND' });
      return node;
    }),

  create: boardProcedure('EDITOR')
    .input(CreateNodeSchema)
    .mutation(async ({ ctx, input }) => {
      const node = await prisma.node.create({
        data: {
          ...input,
          fields: input.fields as Prisma.InputJsonValue,
          createdById: ctx.userId,
        },
      });
      const board = await prisma.board.update({
        where: { id: input.boardId },
        data: { nodeCount: { increment: 1 } },
        select: { visibility: true },
      });
      await prisma.activityLog.create({
        data: { boardId: input.boardId, actorId: ctx.userId, action: 'node.created', payload: { nodeId: node.id } },
      });
      if (board.visibility === 'PUBLIC') revalidateTag('ranking');
      return node;
    }),

  update: boardProcedure('EDITOR')
    .input(
      z.object({
        boardId: z.string().cuid(),
        id: z.string().cuid(),
        patch: NodePatchSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // IDOR fix: verifica explícitamente que el nodo pertenece al boardId del contexto
      const before = await prisma.node.findFirst({
        where: { id: input.id, boardId: input.boardId },
      });
      if (!before) throw new TRPCError({ code: 'NOT_FOUND' });

      const data = input.patch as Prisma.NodeUpdateInput;
      const after = await prisma.node.update({ where: { id: input.id }, data });

      // Skip NodeVersion para movimientos puros (drag/auto-layout) — write amplification
      const changedKeys = Object.keys(input.patch);
      const onlyPositional = changedKeys.length > 0 && changedKeys.every((k) => POSITION_KEYS.has(k));
      if (!onlyPositional) {
        await prisma.nodeVersion.create({
          data: {
            nodeId: input.id,
            authorId: ctx.userId,
            diff: diffPatch(
              before as Record<string, unknown>,
              after as Record<string, unknown>,
            ) as unknown as Prisma.InputJsonValue,
          },
        });
      }
      return after;
    }),

  /**
   * Actualización masiva de posiciones (drag múltiple, auto-layout).
   * No genera NodeVersion ni ActivityLog (ruido). Solo persiste x/y por nodo.
   */
  updatePositions: boardProcedure('EDITOR')
    .input(
      z.object({
        boardId: z.string().cuid(),
        positions: z
          .array(z.object({ id: z.string().cuid(), x: z.number(), y: z.number() }))
          .max(500),
      }),
    )
    .mutation(async ({ input }) => {
      // Validamos que TODOS los nodos pertenecen al board (anti-IDOR cross-board)
      const ids = input.positions.map((p) => p.id);
      const valid = await prisma.node.findMany({
        where: { id: { in: ids }, boardId: input.boardId },
        select: { id: true },
      });
      if (valid.length !== ids.length) throw new TRPCError({ code: 'FORBIDDEN' });

      // Una transacción evita N round-trips visibles al cliente
      await prisma.$transaction(
        input.positions.map((p) =>
          prisma.node.update({ where: { id: p.id }, data: { x: p.x, y: p.y } }),
        ),
      );
      return { ok: true, count: input.positions.length };
    }),

  remove: boardProcedure('EDITOR')
    .input(z.object({ boardId: z.string().cuid(), id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // IDOR fix: solo archiva si el nodo pertenece al board
      const result = await prisma.node.updateMany({
        where: { id: input.id, boardId: input.boardId },
        data: { status: 'ARCHIVED' },
      });
      if (result.count === 0) throw new TRPCError({ code: 'NOT_FOUND' });

      await prisma.activityLog.create({
        data: { boardId: input.boardId, actorId: ctx.userId, action: 'node.archived', payload: { nodeId: input.id } },
      });
      return { ok: true };
    }),
});

function diffPatch(before: Record<string, unknown>, after: Record<string, unknown>) {
  const ops: Array<{ op: 'replace' | 'add' | 'remove'; path: string; value?: unknown }> = [];
  for (const k of Object.keys(after)) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      ops.push({ op: 'replace', path: `/${k}`, value: after[k] });
    }
  }
  return ops;
}
