import 'server-only';
import { auth } from './auth.js';
import { prisma } from '@hilo/db';

/**
 * Devuelve el userId del usuario logueado o `null` si no hay sesión.
 * Usar en server components / route handlers.
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Devuelve el usuario actual con los campos típicos de UI (avatar, menú).
 * `null` si no hay sesión.
 */
export async function getCurrentUser() {
  const userId = await getUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      privacyMode: true,
    },
  });
}
