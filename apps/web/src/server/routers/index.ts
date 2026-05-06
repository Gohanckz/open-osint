import { router } from '../trpc.js';
import { boardRouter } from './board.js';
import { nodeRouter } from './node.js';
import { connectionRouter } from './connection.js';
import { contributionRouter } from './contribution.js';

export const appRouter = router({
  board: boardRouter,
  node: nodeRouter,
  connection: connectionRouter,
  contribution: contributionRouter,
});

export type AppRouter = typeof appRouter;
