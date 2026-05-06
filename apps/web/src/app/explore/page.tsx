import Link from 'next/link';
import { prisma } from '@hilo/db';
import { AppHeader } from '@/components/AppHeader';
import { AppBackground } from '@/components/AppBackground';
import { getInitials } from '@/lib/initials';
import {
  Boxes,
  Network,
  ShieldCheck,
  Sparkles,
  Compass,
  Users,
  TrendingUp,
  Globe,
  Activity,
} from 'lucide-react';

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = 60_000;
  if (diff < m) return 'hace instantes';
  if (diff < 60 * m) return `hace ${Math.floor(diff / m)} min`;
  if (diff < 24 * 60 * m) return `hace ${Math.floor(diff / (60 * m))} h`;
  if (diff < 30 * 24 * 60 * m) return `hace ${Math.floor(diff / (24 * 60 * m))} d`;
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

export default async function ExplorePage() {
  const [boardsRaw, totals] = await Promise.all([
    prisma.board.findMany({
      where: { visibility: 'PUBLIC' },
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
      take: 24,
      select: {
        id: true,
        title: true,
        description: true,
        nodeCount: true,
        connectionCount: true,
        isVerified: true,
        isFeatured: true,
        updatedAt: true,
        ownerId: true,
      },
    }),
    prisma.board
      .aggregate({
        where: { visibility: 'PUBLIC' },
        _count: { id: true },
        _sum: { nodeCount: true, connectionCount: true },
      })
      .catch(() => ({ _count: { id: 0 }, _sum: { nodeCount: 0, connectionCount: 0 } })),
  ]);

  // Carga los owners en una segunda query (Board no tiene relation a User en el schema)
  const ownerIds = Array.from(new Set(boardsRaw.map((b) => b.ownerId)));
  const owners = ownerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, displayName: true, username: true, avatarUrl: true },
      })
    : [];
  const ownerMap = new Map(owners.map((u) => [u.id, u]));

  const boards = boardsRaw.map((b) => ({
    ...b,
    owner: ownerMap.get(b.ownerId) ?? null,
  }));

  const featured = boards.filter((b) => b.isFeatured).slice(0, 3);
  const rest = boards.filter((b) => !b.isFeatured);

  return (
    <main className="relative min-h-screen">
      <AppBackground />
      <AppHeader />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* === HERO === */}
        <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface/40 p-8 sm:p-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                'radial-gradient(circle at 70% 20%, rgba(99,145,220,0.15), transparent 50%), radial-gradient(circle at 20% 80%, rgba(239,68,68,0.10), transparent 50%)',
            }}
          />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-canvas/60 px-3 py-1 font-typewriter text-[10px] uppercase tracking-[0.25em] text-text-muted">
              <Compass size={11} />
              Exploración pública
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
              Investigaciones <span className="text-accent">en marcha</span>.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-text-muted">
              Tableros públicos donde la comunidad conecta evidencia, persigue hilos y arma piezas.
              Únete, contribuye o crea el tuyo.
            </p>
          </div>

          {/* Stats globales */}
          <div className="relative mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
            <StatPill
              icon={<Boxes size={14} />}
              label="Tableros"
              value={totals._count.id}
              color="#60a5fa"
            />
            <StatPill
              icon={<Network size={14} />}
              label="Hilos"
              value={totals._sum.connectionCount ?? 0}
              color="#ef4444"
            />
            <StatPill
              icon={<Users size={14} />}
              label="Nodos"
              value={totals._sum.nodeCount ?? 0}
              color="#4ade80"
            />
          </div>
        </section>

        {/* === DESTACADOS === */}
        {featured.length > 0 && (
          <section className="mt-10">
            <SectionHeader
              icon={<Sparkles size={14} />}
              title="Destacados"
              subtitle="Investigaciones marcadas por la comunidad"
            />
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {featured.map((b) => (
                <BoardCard key={b.id} board={b} highlighted />
              ))}
            </div>
          </section>
        )}

        {/* === RECIENTES === */}
        <section className="mt-10">
          <SectionHeader
            icon={<TrendingUp size={14} />}
            title="Más recientes"
            subtitle="Lo último publicado en la comunidad"
          />
          <div className="mt-4">
            {rest.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((b) => (
                  <BoardCard key={b.id} board={b} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================================
   Componentes
   ========================================================================== */

type BoardCardData = {
  id: string;
  title: string;
  description: string | null;
  nodeCount: number;
  connectionCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  updatedAt: Date;
  owner: { displayName: string; username: string | null; avatarUrl: string | null } | null;
};

function BoardCard({ board: b, highlighted = false }: { board: BoardCardData; highlighted?: boolean }) {
  const initials = getInitials(b.owner?.displayName);

  return (
    <Link
      href={`/b/${b.id}`}
      className={`group relative block overflow-hidden rounded-xl border bg-bg-surface p-5 transition-all hover:border-accent/50 hover:bg-bg-elevated ${
        highlighted ? 'border-accent/30' : 'border-border-subtle'
      }`}
    >
      {highlighted && (
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(circle at 100% 0%, rgba(239,68,68,0.10), transparent 60%)',
          }}
        />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Globe size={12} className="text-success flex-shrink-0" />
            <h3 className="truncate text-lg font-semibold text-text-primary group-hover:text-accent">
              {b.title}
            </h3>
          </div>
          {b.description && (
            <p className="mt-1 line-clamp-2 text-sm text-text-muted">{b.description}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {b.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-md bg-info/15 px-1.5 py-0.5 text-[10px] font-medium text-info">
              <ShieldCheck size={10} />
              VERIFICADO
            </span>
          )}
          {b.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              <Sparkles size={10} />
              DESTACADO
            </span>
          )}
        </div>
      </div>

      {/* Stats chips */}
      <div className="relative mt-4 flex items-center gap-2 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-canvas/50 px-2 py-1">
          <Boxes size={11} className="text-info" />
          <span className="tabular-nums text-text-primary">{b.nodeCount}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-canvas/50 px-2 py-1">
          <Network size={11} className="text-accent" />
          <span className="tabular-nums text-text-primary">{b.connectionCount}</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-text-faded">
          <Activity size={10} />
          {relativeTime(b.updatedAt)}
        </span>
      </div>

      {/* Owner pill */}
      {b.owner && (
        <div className="relative mt-4 flex items-center gap-2 border-t border-border-subtle pt-3">
          <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-bg-elevated">
            {b.owner.avatarUrl ? (
              <img src={b.owner.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent text-[9px] font-semibold text-white">
                {initials}
              </div>
            )}
          </div>
          <span className="truncate text-xs text-text-muted">
            por <span className="text-text-primary">{b.owner.displayName}</span>
          </span>
        </div>
      )}
    </Link>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border border-border-subtle p-3"
      style={{
        background: `linear-gradient(135deg, var(--color-bg-surface) 0%, color-mix(in srgb, ${color} 5%, var(--color-bg-surface)) 100%)`,
      }}
    >
      <div className="flex items-center gap-2 text-text-muted">
        <span style={{ color }}>{icon}</span>
        <span className="font-typewriter text-[10px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums text-text-primary">
        {value.toLocaleString('es')}
      </p>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-1.5 font-typewriter text-xs uppercase tracking-[0.2em] text-text-muted">
          {icon}
          {title}
        </div>
        {subtitle && <p className="mt-0.5 text-sm text-text-faded">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-12 text-center">
      <Compass size={32} strokeWidth={1.3} className="mx-auto text-text-faded" />
      <h3 className="mt-3 text-base font-medium text-text-primary">
        Aún no hay tableros públicos
      </h3>
      <p className="mt-1 text-sm text-text-muted">
        Sé de los primeros en publicar una investigación a la comunidad.
      </p>
      <Link
        href="/boards/new"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Crear tablero público
      </Link>
    </div>
  );
}
