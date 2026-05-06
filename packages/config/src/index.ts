export const APP_NAME = 'Hilo';
export const APP_TAGLINE = 'The Investigation Board';

export const PLAN_LIMITS = {
  FREE: { boards: 3, nodesPerBoard: 100, storageMb: 500, aiCallsPerMonth: 50 },
  PRO: { boards: Infinity, nodesPerBoard: 5000, storageMb: 5_000, aiCallsPerMonth: 2_000 },
  TEAM: { boards: Infinity, nodesPerBoard: 10_000, storageMb: 100_000, aiCallsPerMonth: 10_000 },
  NEWSROOM: { boards: Infinity, nodesPerBoard: 50_000, storageMb: 500_000, aiCallsPerMonth: 50_000 },
  ENTERPRISE: {
    boards: Infinity,
    nodesPerBoard: Infinity,
    storageMb: Infinity,
    aiCallsPerMonth: Infinity,
  },
} as const;

export const RATE_LIMITS = {
  anonContribution: { windowSec: 3600, max: 5 },
  authedContribution: { windowSec: 600, max: 30 },
  boardCreate: { windowSec: 3600, max: 20 },
  apiGeneral: { windowSec: 60, max: 120 },
} as const;

export const ANTI_DOXXING = {
  windowHours: 24,
  maxPersonalDataPerTarget: 3,
} as const;

export const HILO_LOCK = {
  hashAlgo: 'sha256',
  signatureAlgo: 'ed25519',
  anchorIntervalMin: 60,
} as const;
