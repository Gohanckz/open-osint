import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { prisma } from '@hilo/db';
import { AppHeader } from '@/components/AppHeader';
import { AppBackground } from '@/components/AppBackground';
import { SettingsTabs } from './SettingsTabs';

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

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
  if (!user) redirect('/login');

  return (
    <main className="relative min-h-screen">
      <AppBackground />
      <AppHeader />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="font-typewriter text-xs uppercase tracking-[0.3em] text-text-faded">
            Configuración personal
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text-primary">Ajustes</h1>
          <p className="mt-1 text-sm text-text-muted">
            Tu perfil, cuenta y preferencias de privacidad.
          </p>
        </div>

        <SettingsTabs initialUser={user} />
      </div>
    </main>
  );
}
