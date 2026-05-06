export { prisma } from './client.js';
export type { DB } from './client.js';
export * from './types.js';
// Re-export the Prisma namespace (for error classes, input types, etc.)
export { Prisma } from '@prisma/client';
