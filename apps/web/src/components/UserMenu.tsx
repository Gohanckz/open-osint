'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Settings, LogOut, User as UserIcon, ChevronDown, Languages, Check } from 'lucide-react';
import { getInitials } from '@/lib/initials';
import { useI18n } from '@/i18n/client';
import { LOCALES, LOCALE_LABELS } from '@/i18n/locales';

export interface UserMenuProps {
  user: {
    displayName: string;
    email?: string | null;
    avatarUrl?: string | null;
    username?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const { locale, t, setLocale } = useI18n();
  const [signingOut, setSigningOut] = useState(false);

  const initials = getInitials(user.displayName);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      // Obtenemos CSRF y enviamos POST a NextAuth signOut
      const csrf = await fetch('/api/auth/csrf').then((r) => r.json());
      const body = new URLSearchParams({
        csrfToken: csrf.csrfToken as string,
        callbackUrl: '/login',
        json: 'true',
      });
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      router.push('/login');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface/60 py-1 pl-1 pr-3 transition-colors hover:border-border-strong hover:bg-bg-elevated"
        >
          <span className="user-menu__avatar">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                {initials || '·'}
              </span>
            )}
          </span>
          <span className="hidden text-xs font-medium text-text-primary sm:inline">
            {user.displayName.split(' ')[0]}
          </span>
          <ChevronDown
            size={13}
            className="text-text-muted transition-transform group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-60 overflow-hidden rounded-lg border border-border-strong bg-bg-elevated shadow-3"
          style={{ animation: 'fadeIn 120ms ease-out' }}
        >
          {/* Header con info */}
          <div className="border-b border-border-subtle p-3">
            <p className="truncate text-sm font-semibold text-text-primary">{user.displayName}</p>
            {user.email && (
              <p className="mt-0.5 truncate text-xs text-text-muted">{user.email}</p>
            )}
            {user.username && (
              <p className="mt-1 inline-block rounded bg-bg-surface px-1.5 py-0.5 font-typewriter text-[10px] text-text-faded">
                @{user.username}
              </p>
            )}
          </div>

          <div className="p-1">
            <DropdownMenu.Item asChild>
              <Link
                href="/settings"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-text-primary outline-none transition-colors hover:bg-bg-surface focus:bg-bg-surface"
              >
                <Settings size={14} className="text-text-muted" />
                {t.userMenu.settings}
              </Link>
            </DropdownMenu.Item>
            {user.username && (
              <DropdownMenu.Item asChild>
                <Link
                  href={`/u/${user.username}`}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-text-primary outline-none transition-colors hover:bg-bg-surface focus:bg-bg-surface"
                >
                  <UserIcon size={14} className="text-text-muted" />
                  {t.userMenu.publicProfile}
                </Link>
              </DropdownMenu.Item>
            )}
          </div>

          <DropdownMenu.Separator className="h-px bg-border-subtle" />

          {/* Selector de idioma */}
          <div className="p-1">
            <p className="flex items-center gap-2 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-text-faded">
              <Languages size={11} /> {t.settings.tabLanguage}
            </p>
            {LOCALES.map((l) => {
              const meta = LOCALE_LABELS[l];
              const active = l === locale;
              return (
                <DropdownMenu.Item
                  key={l}
                  onSelect={(e: Event) => {
                    e.preventDefault();
                    if (!active) setLocale(l);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-bg-surface focus:bg-bg-surface ${
                    active ? 'text-text-primary' : 'text-text-muted'
                  }`}
                >
                  <span aria-hidden>{meta.flag}</span>
                  <span className="flex-1">{meta.native}</span>
                  {active && <Check size={12} className="text-accent" />}
                </DropdownMenu.Item>
              );
            })}
          </div>

          <DropdownMenu.Separator className="h-px bg-border-subtle" />

          <div className="p-1">
            <DropdownMenu.Item asChild>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-danger outline-none transition-colors hover:bg-danger/10 focus:bg-danger/10 disabled:opacity-50"
              >
                <LogOut size={14} />
                {signingOut ? t.userMenu.signingOut : t.userMenu.signOut}
              </button>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
