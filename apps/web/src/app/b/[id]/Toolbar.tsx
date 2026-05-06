'use client';

import { useState } from 'react';
import {
  Building2,
  Calendar,
  FileText,
  MapPin,
  Shapes,
  User,
  Server,
  Globe,
  AtSign,
  Wallet,
  Bug,
  AlertTriangle,
  KeyRound,
  Network,
  ChevronUp,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@hilo/ui';
import { NODE_TYPE_META, type NodeTypeKey } from '@hilo/shared';

const ICONS: Record<NodeTypeKey, React.ComponentType<{ size?: number }>> = {
  PERSON: User,
  COMPANY: Building2,
  EVENT: Calendar,
  EVIDENCE: FileText,
  LOCATION: MapPin,
  CUSTOM: Shapes,
  HOST: Server,
  DOMAIN: Globe,
  ACCOUNT: AtSign,
  WALLET: Wallet,
  VULNERABILITY: Bug,
  MALWARE: AlertTriangle,
  CREDENTIAL: KeyRound,
  NETWORK: Network,
};

const OSINT_ORDER: NodeTypeKey[] = ['PERSON', 'COMPANY', 'EVENT', 'EVIDENCE', 'LOCATION', 'CUSTOM'];
const CYBER_ORDER: NodeTypeKey[] = [
  'HOST',
  'DOMAIN',
  'ACCOUNT',
  'WALLET',
  'VULNERABILITY',
  'MALWARE',
  'CREDENTIAL',
  'NETWORK',
];

export function Toolbar({
  onCreateNode,
  onAutoLayout,
  connectMode,
  onToggleConnect,
}: {
  onCreateNode: (type: NodeTypeKey) => void;
  onAutoLayout?: () => void;
  connectMode?: boolean;
  onToggleConnect?: () => void;
}) {
  const [cyberOpen, setCyberOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={250}>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex flex-col items-center gap-2">
        {/* Sub-bar de tipos cyber (slide-up) */}
        {cyberOpen && (
          <div
            className="pointer-events-auto flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated p-1 shadow-3 backdrop-blur"
            style={{ animation: 'slideUpFade 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <span className="ml-2 mr-1 font-typewriter text-[9px] uppercase tracking-[0.25em] text-text-muted">
              Cyber
            </span>
            {CYBER_ORDER.map((t, i) => {
              const Icon = ICONS[t];
              const meta = NODE_TYPE_META[t];
              return (
                <Tooltip key={t}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onCreateNode(t)}
                      className="group relative flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
                      aria-label={`Crear ${meta.label}`}
                    >
                      <span
                        className="absolute h-1.5 w-1.5 translate-x-3 -translate-y-3 rounded-full"
                        style={{ background: meta.color }}
                      />
                      <Icon size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {meta.label}
                    <span className="ml-1 text-text-muted">· {meta.description}</span>
                    {i < 8 && (
                      <span className="ml-1 text-text-muted">
                        · <kbd className="font-mono">Shift+{i + 1}</kbd>
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Barra principal */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated p-1 shadow-2 backdrop-blur">
          <span className="ml-2 mr-1 font-typewriter text-[9px] uppercase tracking-[0.25em] text-text-muted">
            OSINT
          </span>
          {OSINT_ORDER.map((t, i) => {
            const Icon = ICONS[t];
            const meta = NODE_TYPE_META[t];
            return (
              <Tooltip key={t}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onCreateNode(t)}
                    className="group relative flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
                    aria-label={`Crear ${meta.label}`}
                  >
                    <span
                      className="absolute h-1.5 w-1.5 translate-x-3 -translate-y-3 rounded-full"
                      style={{ background: meta.color }}
                    />
                    <Icon size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {meta.label} <span className="text-text-muted">· {i + 1}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}

          <span className="mx-1 h-6 w-px bg-border-subtle" />

          {/* Toggle Cyber */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCyberOpen((v) => !v)}
                className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                  cyberOpen
                    ? 'bg-bg-surface text-text-primary'
                    : 'text-text-muted hover:bg-bg-surface hover:text-text-primary'
                }`}
                aria-expanded={cyberOpen}
                aria-label="Cyber nodes"
              >
                <ShieldAlert size={14} />
                Cyber
                <ChevronUp
                  size={11}
                  className={`transition-transform ${cyberOpen ? '' : 'rotate-180'}`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {cyberOpen ? 'Ocultar tipos cyber' : 'Hosts, dominios, wallets, CVEs, malware…'}
            </TooltipContent>
          </Tooltip>

          <span className="mx-1 h-6 w-px bg-border-subtle" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleConnect}
                className={`flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors ${
                  connectMode
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:bg-bg-surface hover:text-text-primary'
                }`}
              >
                <span className="text-base leading-none">↗</span>
                Conectar
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Arrastra de un nodo a otro · tecla <kbd className="font-mono">C</kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAutoLayout}
                className="flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
              >
                <Sparkles size={13} /> Auto layout
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Reorganizar nodos en grid</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Hint />
    </TooltipProvider>
  );
}

function Hint() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="pointer-events-auto absolute left-4 top-14 z-30 max-w-xs rounded-md border border-border-subtle bg-bg-elevated p-3 text-xs text-text-muted shadow-1">
      <div className="mb-1 font-semibold text-text-primary">Cómo usar el tablero</div>
      <ul className="space-y-1">
        <li>• Click en cualquier icono de la barra inferior para crear un nodo.</li>
        <li>
          • OSINT: <kbd className="rounded bg-bg-surface px-1 font-mono">1-6</kbd>. Cyber:{' '}
          <kbd className="rounded bg-bg-surface px-1 font-mono">Shift+1-8</kbd>.
        </li>
        <li>
          • Atajo: <kbd className="rounded bg-bg-surface px-1 font-mono">N</kbd> persona ·{' '}
          <kbd className="rounded bg-bg-surface px-1 font-mono">H</kbd> host ·{' '}
          <kbd className="rounded bg-bg-surface px-1 font-mono">D</kbd> domain.
        </li>
        <li>• Pasa el mouse sobre un nodo y arrastra el puntito para conectar.</li>
        <li>• Doble click sobre un nodo abre el inspector.</li>
      </ul>
      <button onClick={() => setHidden(true)} className="mt-2 text-accent hover:underline">
        Entendido
      </button>
    </div>
  );
}
