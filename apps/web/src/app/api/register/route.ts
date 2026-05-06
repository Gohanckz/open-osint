import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Prisma, prisma } from '@hilo/db';
import { enforceRateLimit, getClientIp } from '@/server/rate-limit';

const RegisterSchema = z.object({
  email: z.string().email().toLowerCase().max(200),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(80),
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9_-]+$/, 'Solo minúsculas, números, _ y -')
    .toLowerCase()
    .optional(),
});

export async function POST(req: Request) {
  // Rate limit por IP: máx 5 registros / 10 min
  const limited = enforceRateLimit(`reg:${getClientIp(req)}`, { window: 10 * 60_000, max: 5 });
  if (limited) return limited;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password, displayName, username } = parsed.data;

  // Mensaje genérico para no permitir enumeration: si email O username existen,
  // devolvemos el mismo error sin distinguir cuál.
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        username,
        emailVerifiedAt: new Date(), // dev: skip email verification
      },
      select: { id: true, email: true, displayName: true },
    });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Unique constraint violated: email o username ya en uso
      return NextResponse.json(
        { error: 'No se pudo crear la cuenta. ¿Ya tienes una con esos datos?' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
