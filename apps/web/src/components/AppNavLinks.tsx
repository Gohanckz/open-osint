'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, LayoutGrid, Plus, Trophy } from 'lucide-react';
import { useT } from '@/i18n/client';

const LINK_KEYS = [
  { href: '/dashboard', tKey: 'boards' as const, Icon: LayoutGrid, match: /^\/dashboard|^\/b\// },
  { href: '/explore', tKey: 'explore' as const, Icon: Compass, match: /^\/explore/ },
  { href: '/ranking', tKey: 'ranking' as const, Icon: Trophy, match: /^\/ranking/ },
];

export function AppNavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname() || '';
  const t = useT();

  return (
    <div className={compact ? 'flex w-full items-center justify-around gap-1' : 'flex items-center gap-1'}>
      {LINK_KEYS.map(({ href, tKey, Icon, match }) => {
        const active = match.test(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'text-text-primary'
                : 'text-text-muted hover:bg-bg-surface/60 hover:text-text-primary'
            }`}
          >
            <Icon size={14} />
            <span className={compact ? 'hidden sm:inline' : ''}>{t.nav[tKey]}</span>
            {active && (
              <span className="absolute -bottom-3 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-accent" />
            )}
          </Link>
        );
      })}
      {!compact && (
        <Link
          href="/boards/new"
          className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-surface/60 px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-accent/50 hover:text-accent"
        >
          <Plus size={14} />
          {t.nav.new}
        </Link>
      )}
    </div>
  );
}
