'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ConfirmDialog } from '@hilo/ui';
import {
  MoreVertical,
  Settings,
  Trash2,
  ExternalLink,
  Link as LinkIcon,
  Globe,
  Lock,
  Eye,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

export interface BoardCardActionsProps {
  boardId: string;
  boardTitle: string;
  visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
}

export function BoardCardActions({ boardId, boardTitle, visibility }: BoardCardActionsProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = trpc.board.update.useMutation({
    onSuccess: () => {
      utils.board.list.invalidate();
      router.refresh();
    },
  });

  const remove = trpc.board.remove.useMutation({
    onSuccess: () => {
      setConfirmDelete(false);
      utils.board.list.invalidate();
      router.refresh();
    },
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/b/${boardId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const switchVisibility = (next: 'PRIVATE' | 'UNLISTED' | 'PUBLIC') => {
    if (next === visibility) return;
    update.mutate({ boardId, patch: { visibility: next } });
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-faded opacity-0 transition-all hover:bg-bg-canvas hover:text-text-primary group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label="Más acciones"
          >
            <MoreVertical size={14} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            onClick={(e) => e.stopPropagation()}
            className="z-50 w-56 overflow-hidden rounded-lg border border-border-strong bg-bg-elevated shadow-3"
            style={{ animation: 'fadeIn 120ms ease-out' }}
          >
            <div className="p-1">
              <Item
                icon={<ExternalLink size={13} />}
                label="Abrir tablero"
                onClick={() => router.push(`/b/${boardId}`)}
              />
              <Item
                icon={<LinkIcon size={13} />}
                label={copied ? 'Copiado ✓' : 'Copiar link'}
                onClick={copyLink}
              />
              <Item
                icon={<Settings size={13} />}
                label="Ajustes…"
                onClick={() => router.push(`/b/${boardId}?settings=open`)}
              />
            </div>

            <DropdownMenu.Separator className="h-px bg-border-subtle" />

            <div className="p-1">
              <p className="px-2 py-1 font-typewriter text-[9px] uppercase tracking-[0.2em] text-text-faded">
                Cambiar visibilidad
              </p>
              <VisibilityItem
                icon={<Lock size={13} />}
                label="Privado"
                active={visibility === 'PRIVATE'}
                color="#94a3b8"
                onClick={() => switchVisibility('PRIVATE')}
              />
              <VisibilityItem
                icon={<Eye size={13} />}
                label="No listado"
                active={visibility === 'UNLISTED'}
                color="#fbbf24"
                onClick={() => switchVisibility('UNLISTED')}
              />
              <VisibilityItem
                icon={<Globe size={13} />}
                label="Público"
                active={visibility === 'PUBLIC'}
                color="#4ade80"
                onClick={() => switchVisibility('PUBLIC')}
              />
            </div>

            <DropdownMenu.Separator className="h-px bg-border-subtle" />

            <div className="p-1">
              <Item
                icon={<Trash2 size={13} />}
                label="Eliminar tablero"
                danger
                onClick={() => setConfirmDelete(true)}
              />
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar tablero"
        description={
          <>
            Vas a eliminar <strong className="text-text-primary">"{boardTitle}"</strong>, todos sus
            nodos y conexiones. <strong>Esta acción no se puede deshacer.</strong>
          </>
        }
        confirmLabel={remove.isPending ? 'Eliminando…' : 'Eliminar'}
        tone="danger"
        onConfirm={() => remove.mutate({ boardId })}
      />
    </>
  );
}

function Item({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors ${
        danger
          ? 'text-danger hover:bg-danger/10 focus:bg-danger/10'
          : 'text-text-primary hover:bg-bg-surface focus:bg-bg-surface'
      }`}
    >
      <span className={danger ? '' : 'text-text-muted'}>{icon}</span>
      {label}
    </DropdownMenu.Item>
  );
}

function VisibilityItem({
  icon,
  label,
  active,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <DropdownMenu.Item
      onSelect={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-bg-surface focus:bg-bg-surface ${
        active ? 'text-text-primary' : 'text-text-muted'
      }`}
    >
      <span style={{ color: active ? color : undefined }}>{icon}</span>
      <span className="flex-1">{label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
    </DropdownMenu.Item>
  );
}
