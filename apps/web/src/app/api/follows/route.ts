import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { prisma } from '@hilo/db';
import { enforceRateLimit } from '@/server/rate-limit';

const FollowBody = z.object({ username: z.string().toLowerCase().min(1).max(40) });

/** POST → seguir a un usuario por username */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  // Rate limit: 30 follow ops / minuto (anti mass-follow)
  const limited = enforceRateLimit(`follow:${userId}`, { window: 60_000, max: 30 });
  if (limited) return limited;

  const parsed = FollowBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true, displayName: true, privacyMode: true },
  });
  if (!target) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (target.id === userId) return NextResponse.json({ error: 'self follow' }, { status: 400 });

  // Crea relación (idempotente — si ya existía, no error)
  const existed = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: target.id } },
  });
  if (!existed) {
    await prisma.follow.create({
      data: { followerId: userId, followingId: target.id },
    });
    // Notificación solo cuando es un follow nuevo (evita spam si toggle rápido)
    await prisma.notification.create({
      data: { recipientId: target.id, actorId: userId, type: 'FOLLOW', payload: {} },
    });
    // El followerCount del target cambia → ranking afectado
    revalidateTag('ranking');
  }

  return NextResponse.json({ ok: true, following: true });
}

/** DELETE → dejar de seguir */
export async function DELETE(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const limited = enforceRateLimit(`unfollow:${userId}`, { window: 60_000, max: 30 });
  if (limited) return limited;

  const parsed = FollowBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const result = await prisma.follow.deleteMany({
    where: { followerId: userId, followingId: target.id },
  });
  // Solo invalidar si realmente se borró un follow (idempotente: si no existía, no afecta)
  if (result.count > 0) revalidateTag('ranking');
  return NextResponse.json({ ok: true, following: false });
}
