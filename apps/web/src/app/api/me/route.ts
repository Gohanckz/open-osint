import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth';
import { Prisma, prisma } from '@hilo/db';
import { enforceRateLimit, getClientIp } from '@/server/rate-limit';

/** Acepta solo data URLs de imagen o https URLs. Cap a 200 KB (data URL pesa ~1.4× el binario). */
const AVATAR_MAX_BYTES = 200_000;
const ImageUrlSchema = z
  .string()
  .max(AVATAR_MAX_BYTES)
  .refine(
    (v) => /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v) || /^https:\/\/.+/.test(v),
    { message: 'Imagen inválida (solo data:image/* o https://)' },
  );

const ProfilePatchSchema = z
  .object({
    displayName: z.string().min(1).max(80).optional(),
    username: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[a-z0-9_-]+$/, 'Solo minúsculas, números, _ y -')
      .toLowerCase()
      .nullish(),
    bio: z.string().max(500).nullish(),
    avatarUrl: ImageUrlSchema.nullish(),
    privacyMode: z.boolean().optional(),
    locale: z.string().max(10).optional(),
  })
  .strict();

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      isVerified: true,
      privacyMode: true,
      locale: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  // Rate limit por IP+user (paranoia anti-abuso): 30 patches / 5 min
  const limited = enforceRateLimit(`me:${getClientIp(req)}`, { window: 5 * 60_000, max: 30 });
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

  const parsed = ProfilePatchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validación fallida', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Si cambia username, verifica que no esté tomado por otro
  if (parsed.data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: parsed.data.username, NOT: { id: userId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ese username ya está en uso' }, { status: 409 });
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        privacyMode: true,
        locale: true,
      },
    });
    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'Conflicto de datos únicos' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
