'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button, ConfirmDialog, Input } from '@hilo/ui';
import { trpc } from '@/lib/trpc';
import { X, Lock, Globe, Eye, Trash2, Check, Settings, Users } from 'lucide-react';
import { BoardMembersTab } from './BoardMembersTab';

type Visibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
type ContributionMode = 'CLOSED' | 'INVITE' | 'OPEN_PENDING' | 'OPEN_INSTANT';

const VISIBILITIES: Array<{ value: Visibility; label: string; Icon: typeof Lock; color: string }> = [
  { value: 'PRIVATE', label: 'Privado', Icon: Lock, color: '#94a3b8' },
  { value: 'UNLISTED', label: 'No listado', Icon: Eye, color: '#fbbf24' },
  { value: 'PUBLIC', label: 'Público', Icon: Globe, color: '#4ade80' },
];

const CONTRIBUTION_LABELS: Record<ContributionMode, string> = {
  CLOSED: 'Cerrado · solo miembros',
  INVITE: 'Por invitación',
  OPEN_PENDING: 'Abierto · revisión',
  OPEN_INSTANT: 'Abierto · instantáneo',
};

export interface BoardSettingsDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  board: {
    id: string;
    title: string;
    description: string | null;
    visibility: Visibility;
    contributionMode: ContributionMode;
  };
}

export function BoardSettingsDialog({ open, onOpenChange, board }: BoardSettingsDialogProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description ?? '');
  const [visibility, setVisibility] = useState<Visibility>(board.visibility);
  const [contributionMode, setContributionMode] = useState<ContributionMode>(board.contributionMode);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState<'general' | 'members'>('general');

  const update = trpc.board.update.useMutation({
    onSuccess: () => {
      setSuccess(true);
      utils.board.list.invalidate();
      router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    },
  });

  const remove = trpc.board.remove.useMutation({
    onSuccess: () => {
      router.push('/dashboard');
      router.refresh();
    },
  });

  const dirty =
    title !== board.title ||
    description !== (board.description ?? '') ||
    visibility !== board.visibility ||
    contributionMode !== board.contributionMode;

  const save = () => {
    update.mutate({
      boardId: board.id,
      patch: {
        title,
        description: description || null,
        visibility,
        contributionMode,
      },
    });
  };

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(7, 8, 11, 0.78)',
              backdropFilter: 'blur(4px)',
              animation: 'fadeIn 160ms ease-out',
            }}
          />
          <DialogPrimitive.Content
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 51,
              width: 'calc(100% - 32px)',
              maxWidth: '520px',
              maxHeight: 'calc(100vh - 64px)',
              overflow: 'auto',
              background: 'var(--color-bg-elevated, #232831)',
              border: '1px solid var(--color-border-strong, #3a4452)',
              borderRadius: 8,
              boxShadow: '0 16px 32px rgba(0,0,0,0.65), 0 6px 12px rgba(0,0,0,0.4)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              animation: 'modalIn 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-text-muted" />
                <DialogPrimitive.Title className="text-sm font-semibold">
                  Ajustes del tablero
                </DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Close className="text-text-muted hover:text-text-primary">
                <X size={16} />
              </DialogPrimitive.Close>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-subtle px-5">
              <TabButton active={tab === 'general'} onClick={() => setTab('general')}>
                <Settings size={12} />
                General
              </TabButton>
              <TabButton active={tab === 'members'} onClick={() => setTab('members')}>
                <Users size={12} />
                Miembros
              </TabButton>
            </div>

            {tab === 'members' ? (
              <div className="p-5">
                <BoardMembersTab boardId={board.id} />
              </div>
            ) : (
            <div className="space-y-5 p-5">
              {/* Detalles */}
              <FieldGroup label="Detalles">
                <Field label="Título">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
                </Field>
                <Field label="Descripción" hint={`${description.length}/2000`}>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                    rows={3}
                    className="w-full resize-none rounded-md border border-border-subtle bg-bg-canvas/60 px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-border-strong focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </Field>
              </FieldGroup>

              {/* Visibilidad */}
              <FieldGroup label="Visibilidad">
                <div className="grid grid-cols-3 gap-2">
                  {VISIBILITIES.map((v) => {
                    const active = visibility === v.value;
                    return (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => setVisibility(v.value)}
                        className={`flex flex-col items-center gap-1.5 rounded-md border px-3 py-3 text-xs font-medium transition-all ${
                          active
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border-subtle bg-bg-canvas/40 text-text-muted hover:border-border-strong hover:text-text-primary'
                        }`}
                      >
                        <v.Icon size={16} style={{ color: active ? undefined : v.color }} />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>

              {/* Contribución (sólo si no es privado) */}
              {visibility !== 'PRIVATE' && (
                <FieldGroup label="Modo de contribución">
                  <select
                    value={contributionMode}
                    onChange={(e) => setContributionMode(e.target.value as ContributionMode)}
                    className="w-full rounded-md border border-border-subtle bg-bg-canvas/60 px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-border-strong"
                  >
                    {(Object.keys(CONTRIBUTION_LABELS) as ContributionMode[]).map((k) => (
                      <option key={k} value={k}>
                        {CONTRIBUTION_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </FieldGroup>
              )}

              {/* Zona de peligro */}
              <FieldGroup label="Zona de peligro">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center gap-3 rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-left transition-colors hover:bg-danger/10"
                >
                  <Trash2 size={15} className="text-danger" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-danger">Eliminar tablero</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Borrará el tablero, todos sus nodos y conexiones. No se puede deshacer.
                    </p>
                  </div>
                </button>
              </FieldGroup>
            </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-5 py-3">
              <div className="text-xs">
                {update.error && <span className="text-danger">{update.error.message}</span>}
                {success && (
                  <span className="inline-flex items-center gap-1 text-success">
                    <Check size={12} /> Guardado
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <DialogPrimitive.Close asChild>
                  <Button variant="secondary" size="sm">
                    Cerrar
                  </Button>
                </DialogPrimitive.Close>
                <Button size="sm" disabled={!dirty || update.isPending} onClick={save}>
                  {update.isPending ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar tablero"
        description={
          <>
            Vas a eliminar <strong className="text-text-primary">"{board.title}"</strong>, todos sus
            nodos y conexiones. <strong>Esta acción no se puede deshacer.</strong>
          </>
        }
        confirmLabel={remove.isPending ? 'Eliminando…' : 'Eliminar tablero'}
        tone="danger"
        onConfirm={() => remove.mutate({ boardId: board.id })}
      />
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 font-typewriter text-[10px] uppercase tracking-[0.2em] transition-colors ${
        active ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-accent" />}
    </button>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-typewriter text-[10px] uppercase tracking-[0.2em] text-text-muted">
        {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-text-faded">{label}</span>
        {hint && <span className="text-[10px] text-text-faded">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
