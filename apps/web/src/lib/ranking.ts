/**
 * Sistema de scoring + niveles para el ranking público.
 *
 * Filosofía: rewardear creación + colaboración. La reputación visible (Verified,
 * Featured) y la red social (followers) suman pero no son lo principal.
 */

export interface UserContribution {
  boardCount: number;
  totalNodes: number;
  totalConnections: number;
  featuredCount: number;
  followerCount: number;
  isVerified: boolean;
  reputationScore: number;
}

const W = {
  board: 10,
  node: 1,
  connection: 0.5,
  follower: 5,
  verifiedBonus: 100,
  featuredBoard: 50,
  reputationMultiplier: 1,
};

export function computeUserScore(c: UserContribution): number {
  return Math.round(
    c.boardCount * W.board +
      c.totalNodes * W.node +
      c.totalConnections * W.connection +
      c.followerCount * W.follower +
      (c.isVerified ? W.verifiedBonus : 0) +
      c.featuredCount * W.featuredBoard +
      c.reputationScore * W.reputationMultiplier,
  );
}

export type LevelKey = 'novato' | 'investigador' | 'detective' | 'maestro' | 'leyenda';

export interface Level {
  key: LevelKey;
  name: string;
  /** Mín. score (inclusive) */
  min: number;
  /** Máx. score (exclusive). null = sin tope. */
  max: number | null;
  color: string;
  glow: string;
  emoji: string;
}

export const LEVELS: Level[] = [
  { key: 'novato', name: 'Novato', min: 0, max: 100, color: '#94a3b8', glow: 'rgba(148,163,184,0.3)', emoji: '·' },
  { key: 'investigador', name: 'Investigador', min: 100, max: 500, color: '#60a5fa', glow: 'rgba(96,165,250,0.4)', emoji: '·' },
  { key: 'detective', name: 'Detective', min: 500, max: 2000, color: '#4ade80', glow: 'rgba(74,222,128,0.4)', emoji: '·' },
  { key: 'maestro', name: 'Maestro', min: 2000, max: 5000, color: '#fbbf24', glow: 'rgba(251,191,36,0.5)', emoji: '·' },
  { key: 'leyenda', name: 'Leyenda', min: 5000, max: null, color: '#ef4444', glow: 'rgba(239,68,68,0.5)', emoji: '·' },
];

export function getLevel(score: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i]!.min) return LEVELS[i]!;
  }
  return LEVELS[0]!;
}

/** Devuelve el progreso 0-1 hacia el siguiente nivel y los puntos restantes. */
export function getLevelProgress(score: number): {
  current: Level;
  next: Level | null;
  progress: number; // 0..1
  toNext: number;
} {
  const current = getLevel(score);
  const idx = LEVELS.findIndex((l) => l.key === current.key);
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1]! : null;
  if (!next) return { current, next: null, progress: 1, toNext: 0 };
  const range = next.min - current.min;
  const progress = Math.min(1, Math.max(0, (score - current.min) / range));
  return { current, next, progress, toNext: Math.max(0, next.min - score) };
}
