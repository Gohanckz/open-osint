'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { applyEdgeChanges, applyNodeChanges, type Node, type Edge } from '@xyflow/react';
import {
  HiloCanvas,
  HILO_EDGE_DELETE_EVENT,
  type HiloEdgeDeleteDetail,
  type HiloNodeData,
  type HiloEdgeData,
} from '@hilo/canvas';
import { NODE_TYPE_META, type NodeTypeKey } from '@hilo/shared';
import { Button, ConfirmDialog, PresenceAvatars } from '@hilo/ui';
import { trpc } from '@/lib/trpc';
import { Inspector } from './Inspector';
import { Toolbar } from './Toolbar';
import { useRealtimeBoard } from './useRealtimeBoard';
import { UserMenu } from '@/components/UserMenu';
import { NotificationBell } from '@/components/NotificationBell';
import { BoardSettingsDialog } from './BoardSettingsDialog';
import { JoinBoardButton } from './JoinBoardButton';
import { Settings } from 'lucide-react';

type BoardWithGraph = {
  id: string;
  title: string;
  description: string | null;
  visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
  contributionMode: 'CLOSED' | 'INVITE' | 'OPEN_PENDING' | 'OPEN_INSTANT';
  nodes: Array<{
    id: string;
    type: NodeTypeKey;
    title: string;
    subtitle: string | null;
    fields: unknown;
    tags: string[];
    color: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  }>;
  connections: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    type: keyof typeof import('@hilo/shared').CONNECTION_TYPE_META;
    label: string | null;
    strength: number;
    verified: boolean;
    directional: boolean;
  }>;
};

// Atajos de teclado para crear nodos.
//   1-6     → tipos OSINT (Persona / Empresa / Evento / Evidencia / Ubicación / Custom)
//   Shift+1..8 → tipos Cyber (Host / Domain / Account / Wallet / Vuln / Malware / Cred / Network)
//   Letras: H=Host · D=Domain · A=Account · W=Wallet · V=Vulnerability · M=Malware · K=Credential · R=Network
const TYPE_BY_KEY: Record<string, NodeTypeKey> = {
  '1': 'PERSON',
  '2': 'COMPANY',
  '3': 'EVENT',
  '4': 'EVIDENCE',
  '5': 'LOCATION',
  '6': 'CUSTOM',
};

const TYPE_BY_SHIFT_KEY: Record<string, NodeTypeKey> = {
  '1': 'HOST',
  '2': 'DOMAIN',
  '3': 'ACCOUNT',
  '4': 'WALLET',
  '5': 'VULNERABILITY',
  '6': 'MALWARE',
  '7': 'CREDENTIAL',
  '8': 'NETWORK',
  '!': 'HOST',
  '@': 'DOMAIN',
  '#': 'ACCOUNT',
  $: 'WALLET',
  '%': 'VULNERABILITY',
  '^': 'MALWARE',
  '&': 'CREDENTIAL',
  '*': 'NETWORK',
};

const TYPE_BY_LETTER: Record<string, NodeTypeKey> = {
  h: 'HOST',
  d: 'DOMAIN',
  a: 'ACCOUNT',
  w: 'WALLET',
  v: 'VULNERABILITY',
  m: 'MALWARE',
  k: 'CREDENTIAL',
  r: 'NETWORK',
};

export function BoardCanvas({
  board,
  viewerId,
  canEdit = false,
  currentUser,
}: {
  board: BoardWithGraph;
  viewerId: string | null;
  /** True solo si es miembro EDITOR/OWNER. Sin esto el canvas es solo lectura. */
  canEdit?: boolean;
  currentUser?: {
    displayName: string;
    email?: string | null;
    avatarUrl?: string | null;
    username?: string | null;
  } | null;
}) {
  const readOnly = !canEdit;

  const initialNodes: Node<HiloNodeData>[] = useMemo(
    () =>
      board.nodes.map((n) => ({
        id: n.id,
        type: 'hilo',
        position: { x: n.x, y: n.y },
        data: {
          type: n.type,
          title: n.title,
          subtitle: n.subtitle ?? undefined,
          tags: n.tags,
          status: n.status,
          color: n.color ?? undefined,
          fields: (n.fields as Record<string, string | number | null>) ?? {},
        },
      })),
    [board.nodes],
  );

  const initialEdges: Edge<HiloEdgeData>[] = useMemo(
    () =>
      board.connections.map((c) => ({
        id: c.id,
        source: c.fromNodeId,
        target: c.toNodeId,
        type: 'hilo',
        data: {
          type: c.type,
          label: c.label ?? undefined,
          strength: c.strength,
          verified: c.verified,
          directional: c.directional,
        },
      })),
    [board.connections],
  );

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selected, setSelected] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  /** Confirmación para borrado masivo desde teclado. */
  const [pendingBulkDelete, setPendingBulkDelete] = useState<{
    nodeIds: string[];
    edgeIds: string[];
  } | null>(null);
  /** Confirmación para eliminar una arista desde su botón flotante. */
  const [pendingEdgeDelete, setPendingEdgeDelete] = useState<string | null>(null);
  /** Dialog de ajustes del tablero (renombrar / visibilidad / eliminar). */
  const searchParams = useSearchParams();
  const [settingsOpen, setSettingsOpen] = useState(
    searchParams?.get('settings') === 'open',
  );
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/b/${board.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: board.title });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1800);
      }
    } catch {
      // User canceló navigator.share o portapapeles bloqueado — silencioso
    }
  }, [board.id, board.title]);

  const utils = trpc.useUtils();
  const { presence } = useRealtimeBoard(board.id, viewerId);
  const createNode = trpc.node.create.useMutation({
    onSuccess: () => utils.node.list.invalidate({ boardId: board.id }),
  });
  const createConn = trpc.connection.create.useMutation();
  const updateNode = trpc.node.update.useMutation({
    onSuccess: (_data, vars) => {
      // Mantiene en sync los caches que lee el Inspector (tags, fields, etc.)
      utils.node.byId.invalidate({ boardId: board.id, id: vars.id });
      utils.node.list.invalidate({ boardId: board.id });
    },
  });
  const updatePositions = trpc.node.updatePositions.useMutation();
  const removeNode = trpc.node.remove.useMutation({
    onSuccess: () => utils.node.list.invalidate({ boardId: board.id }),
  });
  const removeConn = trpc.connection.remove.useMutation();

  const onNodesChange = useCallback((changes: Parameters<typeof applyNodeChanges>[0]) => {
    setNodes((nds) => applyNodeChanges(changes, nds) as Node<HiloNodeData>[]);
    // Persist position on drag stop — usa endpoint bulk para multi-select drag.
    // Filtra IDs temporales (tmp-*) que aún no están persistidos en la DB.
    const positions = changes.flatMap((ch) =>
      ch.type === 'position' && ch.dragging === false && ch.position && !ch.id.startsWith('tmp-')
        ? [{ id: ch.id, x: ch.position.x, y: ch.position.y }]
        : [],
    );
    if (positions.length > 0) {
      updatePositions.mutate({ boardId: board.id, positions });
    }
  }, [board.id, updatePositions]);

  const onEdgesChange = useCallback((changes: Parameters<typeof applyEdgeChanges>[0]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds) as Edge<HiloEdgeData>[]);
  }, []);

  /**
   * Aplica un patch a un nodo: actualiza el estado local del canvas (para que
   * el HiloNode re-renderice con los nuevos data) Y persiste el cambio en la DB.
   * Lo usa el Inspector cuando edita campos (foto, fields, title, etc).
   */
  const handleNodePatch = useCallback(
    (nodeId: string, patch: Record<string, unknown>) => {
      // 1) refleja inmediato en el canvas
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const merged: HiloNodeData = {
            ...(n.data as HiloNodeData),
            ...(typeof patch.title === 'string' ? { title: patch.title } : {}),
            ...(typeof patch.subtitle === 'string' || patch.subtitle === null
              ? { subtitle: (patch.subtitle as string | null) ?? undefined }
              : {}),
            ...(Array.isArray(patch.tags) ? { tags: patch.tags as string[] } : {}),
            ...(patch.fields !== undefined
              ? { fields: patch.fields as Record<string, unknown> }
              : {}),
          };
          return { ...n, data: merged };
        }),
      );
      // 2) persiste
      updateNode.mutate({ boardId: board.id, id: nodeId, patch });
    },
    [board.id, updateNode],
  );

  const onConnect = useCallback(
    (conn: { source: string | null; target: string | null }) => {
      if (!conn.source || !conn.target) return;
      if (conn.source === conn.target) return; // evita auto-conexiones
      // Evita duplicar la misma conexión
      const exists = edges.some(
        (e) =>
          (e.source === conn.source && e.target === conn.target) ||
          (e.source === conn.target && e.target === conn.source),
      );
      if (exists) return;
      const optimistic: Edge<HiloEdgeData> = {
        id: `tmp-${crypto.randomUUID()}`,
        source: conn.source,
        target: conn.target,
        type: 'hilo',
        data: { type: 'CUSTOM', verified: false, strength: 1, directional: true },
      };
      setEdges((eds) => [...eds, optimistic]);
      createConn.mutate(
        {
          boardId: board.id,
          fromNodeId: conn.source,
          toNodeId: conn.target,
          type: 'CUSTOM',
          directional: true,
          strength: 1,
          verified: false,
        },
        {
          onSuccess: (real) => {
            setEdges((eds) =>
              eds.map((e) => (e.id === optimistic.id ? { ...e, id: real.id } : e)),
            );
          },
        },
      );
    },
    [board.id, createConn, edges],
  );

  const handleCreateNode = useCallback(
    (type: NodeTypeKey, position?: { x: number; y: number }) => {
      const meta = NODE_TYPE_META[type];
      // Spawn near viewport center with a tiny random offset
      const x = position?.x ?? 80 + Math.random() * 360;
      const y = position?.y ?? 80 + Math.random() * 240;
      const optimisticId = `tmp-${crypto.randomUUID()}`;
      const optimistic: Node<HiloNodeData> = {
        id: optimisticId,
        type: 'hilo',
        position: { x, y },
        data: { type, title: `Nuevo ${meta.label.toLowerCase()}`, tags: [], status: 'APPROVED' },
      };
      setNodes((nds) => [...nds, optimistic]);
      createNode.mutate(
        {
          boardId: board.id,
          type,
          title: `Nuevo ${meta.label.toLowerCase()}`,
          tags: [],
          fields: {},
          x,
          y,
          width: 240,
          height: 160,
        },
        {
          onSuccess: (n) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === optimisticId ? { ...node, id: n.id } : node,
              ),
            );
            setSelected(n.id);
          },
          onError: () => {
            setNodes((nds) => nds.filter((node) => node.id !== optimisticId));
          },
        },
      );
    },
    [board.id, createNode],
  );

  /**
   * Elimina un nodo: lo retira del canvas, sus aristas conectadas, y persiste
   * el archivado en la DB. (Schema usa archive lógico — status: ARCHIVED.)
   */
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      // 1) Quita del canvas (nodo + aristas conectadas)
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      const edgesToRemove: string[] = [];
      setEdges((eds) =>
        eds.filter((e) => {
          const connected = e.source === nodeId || e.target === nodeId;
          if (connected && !e.id.startsWith('tmp-')) edgesToRemove.push(e.id);
          return !connected;
        }),
      );
      // 2) Cierra inspector si estaba abierto sobre ese nodo
      setSelected((s) => (s === nodeId ? null : s));
      // 3) Persiste si no era temporal
      if (!nodeId.startsWith('tmp-')) {
        removeNode.mutate({ boardId: board.id, id: nodeId });
      }
      // 4) Borra aristas reales en backend (cascade ya lo haría, pero lo hacemos explícito)
      for (const eid of edgesToRemove) {
        removeConn.mutate({ boardId: board.id, id: eid });
      }
    },
    [board.id, removeNode, removeConn],
  );

  /** Elimina una arista (conexión) sin tocar nodos. */
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      if (!edgeId.startsWith('tmp-')) {
        removeConn.mutate({ boardId: board.id, id: edgeId });
      }
    },
    [board.id, removeConn],
  );

  const handleAutoLayout = useCallback(() => {
    // Calcula nuevas posiciones una sola vez y persiste en bulk (sin setTimeout).
    setNodes((nds) => {
      const cols = Math.ceil(Math.sqrt(nds.length));
      const gap = 280;
      const next = nds.map((n, i) => ({
        ...n,
        position: {
          x: 60 + (i % cols) * gap,
          y: 60 + Math.floor(i / cols) * 220,
        },
      }));
      // Persiste en una sola request, ignorando IDs temporales
      const positions = next
        .filter((n) => !n.id.startsWith('tmp-'))
        .map((n) => ({ id: n.id, x: n.position.x, y: n.position.y }));
      if (positions.length > 0) {
        updatePositions.mutate({ boardId: board.id, positions });
      }
      return next;
    });
  }, [board.id, updatePositions]);

  // Atajos de teclado: N persona · 1-6 cambian tipo · C conectar · Del/Backspace eliminar
  useEffect(() => {
    if (readOnly) return;
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // No interceptar atajos cuando el foco está en inputs / textarea / contenteditable
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (target.isContentEditable) return;
      // Tampoco si hay un dialog/modal abierto (Radix usa role="dialog")
      if (target.closest('[role="dialog"]')) return;
      // Ni si el foco está dentro del Inspector (aside derecho)
      if (target.closest('aside')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Shift + 1..8 = tipos Cyber (matchea contra e.key porque Shift cambia el char)
      if (e.shiftKey && TYPE_BY_SHIFT_KEY[e.key]) {
        e.preventDefault();
        handleCreateNode(TYPE_BY_SHIFT_KEY[e.key]!);
        return;
      }
      // Letras: H, D, A, W, V, M, K, R = atajos directos cyber
      const lower = e.key.toLowerCase();
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleCreateNode('PERSON');
      } else if (TYPE_BY_KEY[e.key]) {
        e.preventDefault();
        handleCreateNode(TYPE_BY_KEY[e.key]!);
      } else if (TYPE_BY_LETTER[lower] && !e.shiftKey) {
        e.preventDefault();
        handleCreateNode(TYPE_BY_LETTER[lower]!);
      } else if (e.key === 'c' || e.key === 'C') {
        setConnectMode((v) => !v);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = nodes.filter((n) => n.selected);
        const selectedEdges = edges.filter((edge) => edge.selected);
        if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
        e.preventDefault();
        // Multi-select → modal de confirmación
        if (selectedNodes.length + selectedEdges.length > 1) {
          setPendingBulkDelete({
            nodeIds: selectedNodes.map((n) => n.id),
            edgeIds: selectedEdges.map((ed) => ed.id),
          });
          return;
        }
        // Único → ejecuta directo (Inspector ya pide confirmación si está abierto)
        for (const n of selectedNodes) handleDeleteNode(n.id);
        for (const ed of selectedEdges) handleDeleteEdge(ed.id);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCreateNode, handleDeleteNode, handleDeleteEdge, nodes, edges, readOnly]);

  // Escucha el evento "eliminar arista" disparado por el botón flotante de cada hilo
  useEffect(() => {
    if (readOnly) return;
    function handler(e: Event) {
      const detail = (e as CustomEvent<HiloEdgeDeleteDetail>).detail;
      if (!detail?.id) return;
      setPendingEdgeDelete(detail.id);
    }
    window.addEventListener(HILO_EDGE_DELETE_EVENT, handler);
    return () => window.removeEventListener(HILO_EDGE_DELETE_EVENT, handler);
  }, [readOnly]);

  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="flex h-10 items-center justify-between border-b border-border-subtle bg-bg-surface px-4">
        <div className="flex items-center gap-3 text-sm">
          <a href="/dashboard" className="text-text-muted hover:text-text-primary">
            ← Tableros
          </a>
          <span className="text-border-strong">/</span>
          <span className="font-semibold">{board.title}</span>
          <span className="text-text-muted">
            {nodes.length} nodos · {edges.length} conexiones
          </span>
          {readOnly && (
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
              solo lectura
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <PresenceAvatars users={presence} />
          {/* Si no es miembro y el board no es privado, ofrecemos el botón de unión */}
          {readOnly && viewerId && board.visibility !== 'PRIVATE' && (
            <JoinBoardButton boardId={board.id} boardTitle={board.title} />
          )}
          {!readOnly && (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-surface px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
              title="Ajustes del tablero"
            >
              <Settings size={13} />
              <span className="hidden sm:inline">Ajustes</span>
            </button>
          )}
          <Button size="sm" variant="secondary" onClick={handleShare}>
            {shareCopied ? '¡Copiado!' : 'Compartir'}
          </Button>
          {currentUser && (
            <>
              <NotificationBell />
              <UserMenu user={currentUser} />
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <HiloCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={(_, n) => setSelected(n.id)}
            readOnly={readOnly}
          />
          {!readOnly && (
            <Toolbar
              onCreateNode={handleCreateNode}
              onAutoLayout={handleAutoLayout}
              connectMode={connectMode}
              onToggleConnect={() => setConnectMode((v) => !v)}
            />
          )}
        </div>
        {selected && (
          <Inspector
            nodeId={selected}
            boardId={board.id}
            onClose={() => setSelected(null)}
            readOnly={readOnly}
            onPatch={handleNodePatch}
            onDelete={handleDeleteNode}
            fallbackData={
              nodes.find((n) => n.id === selected)?.data as HiloNodeData | undefined
            }
          />
        )}
      </div>

      <BoardSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        board={{
          id: board.id,
          title: board.title,
          description: board.description,
          visibility: board.visibility,
          contributionMode: board.contributionMode,
        }}
      />

      <ConfirmDialog
        open={pendingEdgeDelete !== null}
        onOpenChange={(o) => !o && setPendingEdgeDelete(null)}
        title="Eliminar conexión"
        description="Vas a eliminar este hilo entre dos nodos. Los nodos se mantendrán, solo se borra la conexión."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        tone="danger"
        onConfirm={() => {
          if (pendingEdgeDelete) handleDeleteEdge(pendingEdgeDelete);
        }}
      />

      <ConfirmDialog
        open={pendingBulkDelete !== null}
        onOpenChange={(o) => !o && setPendingBulkDelete(null)}
        title="Eliminar selección"
        description={
          pendingBulkDelete && (
            <>
              Se eliminarán <strong className="text-text-primary">{pendingBulkDelete.nodeIds.length}</strong> nodo(s)
              {' y '}
              <strong className="text-text-primary">{pendingBulkDelete.edgeIds.length}</strong> conexión(es). Esta
              acción no se puede deshacer.
            </>
          )
        }
        confirmLabel="Eliminar todo"
        cancelLabel="Cancelar"
        tone="danger"
        onConfirm={() => {
          if (!pendingBulkDelete) return;
          for (const id of pendingBulkDelete.nodeIds) handleDeleteNode(id);
          for (const id of pendingBulkDelete.edgeIds) handleDeleteEdge(id);
        }}
      />
    </div>
  );
}
