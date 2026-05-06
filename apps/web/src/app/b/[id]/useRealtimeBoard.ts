'use client';

import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import type { Presence } from '@hilo/ui';

const PRESENCE_COLORS = ['#E63946', '#4CC9F0', '#F4A261', '#06A77D', '#A78BFA', '#E0AC2B'];

export function useRealtimeBoard(boardId: string, userId: string | null) {
  const [presence, setPresence] = useState<Presence[]>([]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL ?? 'ws://localhost:1234';
    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url,
      name: `board:${boardId}`,
      document: doc,
      token: userId ?? 'anonymous',
    });

    const me = {
      userId: userId ?? `anon-${Math.random().toString(36).slice(2, 8)}`,
      displayName: userId ? 'You' : 'Anónimo',
      color: PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)]!,
    };

    provider.setAwarenessField('user', me);

    const onAwareness = () => {
      const states = Array.from(provider.awareness?.getStates() ?? []).map(
        ([, s]) => (s as { user?: Presence }).user,
      );
      setPresence(states.filter((s): s is Presence => !!s));
    };

    provider.awareness?.on('change', onAwareness);
    onAwareness();

    return () => {
      provider.awareness?.off('change', onAwareness);
      provider.destroy();
      doc.destroy();
    };
  }, [boardId, userId]);

  return { presence };
}
