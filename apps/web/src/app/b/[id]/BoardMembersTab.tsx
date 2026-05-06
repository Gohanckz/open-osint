'use client';

import { useState } from 'react';
import { Button, Input } from '@hilo/ui';
import { trpc } from '@/lib/trpc';
import { getInitials } from '@/lib/initials';
import {
  UserPlus,
  Check,
  X,
  Crown,
  ShieldCheck,
  Edit3,
  MessageCircle,
  Eye,
  Trash2,
  Mail,
  Clock,
} from 'lucide-react';

const ROLE_META: Record<string, { Icon: typeof Crown; label: string; color: string }> = {
  OWNER: { Icon: Crown, label: 'Owner', color: '#fbbf24' },
  EDITOR: { Icon: Edit3, label: 'Editor', color: '#60a5fa' },
  VERIFIED_CONTRIBUTOR: { Icon: ShieldCheck, label: 'Contribuidor', color: '#4ade80' },
  COMMENTER: { Icon: MessageCircle, label: 'Comentarista', color: '#c084fc' },
  VIEWER: { Icon: Eye, label: 'Viewer', color: '#94a3b8' },
};

export function BoardMembersTab({ boardId }: { boardId: string }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.board.listMembership.useQuery({ boardId });
  const [username, setUsername] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const invite = trpc.board.invite.useMutation({
    onSuccess: () => {
      setUsername('');
      setInviteMessage('');
      setInviteError(null);
      utils.board.listMembership.invalidate({ boardId });
    },
    onError: (e) => setInviteError(e.message),
  });

  const respond = trpc.board.respondJoinRequest.useMutation({
    onSuccess: () => utils.board.listMembership.invalidate({ boardId }),
  });

  const removeMember = trpc.board.removeMember.useMutation({
    onSuccess: () => utils.board.listMembership.invalidate({ boardId }),
  });

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-text-muted">Cargando…</div>;
  }

  const pendingFromUsers = data?.pending.filter((p) => p.direction === 'USER_REQUEST') ?? [];
  const pendingInvites = data?.pending.filter((p) => p.direction === 'OWNER_INVITE') ?? [];

  return (
    <div className="space-y-5">
      {/* Solicitudes de unión pendientes (de usuarios) */}
      {pendingFromUsers.length > 0 && (
        <Section title="Solicitudes pendientes" subtitle="Usuarios que quieren unirse">
          <ul className="space-y-2">
            {pendingFromUsers.map((req) => (
              <li
                key={req.id}
                className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3"
              >
                <UserAvatar user={req.user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {req.user.displayName}
                  </p>
                  <p className="truncate font-typewriter text-[10px] text-text-faded">
                    @{req.user.username}
                  </p>
                  {req.message && (
                    <p className="mt-1.5 rounded border-l-2 border-warning/40 bg-bg-canvas/40 px-2 py-1 text-xs italic text-text-muted">
                      "{req.message}"
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => respond.mutate({ requestId: req.id, accept: true })}
                    disabled={respond.isPending}
                    className="gap-1"
                  >
                    <Check size={12} />
                    Aceptar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => respond.mutate({ requestId: req.id, accept: false })}
                    disabled={respond.isPending}
                    className="gap-1"
                  >
                    <X size={12} />
                    Rechazar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Invitaciones que el owner ha enviado y siguen sin respuesta */}
      {pendingInvites.length > 0 && (
        <Section title="Invitaciones enviadas" subtitle="Esperando respuesta del usuario">
          <ul className="space-y-1.5">
            {pendingInvites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center gap-3 rounded-md border border-border-subtle bg-bg-canvas/40 px-3 py-2"
              >
                <UserAvatar user={inv.user} small />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">
                    {inv.user.displayName}
                  </p>
                  <p className="truncate font-typewriter text-[9px] text-text-faded">
                    @{inv.user.username} · invitado como {ROLE_META[inv.role]?.label ?? inv.role}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-warning">
                  <Clock size={10} />
                  Pendiente
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Invitar usuario nuevo */}
      <Section title="Invitar usuario" subtitle="Por @username">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!username.trim()) return;
            invite.mutate({
              boardId,
              username: username.trim().replace(/^@/, ''),
              role: 'EDITOR',
              message: inviteMessage || undefined,
            });
          }}
          className="space-y-2"
        >
          <div className="flex gap-2">
            <div className="flex flex-1 items-center">
              <span className="flex h-9 items-center rounded-l-md border border-r-0 border-border-subtle bg-bg-canvas/60 px-3 font-typewriter text-sm text-text-faded">
                @
              </span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                className="rounded-l-none"
                maxLength={40}
              />
            </div>
            <Button type="submit" size="sm" disabled={invite.isPending || !username.trim()} className="gap-1.5">
              <UserPlus size={13} />
              Invitar
            </Button>
          </div>
          <textarea
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value.slice(0, 500))}
            placeholder="Mensaje opcional para el usuario…"
            rows={2}
            className="w-full resize-none rounded-md border border-border-subtle bg-bg-canvas/60 px-3 py-2 text-xs text-text-primary outline-none transition-colors focus:border-border-strong"
          />
          {inviteError && <p className="text-xs text-danger">{inviteError}</p>}
        </form>
      </Section>

      {/* Miembros actuales */}
      <Section title={`Miembros · ${data?.members.length ?? 0}`}>
        <ul className="space-y-1.5">
          {data?.members.map((m) => {
            const meta = ROLE_META[m.role] ?? ROLE_META.VIEWER!;
            const Icon = meta.Icon;
            return (
              <li
                key={m.userId}
                className="flex items-center gap-3 rounded-md border border-border-subtle bg-bg-canvas/40 px-3 py-2"
              >
                <UserAvatar user={m.user} small />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">
                    {m.user.displayName}
                  </p>
                  <p className="truncate font-typewriter text-[9px] text-text-faded">
                    @{m.user.username}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: `${meta.color}1a`, color: meta.color }}
                >
                  <Icon size={10} />
                  {meta.label}
                </span>
                {m.role !== 'OWNER' && (
                  <button
                    type="button"
                    onClick={() => removeMember.mutate({ boardId, userId: m.userId })}
                    className="rounded p-1 text-text-faded transition-colors hover:bg-danger/10 hover:text-danger"
                    title="Quitar miembro"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

function UserAvatar({
  user,
  small = false,
}: {
  user: { displayName: string; avatarUrl: string | null };
  small?: boolean;
}) {
  const initials = getInitials(user.displayName);
  const size = small ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
  return (
    <div className={`${size} flex-shrink-0 overflow-hidden rounded-full bg-bg-elevated`}>
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-accent font-semibold text-white">
          {initials || '·'}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2">
        <h3 className="font-typewriter text-[10px] uppercase tracking-[0.2em] text-text-muted">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-text-faded">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
