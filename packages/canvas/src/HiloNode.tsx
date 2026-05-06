'use client';

import { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_TYPE_META } from '@hilo/shared';
import {
  Paperclip,
  MessageCircle,
  User,
  MapPin,
  Server,
  Globe,
  AtSign,
  Wallet,
  Bug,
  AlertTriangle,
  KeyRound,
  Network,
} from 'lucide-react';
import type { HiloNodeData } from './types.js';

/** Hash determinista (string -> int) para rotación estable por nodo. */
function hashRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 50) - 25) / 10;
}

/** Trunca un hash o address para visual ej. 0x4a3f…b91c */
function truncMid(s: string, head = 6, tail = 4): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function HiloNodeBase({ id, data, selected }: NodeProps) {
  const node = data as HiloNodeData;
  const meta = NODE_TYPE_META[node.type];
  const color = node.color ?? meta.color;

  // Categoría: OSINT mantiene polaroid + rotación; CYBER es ficha técnica plana
  const isCyber = meta.category === 'cyber';

  // Rotación: hash automático para OSINT, sin rotación para CYBER (a menos que sea explícita)
  const manualRot =
    typeof node.fields?.rotation === 'number' ? (node.fields.rotation as number) : null;
  const rotation = useMemo(
    () => (manualRot !== null ? manualRot : isCyber ? 0 : hashRotation(id)),
    [id, manualRot, isCyber],
  );

  const variantClass = `hilo-node--${node.type.toLowerCase()}`;
  const categoryClass = isCyber ? 'hilo-node--cyber' : 'hilo-node--osint';
  const className = [
    'hilo-node',
    categoryClass,
    variantClass,
    selected && 'selected',
    node.status === 'PENDING' && 'pending',
  ]
    .filter(Boolean)
    .join(' ');

  // Color de texto custom (para mejorar contraste). Si se define, anula el por defecto.
  const textColor =
    typeof node.fields?.textColor === 'string' ? (node.fields.textColor as string) : null;

  const style = {
    '--node-rotation': `${rotation}deg`,
    '--type-color': color,
    ...(textColor ? { '--node-text-color': textColor, color: textColor } : {}),
  } as React.CSSProperties;

  // Visibilidad de elementos en la tarjeta (controlado desde Inspector)
  const display = (node.fields?.display ?? {}) as Record<string, boolean>;
  const showSubtitle = display.subtitle !== false;
  const showTags = display.tags !== false;
  const showAttachments = display.attachments !== false;
  const showPhoto = display.photo !== false;
  const showStamp = display.stamp !== false;
  const showType = display.type !== false;

  // Foto de PERSON / avatar de ACCOUNT
  const photoUrl =
    typeof node.fields?.photoUrl === 'string' ? (node.fields.photoUrl as string) : null;

  // Cuenta de archivos adjuntos almacenada en fields.attachments
  const attachmentsCount = Array.isArray(node.fields?.attachments)
    ? (node.fields.attachments as unknown[]).length
    : (node.attachmentsCount ?? 0);

  return (
    <div className={className} style={style}>
      {/* Tachuela polaroid SOLO para nodos OSINT */}
      {!isCyber && (
        <span className="hilo-node__pin" aria-hidden="true">
          <span className="hilo-node__pin-shadow" />
          <span className="hilo-node__pin-head" />
        </span>
      )}

      {/* Handles top */}
      <Handle id="t" type="target" position={Position.Top} className="hilo-node__handle hilo-node__handle--top" />
      <Handle id="ts" type="source" position={Position.Top} className="hilo-node__handle hilo-node__handle--top" />

      {/* Cuerpo específico por tipo */}
      {isCyber ? (
        <CyberBody node={node} color={color} />
      ) : (
        <OsintBody
          node={node}
          color={color}
          photoUrl={photoUrl}
          showPhoto={showPhoto}
          showStamp={showStamp}
        />
      )}

      {/* Etiqueta de tipo (común a ambos) */}
      {showType && (
        <div className="hilo-node__type">
          <span className="hilo-node__type-dot" />
          {meta.label}
        </div>
      )}

      <div className="hilo-node__title" style={textColor ? { color: textColor } : undefined}>
        {node.title}
      </div>
      {showSubtitle && node.subtitle && (
        <div
          className="hilo-node__subtitle"
          style={textColor ? { color: textColor, opacity: 0.78 } : undefined}
        >
          {node.subtitle}
        </div>
      )}

      {((showAttachments && attachmentsCount) ||
        node.commentsCount ||
        (showTags && node.tags?.length)) && (
        <div className="hilo-node__meta">
          {showAttachments && attachmentsCount ? (
            <span className="inline-flex items-center gap-1">
              <Paperclip size={10} /> {attachmentsCount}
            </span>
          ) : null}
          {node.commentsCount ? (
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={10} /> {node.commentsCount}
            </span>
          ) : null}
          {showTags && node.tags?.length ? (
            <span className="truncate font-handwritten" style={{ fontSize: 13 }}>
              #{node.tags.slice(0, 2).join(' #')}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   OSINT body (lo que ya teníamos)
   ========================================================================== */

function OsintBody({
  node,
  photoUrl,
  showPhoto,
  showStamp,
}: {
  node: HiloNodeData;
  color: string;
  photoUrl: string | null;
  showPhoto: boolean;
  showStamp: boolean;
}) {
  return (
    <>
      {node.type === 'EVIDENCE' && showStamp && <span className="hilo-node__stamp">Evidencia</span>}

      {node.type === 'PERSON' && showPhoto && (
        <div className="hilo-node__photo">
          {photoUrl ? (
            <img src={photoUrl} alt={node.title} className="hilo-node__photo-img" />
          ) : (
            <div className="hilo-node__photo-placeholder">
              <User size={28} strokeWidth={1.2} />
              <span>SIN FOTO</span>
            </div>
          )}
        </div>
      )}

      {node.type === 'LOCATION' && (
        <div className="absolute right-2 top-2 text-[var(--color-pin-red)]">
          <MapPin size={14} fill="currentColor" />
        </div>
      )}
    </>
  );
}

/* =============================================================================
   CYBER body — render específico por tipo de nodo cyber
   ========================================================================== */

function CyberBody({ node, color }: { node: HiloNodeData; color: string }) {
  const f = (node.fields ?? {}) as Record<string, unknown>;
  switch (node.type) {
    case 'HOST':
      return <HostBody fields={f} color={color} />;
    case 'DOMAIN':
      return <DomainBody fields={f} color={color} />;
    case 'ACCOUNT':
      return <AccountBody fields={f} color={color} />;
    case 'WALLET':
      return <WalletBody fields={f} color={color} />;
    case 'VULNERABILITY':
      return <VulnBody fields={f} color={color} />;
    case 'MALWARE':
      return <MalwareBody fields={f} color={color} />;
    case 'CREDENTIAL':
      return <CredentialBody fields={f} color={color} />;
    case 'NETWORK':
      return <NetworkBody fields={f} color={color} />;
    default:
      return null;
  }
}

function CyberHeader({ icon, color }: { icon: React.ReactNode; color: string }) {
  return (
    <div className="hilo-node__cyber-header" style={{ borderColor: color }}>
      <span className="hilo-node__cyber-icon" style={{ background: `${color}1f`, color }}>
        {icon}
      </span>
    </div>
  );
}

function HostBody({ fields, color }: { fields: Record<string, unknown>; color: string }) {
  const ip = (fields.ipv4 as string) || (fields.ipv6 as string) || '—';
  const isOnline = fields.isOnline === true;
  const ports = Array.isArray(fields.openPorts) ? (fields.openPorts as unknown[]) : [];
  return (
    <>
      <CyberHeader icon={<Server size={14} />} color={color} />
      <div className="hilo-node__cyber-mono hilo-node__host-ip">
        {ip}
        <span
          className="hilo-node__status-dot"
          style={{ background: isOnline ? '#10b981' : '#6b7280' }}
          title={isOnline ? 'online' : 'offline'}
        />
      </div>
      {(fields.os || ports.length > 0) && (
        <div className="hilo-node__cyber-row">
          {fields.os && <span className="hilo-node__chip">{fields.os as string}</span>}
          {ports.length > 0 && (
            <span className="hilo-node__chip" title="Puertos abiertos">
              {ports.slice(0, 4).join(' · ')}
              {ports.length > 4 ? ` +${ports.length - 4}` : ''}
            </span>
          )}
        </div>
      )}
    </>
  );
}

function DomainBody({ fields, color }: { fields: Record<string, unknown>; color: string }) {
  const name = (fields.name as string) || '';
  return (
    <>
      <CyberHeader icon={<Globe size={14} />} color={color} />
      {name && <div className="hilo-node__cyber-mono hilo-node__domain-name">{name}</div>}
      {fields.registrar !== undefined && (
        <div className="hilo-node__cyber-row">
          <span className="hilo-node__chip">{fields.registrar as string}</span>
        </div>
      )}
      <span className="hilo-node__cyber-stamp">WHOIS</span>
    </>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1d9bf0',
  github: '#e8eaed',
  telegram: '#229ED9',
  discord: '#5865F2',
  reddit: '#FF4500',
  mastodon: '#6364FF',
  instagram: '#E4405F',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  tiktok: '#fe2c55',
  youtube: '#FF0000',
  matrix: '#00ad94',
};

function AccountBody({ fields, color }: { fields: Record<string, unknown>; color: string }) {
  const platform = (fields.platform as string) || 'other';
  const handle = (fields.handle as string) || '';
  const platformColor = PLATFORM_COLORS[platform.toLowerCase()] ?? color;
  const photoUrl = typeof fields.photoUrl === 'string' ? (fields.photoUrl as string) : null;
  return (
    <>
      <div className="hilo-node__account-band" style={{ background: platformColor }}>
        <span className="hilo-node__cyber-mono">{platform.toUpperCase()}</span>
        {fields.verified === true && <span className="hilo-node__verified-tick">✓</span>}
      </div>
      <div className="hilo-node__account-handle">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="hilo-node__account-avatar" />
        ) : (
          <span className="hilo-node__account-avatar hilo-node__account-avatar--placeholder">
            <AtSign size={12} />
          </span>
        )}
        <span className="hilo-node__cyber-mono truncate">@{handle || '—'}</span>
      </div>
    </>
  );
}

const CHAIN_SYMBOL: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  TRX: 'Ƭ',
  BSC: 'Ⓑ',
  SOL: '◎',
  XMR: 'ɱ',
  DOGE: 'Ð',
  LTC: 'Ł',
  XRP: '✕',
  ADA: '₳',
  POLYGON: '⬡',
  OTHER: '◯',
};

function WalletBody({ fields, color }: { fields: Record<string, unknown>; color: string }) {
  const chain = ((fields.chain as string) || 'OTHER').toUpperCase();
  const address = (fields.address as string) || '';
  const symbol = CHAIN_SYMBOL[chain] ?? '◯';
  return (
    <>
      <div className="hilo-node__wallet-header">
        <span className="hilo-node__wallet-chain" style={{ color }}>
          {symbol}
        </span>
        <span className="hilo-node__cyber-mono hilo-node__wallet-chain-name">{chain}</span>
        <Wallet size={12} className="ml-auto opacity-60" />
      </div>
      {address && (
        <div className="hilo-node__cyber-mono hilo-node__wallet-address" title={address}>
          {truncMid(address, 8, 6)}
        </div>
      )}
      {fields.label !== undefined && (
        <span className="hilo-node__chip hilo-node__chip--neutral">{fields.label as string}</span>
      )}
    </>
  );
}

const SEVERITY_META: Record<string, { color: string; label: string }> = {
  info: { color: '#6b7280', label: 'INFO' },
  low: { color: '#3b82f6', label: 'LOW' },
  medium: { color: '#fbbf24', label: 'MED' },
  high: { color: '#f97316', label: 'HIGH' },
  critical: { color: '#dc2626', label: 'CRIT' },
};

function VulnBody({ fields, color }: { fields: Record<string, unknown>; color: string }) {
  const cve = (fields.cve as string) || '';
  const severity = ((fields.severity as string) || 'info').toLowerCase();
  const cvss = typeof fields.cvss === 'number' ? (fields.cvss as number) : null;
  const sev = SEVERITY_META[severity] ?? SEVERITY_META.info!;
  return (
    <>
      <CyberHeader icon={<Bug size={14} />} color={color} />
      <div className="hilo-node__vuln-row">
        <span className="hilo-node__vuln-severity" style={{ background: sev.color }}>
          {sev.label}
        </span>
        {cvss !== null && (
          <span className="hilo-node__cyber-mono hilo-node__vuln-cvss">
            CVSS <strong>{cvss.toFixed(1)}</strong>
          </span>
        )}
      </div>
      {cve && <div className="hilo-node__cyber-mono hilo-node__vuln-cve">{cve}</div>}
      {fields.exploitAvailable === true && (
        <span className="hilo-node__cyber-stamp hilo-node__cyber-stamp--danger">PoC</span>
      )}
    </>
  );
}

function MalwareBody({ fields, color }: { fields: Record<string, unknown>; color: string }) {
  const family = (fields.family as string) || 'Unknown';
  const sha256 = (fields.sha256 as string) || '';
  const malwareType = (fields.malwareType as string) || '';
  return (
    <>
      <CyberHeader icon={<AlertTriangle size={14} />} color={color} />
      <div className="hilo-node__malware-family">{family}</div>
      {malwareType && (
        <span className="hilo-node__chip hilo-node__chip--danger">{malwareType}</span>
      )}
      {sha256 && (
        <div className="hilo-node__cyber-mono hilo-node__malware-hash" title={sha256}>
          {truncMid(sha256, 10, 8)}
        </div>
      )}
    </>
  );
}

function CredentialBody({ fields, color }: { fields: Record<string, unknown>; color: string }) {
  const login = (fields.login as string) || '';
  const breach = (fields.breach as string) || '';
  return (
    <>
      <CyberHeader icon={<KeyRound size={14} />} color={color} />
      <div className="hilo-node__cyber-mono hilo-node__credential-login">
        {login || '—'}
      </div>
      <div className="hilo-node__cyber-mono hilo-node__credential-redacted">
        ••••••••••••
      </div>
      {breach && (
        <span className="hilo-node__chip hilo-node__chip--danger">{breach}</span>
      )}
      <span className="hilo-node__cyber-stamp hilo-node__cyber-stamp--danger">BREACH</span>
    </>
  );
}

function NetworkBody({ fields, color }: { fields: Record<string, unknown>; color: string }) {
  const cidr = (fields.cidr as string) || '';
  const asn = (fields.asn as string) || '';
  const country = (fields.country as string) || '';
  return (
    <>
      <CyberHeader icon={<Network size={14} />} color={color} />
      {cidr && <div className="hilo-node__cyber-mono hilo-node__network-cidr">{cidr}</div>}
      <div className="hilo-node__cyber-row">
        {asn && <span className="hilo-node__chip">AS{asn}</span>}
        {country && <span className="hilo-node__chip hilo-node__chip--neutral">{country}</span>}
      </div>
    </>
  );
}

export const HiloNode = memo(HiloNodeBase);
