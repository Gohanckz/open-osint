import { Hocuspocus } from '@hocuspocus/server';
import { Redis as RedisExtension } from '@hocuspocus/extension-redis';
import * as Y from 'yjs';
import { prisma, type Role } from '@hilo/db';

const PORT = Number(process.env.PORT ?? 1234);
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  COMMENTER: 2,
  VERIFIED_CONTRIBUTOR: 3,
  EDITOR: 4,
  OWNER: 5,
};

const server = new Hocuspocus({
  port: PORT,
  name: 'hilo-realtime',

  extensions: [
    new RedisExtension({
      host: new URL(REDIS_URL).hostname,
      port: Number(new URL(REDIS_URL).port || 6379),
    }),
  ],

  async onAuthenticate({ documentName, token }) {
    const boardId = documentName.replace(/^board:/, '');
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new Error('Board not found');

    if (board.visibility === 'PUBLIC' && token === 'anonymous') {
      return { userId: null, role: 'VIEWER' as Role, readOnly: true };
    }
    if (token === 'anonymous') throw new Error('Authentication required');

    const member = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: token } },
    });
    if (!member) throw new Error('Forbidden');

    return {
      userId: token,
      role: member.role,
      readOnly: ROLE_RANK[member.role] < ROLE_RANK.EDITOR,
    };
  },

  async onLoadDocument({ documentName }) {
    const boardId = documentName.replace(/^board:/, '');
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new Error('Board not found');

    const doc = new Y.Doc();
    if (board.yDocSnapshot) {
      Y.applyUpdate(doc, new Uint8Array(board.yDocSnapshot));
      return doc;
    }

    // Bootstrap inicial desde Postgres
    const [nodes, connections] = await Promise.all([
      prisma.node.findMany({ where: { boardId, status: { not: 'ARCHIVED' } } }),
      prisma.connection.findMany({ where: { boardId } }),
    ]);
    const yNodes = doc.getMap('nodes');
    const yEdges = doc.getArray('edges');
    doc.transact(() => {
      for (const n of nodes) {
        const m = new Y.Map();
        m.set('type', n.type);
        m.set('title', n.title);
        m.set('subtitle', n.subtitle ?? '');
        m.set('tags', n.tags);
        m.set('x', n.x);
        m.set('y', n.y);
        m.set('width', n.width);
        m.set('height', n.height);
        m.set('status', n.status);
        yNodes.set(n.id, m);
      }
      for (const c of connections) {
        const m = new Y.Map();
        m.set('id', c.id);
        m.set('source', c.fromNodeId);
        m.set('target', c.toNodeId);
        m.set('type', c.type);
        m.set('label', c.label ?? '');
        m.set('strength', c.strength);
        m.set('verified', c.verified);
        m.set('directional', c.directional);
        yEdges.push([m]);
      }
    });
    return doc;
  },

  async onStoreDocument({ documentName, document }) {
    const boardId = documentName.replace(/^board:/, '');
    const snapshot = Buffer.from(Y.encodeStateAsUpdate(document));
    await prisma.board.update({
      where: { id: boardId },
      data: { yDocSnapshot: snapshot, yDocVersion: { increment: 1 } },
    });
  },

  async beforeHandleMessage({ context }) {
    if (context?.readOnly) {
      throw new Error('Read-only session');
    }
  },
});

server.listen().then(() => {
  console.log(`[realtime] Hocuspocus listening on ws://0.0.0.0:${PORT}`);
});
