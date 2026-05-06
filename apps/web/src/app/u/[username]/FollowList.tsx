import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { AppBackground } from '@/components/AppBackground';
import { getInitials } from '@/lib/initials';

type SimpleUser = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export function FollowList({
  title,
  backHref,
  backLabel,
  users,
  privacy,
  emptyTitle,
  emptyDescription,
  privacyTitle = 'Perfil privado',
  privacyDescription = 'Este usuario ha decidido ocultar su lista.',
}: {
  title: string;
  backHref: string;
  backLabel: string;
  users: SimpleUser[];
  privacy: boolean;
  emptyTitle: string;
  emptyDescription: string;
  privacyTitle?: string;
  privacyDescription?: string;
}) {
  return (
    <main className="relative min-h-screen">
      <AppBackground />
      <AppHeader />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>

        <div className="mt-6">
          {privacy ? (
            <Empty
              title={privacyTitle}
              description={privacyDescription}
              icon={<Lock size={24} strokeWidth={1.4} />}
            />
          ) : users.length === 0 ? (
            <Empty title={emptyTitle} description={emptyDescription} />
          ) : (
            <ul className="space-y-2">
              {users.map((u) => {
                const initials = getInitials(u.displayName);
                return (
                  <li key={u.id}>
                    <Link
                      href={`/u/${u.username}`}
                      className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-surface p-3 transition-colors hover:border-border-strong hover:bg-bg-elevated"
                    >
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-bg-elevated">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-accent text-sm font-semibold text-white">
                            {initials || '·'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {u.displayName}
                        </p>
                        <p className="truncate font-typewriter text-xs text-text-faded">
                          @{u.username}
                        </p>
                        {u.bio && (
                          <p className="mt-1 line-clamp-1 text-xs text-text-muted">{u.bio}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function Empty({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface/50 p-12 text-center">
      {icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border-strong bg-bg-elevated text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-muted">{description}</p>
    </div>
  );
}
