import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@hilo/db';

/**
 * Hash precalculado de un string irrelevante. Se usa cuando el usuario NO existe
 * para que `bcrypt.compare` se ejecute igualmente y el tiempo de respuesta sea
 * indistinguible de un usuario real con password incorrecto (anti timing oracle
 * para enumeration de cuentas).
 */
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.r9V0Q9D7LTKxSm4Qy.B5nYJsP1RG';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Email',
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) {
          // Aún así corremos un compare para no leakear el path "no email"
          await bcrypt.compare('dummy', DUMMY_HASH);
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
          // No existe / sin password configurada: comparar contra dummy para
          // alinear timing con el flujo "user existe, password incorrecto".
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        // IMPORTANTE: NO devolver `image` aquí. El avatar puede ser un data URL
        // pesado (hasta 200KB) y NextAuth lo persiste en el JWT → cookie enorme
        // → HTTP 431 en cualquier request posterior. El avatar se obtiene de la
        // DB cuando se necesita (UserMenu, AppHeader vía getCurrentUser).
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
        };
      },
    }),
  ],
  callbacks: {
    /** Mantenemos el JWT mínimo: solo sub (userId). Nada más entra al token. */
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as { id?: string }).id ?? token.sub;
        // No persistimos image/avatar en el JWT — ver comentario arriba
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
});
