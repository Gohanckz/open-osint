import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { prisma } from '@hilo/db';
import { enforceRateLimit } from '@/server/rate-limit';

/** GET → últimas 30 notificaciones del usuario actual + unreadCount. */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        actor: {
          select: { id: true, displayName: true, username: true, avatarUrl: true },
        },
      },
    }),
    prisma.notification.count({ where: { recipientId: userId, readAt: null } }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

const ReadBody = z.object({
  ids: z.array(z.string().cuid()).optional(),
  all: z.boolean().optional(),
});

/** POST → marcar como leídas (todas o por ids). */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const limited = enforceRateLimit(`notif:${userId}`, { window: 60_000, max: 60 });
  if (limited) return limited;

  const parsed = ReadBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const where: { recipientId: string; readAt: null; id?: { in: string[] } } = {
    recipientId: userId,
    readAt: null,
  };
  if (!parsed.data.all) {
    if (!parsed.data.ids?.length) return NextResponse.json({ ok: true, updated: 0 });
    where.id = { in: parsed.data.ids };
  }

  const r = await prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true, updated: r.count });
}
