import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, boardProcedure } from '../trpc.js';
import { prisma } from '@hilo/db';
import type { Prisma } from '@hilo/db';
import { CreateContributionSchema, ipHash, scanPii, piiSeverity } from '@hilo/shared';
import { rateLimit } from '../redis.js';
import { RATE_LIMITS, ANTI_DOXXING } from '@hilo/config';

/**
 * Valida un token de Cloudflare Turnstile. Si TURNSTILE_SECRET no está configurado
 * (dev), se permite pasar para no romper local — pero en prod TURNSTILE_SECRET DEBE
 * estar definido.
 */
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    // Modo dev: si no hay secret no validamos (loggear sería ruidoso). Producción
    // debe forzar la presencia del secret vía deployment check.
    return process.env.NODE_ENV !== 'production';
  }
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }).toString(),
    });
    if (!r.ok) return false;
    const data = (await r.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/** Calcula el inicio de la ventana actual redondeado a `windowMs`. */
function bucketStart(windowMs: number): Date {
  const now = Date.now();
  return new Date(Math.floor(now / windowMs) * windowMs);
}

export const contributionRouter = router({
  // Public: cualquiera (incluso anónimo) puede aportar a board público con OPEN_PENDING.
  submit: publicProcedure
    .input(CreateContributionSchema)
    .mutation(async ({ ctx, input }) => {
      // CRITICAL: validar Turnstile antes de cualquier otra lógica
      const captchaOk = await verifyTurnstile(input.turnstileToken, ctx.ip);
      if (!captchaOk) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Verificación anti-bot fallida.' });
      }

      const board = await prisma.board.findUniqueOrThrow({ where: { id: input.boardId } });
      if (board.visibility !== 'PUBLIC') throw new TRPCError({ code: 'FORBIDDEN' });
      if (board.contributionMode === 'CLOSED') throw new TRPCError({ code: 'FORBIDDEN' });

      const fp = ipHash(ctx.ip, ctx.userAgent ?? undefined);
      const limits = ctx.userId ? RATE_LIMITS.authedContribution : RATE_LIMITS.anonContribution;
      const ok = await rateLimit(`contrib:${fp}`, limits.windowSec, limits.max);
      if (!ok) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });

      // PII heurística sobre payload textual (anti-doxxing pre-check).
      const payloadText = JSON.stringify(input.payload);
      const hits = scanPii(payloadText);
      const severity = piiSeverity(hits);

      // Anti-doxxing: si se aporta PII contra el mismo target en ventana corta → flag.
      // BUG fix: la ventana se redondea a un bucket fijo para que el upsert haga match
      // correctamente entre requests dentro del mismo bucket (antes Date.now() cambiaba
      // siempre y el contador nunca crecía).
      let flagged = false;
      if (hits.length) {
        const targetKey = extractTargetKey(input.payload);
        if (targetKey) {
          const windowMs = ANTI_DOXXING.windowHours * 3600_000;
          const windowStart = bucketStart(windowMs);
          const tracker = await prisma.doxxingTrack.upsert({
            where: {
              boardId_targetKey_contributorKey_windowStart: {
                boardId: input.boardId,
                targetKey,
                contributorKey: fp,
                windowStart,
              },
            },
            update: { count: { increment: 1 } },
            create: {
              boardId: input.boardId,
              targetKey,
              contributorKey: fp,
              piiType: hits[0]!.kind,
              windowStart,
              count: 1,
            },
          });
          if (tracker.count >= ANTI_DOXXING.maxPersonalDataPerTarget) {
            flagged = true;
            await prisma.doxxingTrack.update({
              where: { id: tracker.id },
              data: { escalated: true },
            });
          }
        }
      }

      const status = severity === 'high' || flagged ? 'FLAGGED' : 'PENDING';

      return prisma.contribution.create({
        data: {
          boardId: input.boardId,
          authorId: ctx.userId ?? undefined,
          anonHandle: input.anonHandle,
          ipHash: fp,
          payload: input.payload as Prisma.InputJsonValue,
          message: input.message,
          status,
        },
      });
    }),

  listPending: boardProcedure('EDITOR').query(async ({ input }) => {
    return prisma.contribution.findMany({
      where: { boardId: input.boardId, status: { in: ['PENDING', 'FLAGGED'] } },
      orderBy: { createdAt: 'asc' },
    });
  }),

  decide: boardProcedure('EDITOR')
    .input(
      z.object({
        boardId: z.string().cuid(),
        contributionId: z.string().cuid(),
        approve: z.boolean(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const decision = input.approve ? 'APPROVED' : 'REJECTED';
      const contribution = await prisma.contribution.update({
        where: { id: input.contributionId },
        data: { status: decision, reviewedById: ctx.userId, reviewedAt: new Date() },
      });
      await prisma.activityLog.create({
        data: {
          boardId: input.boardId,
          actorId: ctx.userId,
          action: `contribution.${decision.toLowerCase()}`,
          payload: { contributionId: contribution.id, reason: input.reason },
        },
      });
      // Aprobado: la aplicación del payload al Y.Doc se hace via realtime worker (ver apps/realtime/apply.ts)
      return contribution;
    }),
});

function extractTargetKey(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const ops = (payload as { ops?: Array<{ path?: string }> }).ops;
  if (!ops?.length) return null;
  const first = ops.find((o) => typeof o.path === 'string')?.path;
  if (!first) return null;
  const m = first.match(/\/nodes\/([^/]+)/);
  return m?.[1] ?? null;
}
