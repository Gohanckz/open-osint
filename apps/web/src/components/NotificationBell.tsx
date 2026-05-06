'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, UserPlus, MessageCircle, Inbox, AtSign, Boxes } from 'lucide-react';
import { useT } from '@/i18n/client';
import type { Messages } from '@/i18n/messages/es';

type Notif = {
  id: string;
  type:
    | 'FOLLOW'
    | 'BOARD_INVITE'
    | 'BOARD_JOIN_REQUEST'
    | 'BOARD_REQUEST_ACCEPTED'
    | 'BOARD_REQUEST_REJECTED'
    | 'BOARD_CONTRIBUTION'
    | 'COMMENT_REPLY'
    | 'MENTION'
    | 'SYSTEM';
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  actor: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  } | null;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = 60_000;
  if (diff < m) return 'ahora';
  if (diff < 60 * m) return `${Math.floor(diff / m)}m`;
  if (diff < 24 * 60 * m) return `${Math.floor(diff / (60 * m))}h`;
  if (diff < 30 * 24 * 60 * m) return `${Math.floor(diff / (24 * 60 * m))}d`;
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function notifIcon(type: Notif['type']) {
  switch (type) {
    case 'FOLLOW':
      return <UserPlus size={14} className="text-info" />;
    case 'BOARD_INVITE':
      return <Boxes size={14} className="text-accent" />;
    case 'BOARD_CONTRIBUTION':
      return <Boxes size={14} className="text-success" />;
    case 'COMMENT_REPLY':
      return <MessageCircle size={14} className="text-warning" />;
    case 'MENTION':
      return <AtSign size={14} className="text-info" />;
    default:
      return <Inbox size={14} className="text-text-muted" />;
  }
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

function notifText(n: Notif, t: Messages): { text: string; href?: string } {
  const name = n.actor?.displayName ?? '·';
  const handle = n.actor?.username;
  const boardId = (n.payload?.boardId as string | undefined) ?? null;
  const board = (n.payload?.boardTitle as string | undefined) ?? '—';
  switch (n.type) {
    case 'FOLLOW':
      return {
        text: fillTemplate(t.notifications.follow, { name }),
        href: handle ? `/u/${handle}` : undefined,
      };
    case 'BOARD_INVITE':
      return {
        text: fillTemplate(t.notifications.inviteBoard, { name, board }),
        href: boardId ? `/b/${boardId}` : undefined,
      };
    case 'BOARD_JOIN_REQUEST':
      return {
        text: fillTemplate(t.notifications.joinRequest, { name, board }),
        href: boardId ? `/b/${boardId}?settings=open&tab=members` : undefined,
      };
    case 'BOARD_REQUEST_ACCEPTED':
      return {
        text: fillTemplate(t.notifications.requestAccepted, { name, board }),
        href: boardId ? `/b/${boardId}` : undefined,
      };
    case 'BOARD_REQUEST_REJECTED':
      return { text: fillTemplate(t.notifications.requestRejected, { name, board }) };
    case 'BOARD_CONTRIBUTION':
      return { text: fillTemplate(t.notifications.contribution, { name }) };
    case 'COMMENT_REPLY':
      return { text: fillTemplate(t.notifications.commentReply, { name }) };
    case 'MENTION':
      return { text: fillTemplate(t.notifications.mention, { name }) };
    default:
      return { text: t.notifications.generic };
  }
}

export function NotificationBell() {
  const t = useT();
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/notifications', { cache: 'no-store' });
      if (!r.ok) {
        setError(`${t.notifications.loadError} (${r.status})`);
        return;
      }
      const data = (await r.json()) as { items: Notif[]; unreadCount: number };
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch {
      setError(t.notifications.offline);
    } finally {
      setLoading(false);
    }
  }

  // Carga al montar y cada 60s en background — pausa el polling si la pestaña
  // no está visible para no consumir recursos en tabs en segundo plano.
  useEffect(() => {
    load();
    let interval: ReturnType<typeof setInterval> | null = null;
    function start() {
      if (interval !== null) return;
      interval = setInterval(load, 60_000);
    }
    function stop() {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    }
    function onVisibility() {
      if (document.visibilityState === 'visible') {
        load();
        start();
      } else {
        stop();
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    if (document.visibilityState === 'visible') start();
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, []);

  // Al abrir el dropdown, marca todas como leídas (después de mostrarlas)
  useEffect(() => {
    if (!open || unread === 0) return;
    const t = setTimeout(() => {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
        .then(() => setUnread(0))
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [open, unread]);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-bg-surface/60 text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
          aria-label="Notificaciones"
        >
          <Bell size={15} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-80 overflow-hidden rounded-lg border border-border-strong bg-bg-elevated shadow-3"
          style={{ animation: 'fadeIn 120ms ease-out' }}
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
            <p className="font-typewriter text-xs uppercase tracking-[0.18em] text-text-muted">
              {t.notifications.title}
            </p>
            {unread > 0 && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                {unread} {t.notifications.unread}
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {error ? (
              <div className="px-3 py-6 text-center text-xs text-danger">{error}</div>
            ) : loading && items.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-text-muted">Cargando…</div>
            ) : items.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <Inbox size={28} strokeWidth={1.3} className="mx-auto text-text-faded" />
                <p className="mt-2 text-sm text-text-muted">{t.notifications.empty}</p>
                <p className="mt-0.5 text-xs text-text-faded">{t.notifications.emptyDesc}</p>
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {items.map((n) => {
                  const { text, href } = notifText(n, t);
                  const Wrapper = (props: { children: React.ReactNode }) =>
                    href ? (
                      <Link
                        href={href as never}
                        className="block px-3 py-2.5 transition-colors hover:bg-bg-surface"
                      >
                        {props.children}
                      </Link>
                    ) : (
                      <div className="px-3 py-2.5">{props.children}</div>
                    );
                  return (
                    <li key={n.id} className={n.readAt ? 'opacity-70' : ''}>
                      <Wrapper>
                        <div className="flex gap-2.5">
                          <div className="mt-0.5 flex-shrink-0">{notifIcon(n.type)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-text-primary">{text}</p>
                            <p className="mt-0.5 font-typewriter text-[10px] uppercase tracking-wider text-text-faded">
                              {relativeTime(n.createdAt)}
                            </p>
                          </div>
                          {!n.readAt && (
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                          )}
                        </div>
                      </Wrapper>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
