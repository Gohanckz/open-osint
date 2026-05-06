import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { AppHeader } from '@/components/AppHeader';
import { AppBackground } from '@/components/AppBackground';
import { NewBoardForm } from './NewBoardForm';

export default async function NewBoardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  return (
    <main className="relative min-h-screen">
      <AppBackground />
      <AppHeader />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <NewBoardForm />
      </div>
    </main>
  );
}
