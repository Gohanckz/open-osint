/**
 * Augmenta los tipos de NextAuth para que `session.user.id` sea conocido
 * por TypeScript en toda la app (eliminando los `as { id?: string }` repartidos).
 */
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id?: string;
    };
  }
}
