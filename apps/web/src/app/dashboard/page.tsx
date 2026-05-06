import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { prisma } from '@hilo/db';
import { Button } from '@hilo/ui';
import { AppHeader } from '@/components/AppHeader';
import { AppBackground } from '@/components/AppBackground';
import { BoardCardActions } from './BoardCardActions';
import { getMessages } from '@/i18n/server';
import {
  Plus,
  Lock,
  Globe,
  Eye,
  Network,
  Boxes,
  Activity,
  ArrowRight,
  Folder,
} from 'lucide-react';

function relativeTime(date: Date, locale: string): string {
  const diff = Date.now() - date.getTime();
  const m = 60_000;
  const isEs = locale === 'es';
  if (diff < m) return isEs ? 'hace instantes' : 'just now';
  if (diff < 60 * m) {
    const v = Math.floor(diff / m);
    return isEs ? `hace ${v} min` : `${v}m ago`;
  }
  if (diff < 24 * 60 * m) {
    const v = Math.floor(diff / (60 * m));
    return isEs ? `hace ${v} h` : `${v}h ago`;
  }
  if (diff < 30 * 24 * 60 * m) {
    const v = Math.floor(diff / (24 * 60 * m));
    return isEs ? `hace ${v} d` : `${v}d ago`;
  }
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function visibilityMeta(
  v: 'PRIVATE' | 'UNLISTED' | 'PUBLIC',
  t: { dashboard: { visibilityPublic: string; visibilityUnlisted: string; visibilityPrivate: string } },
) {
  if (v === 'PUBLIC') return { Icon: Globe, label: t.dashboard.visibilityPublic, color: '#4ade80' };
  if (v === 'UNLISTED') return { Icon: Eye, label: t.dashboard.visibilityUnlisted, color: '#fbbf24' };
  return { Icon: Lock, label: t.dashboard.visibilityPrivate, color: '#9aa3b3' };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');
  const userName = session?.user?.name ?? 'Investigator';

  const [boards, { locale, t }] = await Promise.all([
    prisma.board.findMany({
      where: { members: { some: { userId } } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        visibility: true,
        nodeCount: true,
        connectionCount: true,
        updatedAt: true,
      },
    }),
    getMessages(),
  ]);

  const totalNodes = boards.reduce((acc, b) => acc + b.nodeCount, 0);
  const totalConnections = boards.reduce((acc, b) => acc + b.connectionCount, 0);

  return (
    <main className="relative min-h-screen">
      <AppBackground />
      <AppHeader />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* === HERO HEADER === */}
        <header className="mb-10">
          <div className="flex flex-col gap-1.5">
            <p className="font-typewriter text-xs uppercase tracking-[0.3em] text-text-faded">
              {t.dashboard.dossier} · {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-text-primary">
              {t.dashboard.hello}, <span className="text-accent">{userName.split(' ')[0]}</span>.
            </h1>
            <p className="text-base text-text-muted">
              {boards.length === 0
                ? t.dashboard.noBoardsYet
                : `${t.dashboard.youHave} ${boards.length} ${boards.length === 1 ? t.dashboard.investigationOne : t.dashboard.investigationMany} ${t.dashboard.onTheTable}`}
            </p>
          </div>

          {/* Stats bento — solo si hay boards */}
          {boards.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              <StatTile
                icon={<Boxes size={18} />}
                label={t.dashboard.statsBoards}
                value={boards.length}
                accent="#60a5fa"
              />
              <StatTile
                icon={<Folder size={18} />}
                label={t.dashboard.statsTotalNodes}
                value={totalNodes}
                accent="#4ade80"
              />
              <StatTile
                icon={<Network size={18} />}
                label={t.dashboard.statsConnections}
                value={totalConnections}
                accent="#ef4444"
              />
            </div>
          )}
        </header>

        {/* === BARRA DE ACCIONES === */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="font-typewriter text-xs uppercase tracking-[0.25em] text-text-muted">
            {boards.length > 0 ? t.dashboard.yourBoards : t.dashboard.start}
          </h2>
          <Button asChild size="md" className="gap-2">
            <Link href="/boards/new">
              <Plus size={16} strokeWidth={2.4} />
              {t.dashboard.newBoard}
            </Link>
          </Button>
        </div>

        {/* === GRID DE TABLEROS === */}
        {boards.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {boards.map((b) => {
              const v = visibilityMeta(b.visibility, t);
              return (
                <Link
                  key={b.id}
                  href={`/b/${b.id}`}
                  className="board-card group relative block overflow-hidden rounded-xl border border-border-subtle bg-bg-surface p-5 transition-all hover:border-accent/50 hover:bg-bg-elevated"
                >
                  {/* Cinta de color en el borde superior según visibilidad */}
                  <div
                    className="absolute inset-x-0 top-0 h-0.5"
                    style={{ background: v.color, opacity: 0.6 }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-text-primary group-hover:text-accent">
                        {b.title}
                      </h3>
                      {b.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-text-muted">{b.description}</p>
                      )}
                    </div>
                    <div className="flex items-start gap-1">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider"
                        style={{
                          background: `${v.color}1a`,
                          color: v.color,
                          border: `1px solid ${v.color}33`,
                        }}
                      >
                        <v.Icon size={10} />
                        {v.label}
                      </span>
                      <BoardCardActions
                        boardId={b.id}
                        boardTitle={b.title}
                        visibility={b.visibility}
                      />
                    </div>
                  </div>

                  {/* Meta — chips de stats */}
                  <div className="mt-5 flex items-center gap-2 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-canvas/50 px-2 py-1">
                      <Boxes size={11} className="text-info" />
                      <span className="tabular-nums text-text-primary">{b.nodeCount}</span>
                      <span>{t.dashboard.nodes}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-canvas/50 px-2 py-1">
                      <Network size={11} className="text-accent" />
                      <span className="tabular-nums text-text-primary">{b.connectionCount}</span>
                      <span>{t.dashboard.threads}</span>
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-text-faded">
                      <Activity size={11} />
                      {relativeTime(b.updatedAt, locale)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-text-faded transition-transform group-hover:translate-x-0.5 group-hover:text-accent">
                      {t.dashboard.open}
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* Tile "Crear nuevo" — siempre al final */}
            <Link
              href="/boards/new"
              className="group relative flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-subtle bg-bg-surface/30 p-5 text-center transition-all hover:border-accent/60 hover:bg-bg-surface/60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-strong bg-bg-elevated text-text-muted transition-all group-hover:border-accent group-hover:bg-accent/10 group-hover:text-accent">
                <Plus size={20} strokeWidth={2.2} />
              </div>
              <p className="mt-3 font-typewriter text-sm font-medium text-text-primary">
                {t.dashboard.newBoard}
              </p>
              <p className="mt-1 text-xs text-text-faded">{t.dashboard.createFromZero}</p>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

/** Tile pequeño para mostrar una métrica en el header. */
function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div
      className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-border-subtle bg-bg-surface/60 p-4"
      style={{
        background: `linear-gradient(135deg, var(--color-bg-surface) 0%, color-mix(in srgb, ${accent} 4%, var(--color-bg-surface)) 100%)`,
      }}
    >
      <div
        className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-xl"
        style={{ background: accent }}
      />
      <div
        className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${accent}1a`, color: accent }}
      >
        {icon}
      </div>
      <div className="relative min-w-0">
        <p className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-text-muted">
          {label}
        </p>
        <p className="text-2xl font-semibold tabular-nums text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ t }: { t: Awaited<ReturnType<typeof getMessages>>['t'] }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-surface/60 p-12 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)' }}
        />
      </div>
      <div className="relative">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border-strong bg-bg-elevated text-accent">
          <Network size={28} strokeWidth={1.4} />
        </div>
        <h2 className="mt-5 font-typewriter text-xl font-medium text-text-primary">
          {t.dashboard.emptyTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">{t.dashboard.emptyDesc}</p>
        <Button asChild className="mt-6 gap-2">
          <Link href="/boards/new">
            <Plus size={16} strokeWidth={2.4} />
            {t.dashboard.emptyCta}
          </Link>
        </Button>
      </div>
    </div>
  );
}
