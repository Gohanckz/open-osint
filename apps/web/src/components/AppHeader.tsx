import Link from 'next/link';
import { auth } from '@/server/auth';
import { prisma } from '@hilo/db';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';
import { AppNavLinks } from './AppNavLinks';
import { getMessages } from '@/i18n/server';

/**
 * Cabecera global. Server component — fetcha el usuario actual.
 * Acepta `variant` para casos como dentro del board (compacto sin nav central).
 */
export async function AppHeader({
  variant = 'default',
}: {
  variant?: 'default' | 'compact';
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const [currentUser, { t }] = await Promise.all([
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { displayName: true, email: true, avatarUrl: true, username: true },
        })
      : Promise.resolve(null),
    getMessages(),
  ]);

  return (
    <header className="sticky top-0 z-20 border-b border-border-subtle bg-bg-canvas/85 backdrop-blur-md">
      <div
        className={`mx-auto flex items-center justify-between gap-6 px-6 py-3 ${
          variant === 'compact' ? 'max-w-full' : 'max-w-7xl'
        }`}
      >
        {/* Marca — link adaptativo según sesión */}
        <Link href={currentUser ? '/dashboard' : '/'} className="flex items-center gap-2 group">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md text-base font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #c1272d 100%)',
              boxShadow: '0 0 12px rgba(239,68,68,0.4)',
            }}
          >
            O
          </span>
          <span className="font-typewriter text-xs uppercase tracking-[0.3em] text-text-primary group-hover:text-accent transition-colors">
            {t.brand}
          </span>
        </Link>

        {/* Navegación central — solo en variant default */}
        {variant === 'default' && (
          <nav className="hidden flex-1 items-center justify-center md:flex">
            <AppNavLinks />
          </nav>
        )}

        {/* Acciones derecha */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <NotificationBell />
              <UserMenu user={currentUser} />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              {t.nav.enter}
            </Link>
          )}
        </div>
      </div>

      {/* Nav móvil — debajo en mobile */}
      {variant === 'default' && (
        <nav className="border-t border-border-subtle md:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-around px-3 py-1.5">
            <AppNavLinks compact />
          </div>
        </nav>
      )}
    </header>
  );
}
