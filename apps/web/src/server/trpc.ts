import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { z, ZodError } from 'zod';
import { auth } from './auth.js';
import { prisma } from '@hilo/db';
import type { Role } from '@hilo/db';

export interface Context {
  userId: string | null;
  ip: string;
  userAgent: string | null;
}

export async function createContext(opts: { req: Request }): Promise<Context> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const ip =
    opts.req.headers.get('cf-connecting-ip') ??
    opts.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0';
  return { userId, ip, userAgent: opts.req.headers.get('user-agent') };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const boardProcedure = (minRole: Role = 'VIEWER') =>
  authedProcedure
    .input(z.object({ boardId: z.string().cuid() }))
    .use(async ({ ctx, input, next }) => {
      const member = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: input.boardId, userId: ctx.userId } },
      });
      if (!member) throw new TRPCError({ code: 'FORBIDDEN' });
      if (!hasRole(member.role, minRole)) throw new TRPCError({ code: 'FORBIDDEN' });
      return next({ ctx: { ...ctx, role: member.role } });
    });

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  COMMENTER: 2,
  VERIFIED_CONTRIBUTOR: 3,
  EDITOR: 4,
  OWNER: 5,
};

function hasRole(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
