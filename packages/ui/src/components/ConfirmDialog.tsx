'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button.js';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" (rojo, default), "primary" (rojo accent), "neutral". */
  tone?: 'danger' | 'primary' | 'neutral';
  /** Llamado al confirmar. Cierra el modal automáticamente después. */
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const iconColor =
    tone === 'danger' ? '#ef4444' : tone === 'primary' ? '#ef4444' : '#9aa3b3';
  const iconBg =
    tone === 'danger' || tone === 'primary'
      ? 'rgba(239, 68, 68, 0.12)'
      : 'rgba(154, 163, 179, 0.12)';

  return (
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
            maxWidth: '420px',
            background: 'var(--color-bg-elevated, #232831)',
            border: '1px solid var(--color-border-strong, #3a4452)',
            borderRadius: 8,
            padding: '20px',
            boxShadow:
              '0 16px 32px rgba(0, 0, 0, 0.65), 0 6px 12px rgba(0, 0, 0, 0.4)',
            color: 'var(--color-text-primary, #e8eaed)',
            outline: 'none',
            animation: 'modalIn 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 9999,
                background: iconBg,
              }}
            >
              <AlertTriangle size={18} color={iconColor} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <DialogPrimitive.Title
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #e8eaed)',
                  margin: 0,
                }}
              >
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'var(--color-text-muted, #9aa3b3)',
                  }}
                >
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 20,
            }}
          >
            <DialogPrimitive.Close asChild>
              <Button variant="secondary" size="sm">
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
            <Button
              ref={confirmRef}
              variant={tone === 'neutral' ? 'primary' : 'danger'}
              size="sm"
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
