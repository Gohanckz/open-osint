import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, authedProcedure, boardProcedure } from '../trpc.js';
import { prisma } from '@hilo/db';
import { CreateBoardSchema } from '@hilo/shared';

export const boardRouter = router({
  list: authedProcedure.query(async ({ ctx }) => {
    return prisma.board.findMany({
      where: { members: { some: { userId: ctx.userId } } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        visibility: true,
        nodeCount: true,
        connectionCount: true,
        updatedAt: true,
        coverColor: true,
      },
    });
  }),

  byId: boardProcedure('VIEWER').query(async ({ input }) => {
    return prisma.board.findUniqueOrThrow({
      where: { id: input.boardId },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
      },
    });
  }),

  create: authedProcedure.input(CreateBoardSchema).mutation(async ({ ctx, input }) => {
    return prisma.board.create({
      data: {
        ...input,
        ownerId: ctx.userId,
        members: { create: { userId: ctx.userId, role: 'OWNER' } },
      },
    });
  }),

  update: boardProcedure('OWNER')
    .input(
      z.object({
        boardId: z.string().cuid(),
        patch: z.object({
          title: z.string().min(1).max(200).optional(),
          description: z.string().max(2_000).nullish(),
          visibility: z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']).optional(),
          contributionMode: z
            .enum(['CLOSED', 'INVITE', 'OPEN_PENDING', 'OPEN_INSTANT'])
            .optional(),
          coverColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullish(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const before = await prisma.board.findUniqueOrThrow({
        where: { id: input.boardId },
        select: { visibility: true },
      });
      const updated = await prisma.board.update({
        where: { id: input.boardId },
        data: {
          ...input.patch,
          // Si cambia a PUBLIC y no estaba publicado, marca publishedAt
          publishedAt:
            input.patch.visibility === 'PUBLIC' && before.visibility !== 'PUBLIC'
              ? new Date()
              : undefined,
        },
      });
      await prisma.activityLog.create({
        data: {
          boardId: input.boardId,
          actorId: ctx.userId,
          action: 'board.updated',
          payload: { changedKeys: Object.keys(input.patch) },
        },
      });
      return updated;
    }),

  remove: boardProcedure('OWNER')
    .input(z.object({ boardId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Borrado en cascada vía Prisma (Board → nodes/connections/etc onDelete: Cascade)
      await prisma.board.delete({ where: { id: input.boardId } });
      await prisma.activityLog
        .create({
          data: {
            boardId: input.boardId,
            actorId: ctx.userId,
            action: 'board.deleted',
            payload: {},
          },
        })
        .catch(() => {
          // Si el log falla porque el board ya no existe (cascade), no critical
        });
      return { ok: true };
    }),

  // === MEMBERSHIP ===

  /** Usuario solicita unirse a un tablero. Solo si no es miembro y el board no es PRIVATE. */
  requestJoin: authedProcedure
    .input(
      z.object({
        boardId: z.string().cuid(),
        message: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const board = await prisma.board.findUniqueOrThrow({
        where: { id: input.boardId },
        select: { id: true, ownerId: true, visibility: true, title: true },
      });
      if (board.visibility === 'PRIVATE') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Este tablero es privado.' });
      }
      const existingMember = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: board.id, userId: ctx.userId } },
      });
      if (existingMember) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ya eres miembro.' });
      }

      const req = await prisma.boardJoinRequest.upsert({
        where: { boardId_userId: { boardId: board.id, userId: ctx.userId } },
        update: {
          direction: 'USER_REQUEST',
          status: 'PENDING',
          initiatedBy: ctx.userId,
          message: input.message,
          respondedAt: null,
        },
        create: {
          boardId: board.id,
          userId: ctx.userId,
          direction: 'USER_REQUEST',
          status: 'PENDING',
          initiatedBy: ctx.userId,
          message: input.message,
          role: 'EDITOR',
        },
      });

      // Notificar al owner
      await prisma.notification.create({
        data: {
          recipientId: board.ownerId,
          actorId: ctx.userId,
          type: 'BOARD_JOIN_REQUEST',
          payload: { boardId: board.id, boardTitle: board.title, requestId: req.id },
        },
      });

      return req;
    }),

  /** Owner invita a un usuario por username. */
  invite: boardProcedure('OWNER')
    .input(
      z.object({
        boardId: z.string().cuid(),
        username: z.string().min(1).max(40),
        role: z.enum(['VIEWER', 'COMMENTER', 'EDITOR', 'VERIFIED_CONTRIBUTOR']).default('EDITOR'),
        message: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const target = await prisma.user.findUnique({
        where: { username: input.username },
        select: { id: true, displayName: true },
      });
      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuario no encontrado.' });
      if (target.id === ctx.userId)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No puedes invitarte a ti mismo.' });

      const board = await prisma.board.findUniqueOrThrow({
        where: { id: input.boardId },
        select: { id: true, title: true },
      });

      const existing = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: input.boardId, userId: target.id } },
      });
      if (existing) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ya es miembro.' });

      const req = await prisma.boardJoinRequest.upsert({
        where: { boardId_userId: { boardId: input.boardId, userId: target.id } },
        update: {
          direction: 'OWNER_INVITE',
          status: 'PENDING',
          initiatedBy: ctx.userId,
          message: input.message,
          role: input.role,
          respondedAt: null,
        },
        create: {
          boardId: input.boardId,
          userId: target.id,
          direction: 'OWNER_INVITE',
          status: 'PENDING',
          initiatedBy: ctx.userId,
          message: input.message,
          role: input.role,
        },
      });

      // Notificar al usuario invitado
      await prisma.notification.create({
        data: {
          recipientId: target.id,
          actorId: ctx.userId,
          type: 'BOARD_INVITE',
          payload: { boardId: board.id, boardTitle: board.title, requestId: req.id },
        },
      });

      return req;
    }),

  /** Acepta/rechaza una solicitud o invitación. */
  respondJoinRequest: authedProcedure
    .input(
      z.object({
        requestId: z.string().cuid(),
        accept: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const req = await prisma.boardJoinRequest.findUniqueOrThrow({
        where: { id: input.requestId },
        include: { board: { select: { ownerId: true, title: true } } },
      });
      if (req.status !== 'PENDING')
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ya respondida.' });

      // Verifica que el usuario actual sea quien debe responder:
      // - USER_REQUEST → responde el OWNER del board
      // - OWNER_INVITE → responde el USER al que se invitó
      const canRespond =
        req.direction === 'USER_REQUEST'
          ? ctx.userId === req.board.ownerId
          : ctx.userId === req.userId;
      if (!canRespond) throw new TRPCError({ code: 'FORBIDDEN' });

      const updated = await prisma.boardJoinRequest.update({
        where: { id: req.id },
        data: {
          status: input.accept ? 'ACCEPTED' : 'REJECTED',
          respondedAt: new Date(),
        },
      });

      if (input.accept) {
        await prisma.boardMember.upsert({
          where: { boardId_userId: { boardId: req.boardId, userId: req.userId } },
          update: { role: req.role },
          create: { boardId: req.boardId, userId: req.userId, role: req.role },
        });
      }

      // Notifica al iniciador
      const recipientId =
        req.direction === 'USER_REQUEST' ? req.userId : req.initiatedBy;
      if (recipientId !== ctx.userId) {
        await prisma.notification.create({
          data: {
            recipientId,
            actorId: ctx.userId,
            type: input.accept ? 'BOARD_REQUEST_ACCEPTED' : 'BOARD_REQUEST_REJECTED',
            payload: {
              boardId: req.boardId,
              boardTitle: req.board.title,
            },
          },
        });
      }

      return updated;
    }),

  /** Cancela una solicitud propia (PENDING). */
  cancelJoinRequest: authedProcedure
    .input(z.object({ requestId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const req = await prisma.boardJoinRequest.findUniqueOrThrow({
        where: { id: input.requestId },
      });
      if (req.initiatedBy !== ctx.userId)
        throw new TRPCError({ code: 'FORBIDDEN' });
      if (req.status !== 'PENDING')
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ya respondida.' });
      return prisma.boardJoinRequest.update({
        where: { id: req.id },
        data: { status: 'CANCELLED', respondedAt: new Date() },
      });
    }),

  /** Lista miembros + requests pendientes (solo owner). */
  listMembership: boardProcedure('OWNER').query(async ({ input }) => {
    const [members, pending] = await Promise.all([
      prisma.boardMember.findMany({
        where: { boardId: input.boardId },
        orderBy: { addedAt: 'asc' },
        include: {
          user: {
            select: { id: true, displayName: true, username: true, avatarUrl: true },
          },
        },
      }),
      prisma.boardJoinRequest.findMany({
        where: { boardId: input.boardId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, displayName: true, username: true, avatarUrl: true },
          },
        },
      }),
    ]);
    return { members, pending };
  }),

  /** Estado del usuario actual respecto a este board (para mostrar el botón correcto). */
  myMembership: authedProcedure
    .input(z.object({ boardId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const [member, request] = await Promise.all([
        prisma.boardMember.findUnique({
          where: { boardId_userId: { boardId: input.boardId, userId: ctx.userId } },
        }),
        prisma.boardJoinRequest.findUnique({
          where: { boardId_userId: { boardId: input.boardId, userId: ctx.userId } },
        }),
      ]);
      return { member, request };
    }),

  /** Quita a un miembro del tablero (solo owner, no puede quitarse a sí mismo). */
  removeMember: boardProcedure('OWNER')
    .input(z.object({ boardId: z.string().cuid(), userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'El owner no puede eliminarse.' });
      await prisma.boardMember.delete({
        where: { boardId_userId: { boardId: input.boardId, userId: input.userId } },
      });
      return { ok: true };
    }),

  fork: authedProcedure
    .input(z.object({ boardId: z.string().cuid(), title: z.string().min(1).max(200).optional() }))
    .mutation(async ({ ctx, input }) => {
      const source = await prisma.board.findUniqueOrThrow({
        where: { id: input.boardId },
        include: { nodes: true, connections: true },
      });
      if (source.visibility === 'PRIVATE') throw new TRPCError({ code: 'FORBIDDEN' });

      // Pre-genera ids para nodos clonados → permite createMany + reconstruir conexiones sin loop
      const idMap = new Map<string, string>();
      for (const n of source.nodes) idMap.set(n.id, makeCuid());

      // Toda la operación en una sola transacción (atómica + más rápida)
      const fork = await prisma.$transaction(async (tx) => {
        const created = await tx.board.create({
          data: {
            title: input.title ?? `${source.title} (fork)`,
            description: source.description,
            ownerId: ctx.userId,
            parentBoardId: source.id,
            forkedAt: new Date(),
            visibility: 'PRIVATE',
            contributionMode: 'CLOSED',
            nodeCount: source.nodes.length,
            connectionCount: source.connections.length,
            members: { create: { userId: ctx.userId, role: 'OWNER' } },
          },
        });

        if (source.nodes.length > 0) {
          await tx.node.createMany({
            data: source.nodes.map((n) => ({
              id: idMap.get(n.id)!,
              boardId: created.id,
              type: n.type,
              title: n.title,
              subtitle: n.subtitle,
              fields: n.fields ?? {},
              contentMd: n.contentMd,
              tags: n.tags,
              color: n.color,
              x: n.x,
              y: n.y,
              width: n.width,
              height: n.height,
              createdById: ctx.userId,
            })),
          });
        }

        const validConnections = source.connections.flatMap((c) => {
          const from = idMap.get(c.fromNodeId);
          const to = idMap.get(c.toNodeId);
          if (!from || !to) return [];
          return [
            {
              boardId: created.id,
              fromNodeId: from,
              toNodeId: to,
              type: c.type,
              label: c.label,
              directional: c.directional,
              strength: c.strength,
              verified: false,
              createdById: ctx.userId,
            },
          ];
        });
        if (validConnections.length > 0) {
          await tx.connection.createMany({ data: validConnections });
        }
        return created;
      });

      return fork;
    }),
});

/** Genera un id estilo cuid en cliente para pre-mapear IDs en bulk inserts. */
function makeCuid(): string {
  // cuid simplificado: timestamp36 + random36 (10 chars)
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}
