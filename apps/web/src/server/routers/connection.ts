import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, boardProcedure } from '../trpc.js';
import { prisma } from '@hilo/db';
import { CreateConnectionSchema } from '@hilo/shared';

export const connectionRouter = router({
  list: boardProcedure('VIEWER').query(async ({ input }) => {
    return prisma.connection.findMany({ where: { boardId: input.boardId } });
  }),

  create: boardProcedure('EDITOR')
    .input(CreateConnectionSchema)
    .mutation(async ({ ctx, input }) => {
      // Validamos que ambos nodos pertenecen al board (no se puede conectar cross-board)
      const nodes = await prisma.node.findMany({
        where: { id: { in: [input.fromNodeId, input.toNodeId] }, boardId: input.boardId },
        select: { id: true },
      });
      if (nodes.length !== 2) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nodos inválidos.' });

      const conn = await prisma.connection.create({ data: { ...input, createdById: ctx.userId } });
      await prisma.board.update({
        where: { id: input.boardId },
        data: { connectionCount: { increment: 1 } },
      });
      return conn;
    }),

  remove: boardProcedure('EDITOR')
    .input(z.object({ boardId: z.string().cuid(), id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      // IDOR fix: solo borra si la conexión pertenece a este board
      const result = await prisma.connection.deleteMany({
        where: { id: input.id, boardId: input.boardId },
      });
      if (result.count === 0) throw new TRPCError({ code: 'NOT_FOUND' });
      // Mantén el counter en sync con el delete real
      await prisma.board.update({
        where: { id: input.boardId },
        data: { connectionCount: { decrement: 1 } },
      });
      return { ok: true };
    }),
});
