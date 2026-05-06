import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@hilo/db';
import { enforceRateLimit, getClientIp } from '@/server/rate-limit';

const ResetSchema = z.object({
  token: z.string().min(32).max(128),
  newPassword: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  // Rate limit por IP
  const limited = enforceRateLimit(`reset:${getClientIp(req)}`, {
    window: 15 * 60_000,
    max: 10,
  });
  if (limited) return limited;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ResetSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  // Busca y valida el token
  const tokenRow = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
  });
  if (!tokenRow) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
  }
  if (tokenRow.expires < new Date()) {
    // Limpia tokens expirados de paso
    await prisma.verificationToken.delete({ where: { token: parsed.data.token } }).catch(() => {});
    return NextResponse.json({ error: 'Token expirado' }, { status: 400 });
  }

  // Actualiza contraseña + invalida el token + invalida otras sesiones del usuario
  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { email: tokenRow.identifier },
      data: { passwordHash: newHash },
    }),
    prisma.verificationToken.delete({ where: { token: parsed.data.token } }),
    // Invalida cualquier otro token de reset abierto para este email
    prisma.verificationToken.deleteMany({ where: { identifier: tokenRow.identifier } }),
  ]);

  return NextResponse.json({ ok: true });
}
