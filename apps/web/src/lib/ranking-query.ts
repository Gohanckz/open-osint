import { unstable_cache } from 'next/cache';
import { prisma } from '@hilo/db';
import { computeUserScore, type UserContribution } from './ranking';

export interface RankedUser {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  contribution: UserContribution;
  score: number;
  rank: number;
}

/**
 * Calcula el ranking público completo. Cacheado 60s vía unstable_cache para no
 * recalcular en cada request (escala bien hasta varios miles de usuarios).
 *
 * Nota: para escalar más, mover a vista materializada en Postgres actualizada
 * por trigger o cron.
 */
export const fetchRanking = unstable_cache(
  fetchRankingUncached,
  ['ranking'],
  { revalidate: 60, tags: ['ranking'] },
);

async function fetchRankingUncached(limit = 100): Promise<RankedUser[]> {
  const [boardStats, featuredStats, followerStats, users] = await Promise.all([
    prisma.board.groupBy({
      by: ['ownerId'],
      where: { visibility: 'PUBLIC' },
      _count: { id: true },
      _sum: { nodeCount: true, connectionCount: true },
    }),
    prisma.board.groupBy({
      by: ['ownerId'],
      where: { visibility: 'PUBLIC', isFeatured: true },
      _count: { id: true },
    }),
    prisma.follow.groupBy({
      by: ['followingId'],
      _count: { followerId: true },
    }),
    // Incluimos usuarios sin username (no aparecen como link, pero sí en ranking)
    prisma.user.findMany({
      where: { privacyMode: false },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        isVerified: true,
        reputationScore: true,
      },
    }),
  ]);

  const boardMap = new Map(boardStats.map((s) => [s.ownerId, s]));
  const featuredMap = new Map(featuredStats.map((s) => [s.ownerId, s._count.id]));
  const followerMap = new Map(followerStats.map((s) => [s.followingId, s._count.followerId]));

  const ranked: Omit<RankedUser, 'rank'>[] = users.map((u) => {
    const b = boardMap.get(u.id);
    const contribution: UserContribution = {
      boardCount: b?._count.id ?? 0,
      totalNodes: b?._sum.nodeCount ?? 0,
      totalConnections: b?._sum.connectionCount ?? 0,
      featuredCount: featuredMap.get(u.id) ?? 0,
      followerCount: followerMap.get(u.id) ?? 0,
      isVerified: u.isVerified,
      reputationScore: u.reputationScore,
    };
    return {
      id: u.id,
      displayName: u.displayName,
      username: u.username,
      avatarUrl: u.avatarUrl,
      isVerified: u.isVerified,
      contribution,
      score: computeUserScore(contribution),
    };
  });

  // Solo usuarios con score > 0 (al menos un aporte real)
  const meaningful = ranked.filter((r) => r.score > 0);
  meaningful.sort((a, b) => b.score - a.score);
  return meaningful.slice(0, limit).map((r, i) => ({ ...r, rank: i + 1 }));
}

/** Obtiene la posición y stats de un solo usuario sin recorrer todo. */
export async function fetchUserStats(userId: string): Promise<{
  contribution: UserContribution;
  score: number;
  rank: number | null;
}> {
  const [boardAgg, featuredAgg, followerCount, user] = await Promise.all([
    prisma.board.aggregate({
      where: { ownerId: userId, visibility: 'PUBLIC' },
      _count: { id: true },
      _sum: { nodeCount: true, connectionCount: true },
    }),
    prisma.board.count({ where: { ownerId: userId, visibility: 'PUBLIC', isFeatured: true } }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true, reputationScore: true },
    }),
  ]);

  const contribution: UserContribution = {
    boardCount: boardAgg._count.id,
    totalNodes: boardAgg._sum.nodeCount ?? 0,
    totalConnections: boardAgg._sum.connectionCount ?? 0,
    featuredCount: featuredAgg,
    followerCount,
    isVerified: user?.isVerified ?? false,
    reputationScore: user?.reputationScore ?? 0,
  };
  const score = computeUserScore(contribution);

  // Rank: contamos cuántos usuarios tienen score mayor. Si score=0, rank=null
  // (no aparecen en ranking). Cap a 100 que es lo que muestra `/ranking`.
  let rank: number | null = null;
  if (score > 0) {
    const ranking = await fetchRanking(100);
    const found = ranking.findIndex((r) => r.id === userId);
    rank = found >= 0 ? found + 1 : null;
  }

  return { contribution, score, rank };
}
