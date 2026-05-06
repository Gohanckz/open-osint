import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/server/auth';
import { prisma } from '@hilo/db';
import { enforceRateLimit, getClientIp } from '@/server/rate-limit';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.r9V0Q9D7LTKxSm4Qy.B5nYJsP1RG';

export async function POST(req: Request) {
  // Rate limit por IP: máx 5 intentos / 5 minutos
  const limited = enforceRateLimit(`pwd:${getClientIp(req)}`, { window: 5 * 60_000, max: 5 });
  if (limited) return limited;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ChangePasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // SIEMPRE exigimos contraseña actual. Si el user no tiene hash (cuenta seed o
  // ruta OAuth-only), bcrypt.compare contra DUMMY siempre devuelve false → el
  // usuario debe usar el flujo de "establecer/restablecer contraseña" (no esta
  // ruta) para evitar tomas de cuenta vía sesión secuestrada.
  const hash = user.passwordHash ?? DUMMY_HASH;
  const ok = await bcrypt.compare(parsed.data.currentPassword, hash);
  if (!ok || !user.passwordHash) {
    return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 });
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
  return NextResponse.json({ ok: true });
}
