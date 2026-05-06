import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/server/auth';
import { prisma } from '@hilo/db';
import { AppHeader } from '@/components/AppHeader';
import { AppBackground } from '@/components/AppBackground';
import { FollowButton } from './FollowButton';
import { GameStats } from './GameStats';
import { fetchUserStats } from '@/lib/ranking-query';
import { getInitials } from '@/lib/initials';
import { getMessages } from '@/i18n/server';
import {
  ShieldCheck,
  Lock,
  Boxes,
  Network,
  Calendar,
  Users,
  Globe,
  Eye,
} from 'lucide-react';

function relativeJoinedDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

function fillTpl(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      bio: true,
      isVerified: true,
      privacyMode: true,
      createdAt: true,
      _count: { select: { followers: true, following: true } },
    },
  });
  if (!user) notFound();

  const isFollowing = viewerId
    ? await prisma.follow
        .findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
        })
        .then(Boolean)
    : false;

  // Tableros públicos del usuario (oculto si privacyMode)
  const publicBoards = user.privacyMode
    ? []
    : await prisma.board.findMany({
        where: { ownerId: user.id, visibility: 'PUBLIC' },
        orderBy: { updatedAt: 'desc' },
        take: 9,
        select: {
          id: true,
          title: true,
          description: true,
          nodeCount: true,
          connectionCount: true,
          updatedAt: true,
        },
      });

  // Stats gamificados (oculto si privacyMode)
  const [gameStats, heatmap, { locale, t }] = await Promise.all([
    user.privacyMode ? Promise.resolve(null) : fetchUserStats(user.id),
    user.privacyMode ? Promise.resolve([] as number[]) : buildActivityHeatmap(user.id),
    getMessages(),
  ]);

  const initials = getInitials(user.displayName);

  const isOwnProfile = viewerId === user.id;

  return (
    <main className="relative min-h-screen">
      <AppBackground />
      <AppHeader />

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* === HERO PERFIL === */}
        <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface/50 p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 70%)' }}
          />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-full border-2 border-border-strong shadow-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent text-3xl font-semibold text-white">
                  {initials || '·'}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
                  {user.displayName}
                </h1>
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-info/15 px-2 py-0.5 text-xs font-medium text-info">
                    <ShieldCheck size={12} />
                    {t.profile.verified}
                  </span>
                )}
                {user.privacyMode && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-muted">
                    <Lock size={11} />
                    {t.profile.privateMode}
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-typewriter text-sm text-text-faded">@{user.username}</p>
              {user.bio && (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
                  {user.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-faded">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} />
                  {t.profile.joinedOn} {relativeJoinedDate(user.createdAt, locale)}
                </span>
                <Link
                  href={`/u/${user.username}/followers`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-text-primary"
                >
                  <Users size={12} />
                  <span className="tabular-nums text-text-primary">{user._count.followers}</span>{' '}
                  {user._count.followers === 1 ? t.profile.follower : t.profile.followers}
                </Link>
                <Link
                  href={`/u/${user.username}/following`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-text-primary"
                >
                  <span className="tabular-nums text-text-primary">{user._count.following}</span>{' '}
                  {t.profile.followingCount}
                </Link>
              </div>
            </div>

            {/* Botón seguir / editar */}
            {viewerId && (
              <div className="flex-shrink-0">
                {isOwnProfile ? (
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-border-strong"
                  >
                    {t.profile.editProfile}
                  </Link>
                ) : (
                  <FollowButton username={user.username!} initialFollowing={isFollowing} />
                )}
              </div>
            )}
          </div>
        </section>

        {/* === STATS GAMIFICADOS === */}
        {gameStats && (
          <section className="mt-10">
            <GameStats
              contribution={gameStats.contribution}
              score={gameStats.score}
              rank={gameStats.rank}
              heatmap={heatmap}
            />
          </section>
        )}

        {/* === TABLEROS PÚBLICOS === */}
        <section className="mt-10">
          <h2 className="font-typewriter text-xs uppercase tracking-[0.25em] text-text-muted">
            {t.profile.publicBoards}
          </h2>
          <div className="mt-4">
            {user.privacyMode ? (
              <EmptyMessage
                icon={<Lock size={24} strokeWidth={1.4} />}
                title={t.profile.privateProfileTitle}
                description={fillTpl(t.profile.privateProfileDesc, { username: user.username ?? '' })}
              />
            ) : publicBoards.length === 0 ? (
              <EmptyMessage
                icon={<Eye size={24} strokeWidth={1.4} />}
                title={t.profile.noPublicBoardsTitle}
                description={fillTpl(t.profile.noPublicBoardsDesc, { name: user.displayName })}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publicBoards.map((b) => (
                  <Link
                    key={b.id}
                    href={`/b/${b.id}`}
                    className="group block overflow-hidden rounded-xl border border-border-subtle bg-bg-surface p-5 transition-all hover:border-accent/50 hover:bg-bg-elevated"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-text-primary group-hover:text-accent">
                          {b.title}
                        </h3>
                        {b.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                            {b.description}
                          </p>
                        )}
                      </div>
                      <Globe size={14} className="flex-shrink-0 text-success" />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-canvas/50 px-2 py-1">
                        <Boxes size={11} className="text-info" />
                        <span className="tabular-nums text-text-primary">{b.nodeCount}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-canvas/50 px-2 py-1">
                        <Network size={11} className="text-accent" />
                        <span className="tabular-nums text-text-primary">{b.connectionCount}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function EmptyMessage({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border-strong bg-bg-elevated text-text-muted">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-medium text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-muted">{description}</p>
    </div>
  );
}

/**
 * Construye el array de actividad de los últimos 364 días (52 semanas × 7 días).
 * Cuenta nodos creados por el usuario en sus tableros públicos.
 *
 * Optimizado con raw SQL: agrupa por día en Postgres en vez de traer N nodos
 * y bucketizar en JS. Coste O(días) en payload, O(log N) en DB con índice.
 *
 * Devuelve [oldest..newest], índice 0 = hace 364 días.
 */
async function buildActivityHeatmap(userId: string): Promise<number[]> {
  const days = 364;
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  // Una sola query: nodos del año del usuario en sus boards públicos, agrupados por día
  type Row = { day: Date; count: bigint };
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT date_trunc('day', n."createdAt") as day, count(*)::bigint as count
    FROM "Node" n
    INNER JOIN "Board" b ON b.id = n."boardId"
    WHERE b."ownerId" = ${userId}
      AND b.visibility = 'PUBLIC'
      AND n."createdAt" >= ${since}
    GROUP BY 1
  `;

  const buckets = Array<number>(days).fill(0);
  for (const row of rows) {
    const diffMs = new Date(row.day).getTime() - since.getTime();
    const dayIdx = Math.floor(diffMs / (24 * 3600 * 1000));
    if (dayIdx >= 0 && dayIdx < days) buckets[dayIdx] = Number(row.count);
  }
  return buckets;
}
