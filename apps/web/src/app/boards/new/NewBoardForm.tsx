'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@hilo/ui';
import { trpc } from '@/lib/trpc';
import { Lock, Globe, Eye, ArrowLeft, Users, ShieldOff, MessageSquare, Zap } from 'lucide-react';

type Visibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
type ContributionMode = 'CLOSED' | 'INVITE' | 'OPEN_PENDING' | 'OPEN_INSTANT';

const VISIBILITY_OPTIONS: Array<{
  value: Visibility;
  label: string;
  Icon: typeof Lock;
  description: string;
  color: string;
}> = [
  {
    value: 'PRIVATE',
    label: 'Privado',
    Icon: Lock,
    description: 'Solo tú y miembros invitados.',
    color: '#94a3b8',
  },
  {
    value: 'UNLISTED',
    label: 'No listado',
    Icon: Eye,
    description: 'Cualquiera con el link puede verlo. No aparece en /explore.',
    color: '#fbbf24',
  },
  {
    value: 'PUBLIC',
    label: 'Público',
    Icon: Globe,
    description: 'Visible para todos en /explore. Aporta a tu ranking.',
    color: '#4ade80',
  },
];

const CONTRIBUTION_OPTIONS: Array<{
  value: ContributionMode;
  label: string;
  Icon: typeof Lock;
  description: string;
}> = [
  { value: 'CLOSED', label: 'Cerrado', Icon: ShieldOff, description: 'Solo miembros pueden editar.' },
  { value: 'INVITE', label: 'Por invitación', Icon: Users, description: 'Solo quienes invites.' },
  {
    value: 'OPEN_PENDING',
    label: 'Abierto · revisión',
    Icon: MessageSquare,
    description: 'Cualquiera propone, tú apruebas.',
  },
  {
    value: 'OPEN_INSTANT',
    label: 'Abierto · instantáneo',
    Icon: Zap,
    description: 'Verificados publican directo.',
  },
];

export function NewBoardForm() {
  const router = useRouter();
  const create = trpc.board.create.useMutation({
    onSuccess: (b) => router.push(`/b/${b.id}`),
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PRIVATE');
  const [contributionMode, setContributionMode] = useState<ContributionMode>('CLOSED');

  return (
    <>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={14} />
        Volver al dashboard
      </Link>

      <div className="mb-8">
        <p className="font-typewriter text-xs uppercase tracking-[0.3em] text-text-faded">
          Nueva investigación
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text-primary">
          Crear tablero
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Configura cómo arranca tu lienzo. Podrás cambiar todo después.
        </p>
      </div>

      <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ title, description: description || undefined, visibility, contributionMode });
          }}
          className="space-y-6"
        >
          {/* Básicos */}
          <Section title="Detalles básicos">
            <Field label="Título" required>
              <Input
                required
                placeholder="Ej: Caso Watergate"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                autoFocus
              />
            </Field>
            <Field label="Descripción" hint={`${description.length}/2000`}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                placeholder="Para qué es este tablero…"
                rows={3}
                className="w-full resize-none rounded-md border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-border-strong focus-visible:ring-2 focus-visible:ring-accent"
              />
            </Field>
          </Section>

          {/* Visibilidad */}
          <Section title="Visibilidad" description="Quién puede ver este tablero">
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  selected={visibility === opt.value}
                  onSelect={() => setVisibility(opt.value)}
                  Icon={opt.Icon}
                  label={opt.label}
                  description={opt.description}
                  color={opt.color}
                />
              ))}
            </div>
          </Section>

          {/* Contribución (sólo si no es privado) */}
          {visibility !== 'PRIVATE' && (
            <Section
              title="Contribuciones"
              description="Quién puede añadir o modificar nodos"
            >
              <div className="space-y-2">
                {CONTRIBUTION_OPTIONS.map((opt) => (
                  <RadioCard
                    key={opt.value}
                    selected={contributionMode === opt.value}
                    onSelect={() => setContributionMode(opt.value)}
                    Icon={opt.Icon}
                    label={opt.label}
                    description={opt.description}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-2">
            <Button asChild variant="secondary">
              <Link href="/dashboard">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={create.isPending || !title.trim()}>
              {create.isPending ? 'Creando…' : 'Crear tablero'}
            </Button>
          </div>

        {create.error && <p className="text-sm text-danger">{create.error.message}</p>}
      </form>
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-bg-surface/50 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {label} {required && <span className="text-accent">*</span>}
        </span>
        {hint && <span className="text-[10px] text-text-faded">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function RadioCard({
  selected,
  onSelect,
  Icon,
  label,
  description,
  color = '#9aa3b3',
}: {
  selected: boolean;
  onSelect: () => void;
  Icon: typeof Lock;
  label: string;
  description: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
        selected
          ? 'border-accent bg-accent/5'
          : 'border-border-subtle bg-bg-elevated/40 hover:border-border-strong hover:bg-bg-elevated'
      }`}
    >
      <div
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
        style={{
          background: selected ? 'rgba(239,68,68,0.15)' : `${color}1a`,
          color: selected ? '#ef4444' : color,
        }}
      >
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="mt-0.5 text-xs text-text-muted">{description}</p>
      </div>
      <span
        className={`mt-1 h-4 w-4 flex-shrink-0 rounded-full border-2 ${
          selected ? 'border-accent bg-accent' : 'border-border-strong'
        }`}
      >
        {selected && (
          <span className="block h-full w-full rounded-full border-2 border-bg-elevated" />
        )}
      </span>
    </button>
  );
}
