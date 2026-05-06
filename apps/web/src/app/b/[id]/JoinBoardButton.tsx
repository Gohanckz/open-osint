'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@hilo/ui';
import { trpc } from '@/lib/trpc';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { UserPlus, Check, X, Clock, Mail } from 'lucide-react';
import { useT } from '@/i18n/client';

export interface JoinBoardButtonProps {
  boardId: string;
  boardTitle: string;
}

export function JoinBoardButton({ boardId, boardTitle }: JoinBoardButtonProps) {
  const t = useT();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const { data: membership, isLoading } = trpc.board.myMembership.useQuery({ boardId });

  const requestJoin = trpc.board.requestJoin.useMutation({
    onSuccess: () => {
      utils.board.myMembership.invalidate({ boardId });
      setOpen(false);
      setMessage('');
    },
  });

  const respond = trpc.board.respondJoinRequest.useMutation({
    onSuccess: () => {
      utils.board.myMembership.invalidate({ boardId });
      router.refresh();
    },
  });

  const cancel = trpc.board.cancelJoinRequest.useMutation({
    onSuccess: () => {
      utils.board.myMembership.invalidate({ boardId });
    },
  });

  if (isLoading) {
    return (
      <span className="inline-flex h-8 w-32 animate-pulse rounded-md bg-bg-elevated" aria-hidden />
    );
  }

  // Ya es miembro → no mostramos nada
  if (membership?.member) return null;

  const req = membership?.request;

  // Si hay invitación pendiente del owner → botones aceptar/rechazar
  if (req && req.status === 'PENDING' && req.direction === 'OWNER_INVITE') {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-md border border-info/30 bg-info/10 px-2 py-1 font-typewriter text-[10px] uppercase tracking-wider text-info sm:inline-flex">
          <Mail size={11} />
          {t.membership.invitation}
        </span>
        <Button
          size="sm"
          onClick={() => respond.mutate({ requestId: req.id, accept: true })}
          disabled={respond.isPending}
          className="gap-1.5"
        >
          <Check size={13} />
          {t.membership.accept}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => respond.mutate({ requestId: req.id, accept: false })}
          disabled={respond.isPending}
        >
          {t.membership.reject}
        </Button>
      </div>
    );
  }

  // Solicitud propia pendiente → mostrar estado y opción cancelar
  if (req && req.status === 'PENDING' && req.direction === 'USER_REQUEST') {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs text-warning">
          <Clock size={12} />
          {t.membership.requestPending}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => cancel.mutate({ requestId: req.id })}
          disabled={cancel.isPending}
          className="gap-1.5 text-text-muted"
        >
          <X size={13} />
          {t.membership.cancelRequest}
        </Button>
      </div>
    );
  }

  // Botón "Solicitar unirme"
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <UserPlus size={13} />
        {t.membership.requestJoin}
      </Button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(7,8,11,0.78)',
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
              maxWidth: '440px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 16px 32px rgba(0,0,0,0.65)',
              outline: 'none',
              animation: 'modalIn 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <DialogPrimitive.Title className="text-base font-semibold text-text-primary">
              {t.membership.requestJoinTitle.replace('{board}', boardTitle)}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1 text-sm text-text-muted">
              {t.membership.requestJoinDesc}
            </DialogPrimitive.Description>

            <label className="mt-4 block">
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                {t.membership.messageOptional}
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                placeholder={t.membership.messagePlaceholder}
                rows={3}
                className="mt-1 w-full resize-none rounded-md border border-border-subtle bg-bg-canvas/60 px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong focus-visible:ring-2 focus-visible:ring-accent"
              />
              <span className="mt-1 block text-right text-[10px] text-text-faded">
                {message.length}/500
              </span>
            </label>

            {requestJoin.error && (
              <p className="mt-3 text-sm text-danger">{requestJoin.error.message}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <DialogPrimitive.Close asChild>
                <Button variant="secondary" size="sm">
                  {t.membership.cancel}
                </Button>
              </DialogPrimitive.Close>
              <Button
                size="sm"
                disabled={requestJoin.isPending}
                onClick={() => requestJoin.mutate({ boardId, message: message || undefined })}
              >
                {requestJoin.isPending ? t.membership.sending : t.membership.send}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
