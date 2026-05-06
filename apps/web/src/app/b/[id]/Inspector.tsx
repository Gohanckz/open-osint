'use client';

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button, ConfirmDialog, Input, Tag } from '@hilo/ui';
import { NODE_TYPE_META } from '@hilo/shared';
import { X, Upload, Paperclip, Trash2, Image as ImageIcon, FileText, RotateCcw, Eye, EyeOff } from 'lucide-react';

type Attachment = { name: string; mime: string; size: number; dataUrl: string };

type Fields = Record<string, unknown>;

/** Datos mínimos del nodo que conoce el canvas (mientras la query no carga). */
type FallbackNode = {
  type: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  fields?: Fields;
};

const TYPE_FIELDS: Record<string, Array<{ key: string; label: string; type?: string; placeholder?: string }>> = {
  PERSON: [
    { key: 'firstName', label: 'Nombre', placeholder: 'Juan' },
    { key: 'lastName', label: 'Apellido', placeholder: 'Pérez' },
    { key: 'aliases', label: 'Alias', placeholder: 'Comma, separated' },
    { key: 'dob', label: 'Fecha de nacimiento', type: 'date' },
    { key: 'docId', label: 'Documento de identidad' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'persona@email.com' },
    { key: 'phone', label: 'Teléfono', type: 'tel', placeholder: '+34 600 000 000' },
    { key: 'address', label: 'Dirección', placeholder: 'Calle, número' },
    { key: 'city', label: 'Ciudad' },
    { key: 'country', label: 'País' },
    { key: 'occupation', label: 'Ocupación', placeholder: 'Ingeniero, abogado...' },
  ],
  COMPANY: [
    { key: 'legalName', label: 'Razón social' },
    { key: 'taxId', label: 'CIF / NIF / EIN' },
    { key: 'founded', label: 'Fundación', type: 'date' },
    { key: 'jurisdiction', label: 'Jurisdicción' },
    { key: 'sector', label: 'Sector' },
    { key: 'website', label: 'Web', type: 'url', placeholder: 'https://' },
    { key: 'address', label: 'Dirección' },
  ],
  EVENT: [
    { key: 'date', label: 'Fecha', type: 'date' },
    { key: 'endDate', label: 'Fecha fin', type: 'date' },
    { key: 'location', label: 'Lugar' },
    { key: 'category', label: 'Categoría' },
  ],
  LOCATION: [
    { key: 'address', label: 'Dirección' },
    { key: 'city', label: 'Ciudad' },
    { key: 'country', label: 'País' },
    { key: 'lat', label: 'Latitud', type: 'number' },
    { key: 'lng', label: 'Longitud', type: 'number' },
  ],
  EVIDENCE: [
    { key: 'source', label: 'Fuente' },
    { key: 'date', label: 'Fecha', type: 'date' },
    { key: 'reference', label: 'Referencia' },
  ],
  CUSTOM: [],

  // === CYBER ===
  HOST: [
    { key: 'ipv4', label: 'IPv4', placeholder: '192.168.1.10' },
    { key: 'ipv6', label: 'IPv6', placeholder: '2001:db8::1' },
    { key: 'hostname', label: 'Hostname', placeholder: 'server-01.example.com' },
    { key: 'mac', label: 'MAC', placeholder: '00:1A:2B:3C:4D:5E' },
    { key: 'os', label: 'Sistema operativo', placeholder: 'Linux / Windows / macOS' },
    { key: 'osVersion', label: 'Versión OS', placeholder: 'Ubuntu 22.04' },
    { key: 'asn', label: 'ASN', placeholder: 'AS13335' },
    { key: 'hostingProvider', label: 'Proveedor', placeholder: 'AWS / DigitalOcean / Hetzner' },
    { key: 'country', label: 'País' },
    { key: 'lastSeen', label: 'Visto por última vez', type: 'date' },
  ],
  DOMAIN: [
    { key: 'name', label: 'Dominio', placeholder: 'example.com' },
    { key: 'registrar', label: 'Registrador', placeholder: 'GoDaddy / Namecheap' },
    { key: 'registrationDate', label: 'Registrado', type: 'date' },
    { key: 'expiryDate', label: 'Expira', type: 'date' },
    { key: 'whoisOwner', label: 'WHOIS owner' },
    { key: 'whoisEmail', label: 'WHOIS email', type: 'email' },
    { key: 'archiveUrl', label: 'Archive URL', type: 'url', placeholder: 'https://web.archive.org/...' },
  ],
  ACCOUNT: [
    { key: 'platform', label: 'Plataforma', placeholder: 'twitter / github / telegram' },
    { key: 'handle', label: 'Handle', placeholder: 'username' },
    { key: 'displayName', label: 'Nombre mostrado' },
    { key: 'profileUrl', label: 'URL del perfil', type: 'url' },
    { key: 'userId', label: 'User ID interno', placeholder: '123456789' },
    { key: 'creationDate', label: 'Creada', type: 'date' },
    { key: 'followerCount', label: 'Seguidores', type: 'number' },
    { key: 'bio', label: 'Bio' },
  ],
  WALLET: [
    { key: 'chain', label: 'Chain', placeholder: 'BTC / ETH / TRX / SOL...' },
    { key: 'address', label: 'Dirección', placeholder: '0x... / bc1q... / T...' },
    { key: 'label', label: 'Etiqueta', placeholder: 'Binance / mixer / cold-storage' },
    { key: 'firstSeen', label: 'Primera actividad', type: 'date' },
    { key: 'lastActivity', label: 'Última actividad', type: 'date' },
    { key: 'incomingVolumeUsd', label: 'Volumen entrante (USD)', type: 'number' },
    { key: 'outgoingVolumeUsd', label: 'Volumen saliente (USD)', type: 'number' },
  ],
  VULNERABILITY: [
    { key: 'cve', label: 'CVE', placeholder: 'CVE-2024-1234' },
    { key: 'cvss', label: 'CVSS', type: 'number', placeholder: '9.8' },
    { key: 'severity', label: 'Severidad', placeholder: 'critical / high / medium / low / info' },
    { key: 'status', label: 'Estado', placeholder: 'open / triaged / resolved / duplicate / wontfix' },
    { key: 'affectedProduct', label: 'Producto afectado' },
    { key: 'affectedVersions', label: 'Versiones', placeholder: '< 1.4.2' },
    { key: 'cwe', label: 'CWE', placeholder: 'CWE-79' },
    { key: 'exploitUrl', label: 'URL del exploit', type: 'url' },
    { key: 'bountyAwardedUsd', label: 'Bounty (USD)', type: 'number' },
  ],
  MALWARE: [
    { key: 'family', label: 'Familia', placeholder: 'Emotet / LockBit / Cobalt Strike' },
    { key: 'malwareType', label: 'Tipo', placeholder: 'ransomware / RAT / loader / stealer' },
    { key: 'md5', label: 'MD5' },
    { key: 'sha1', label: 'SHA-1' },
    { key: 'sha256', label: 'SHA-256' },
    { key: 'firstSeen', label: 'Primera detección', type: 'date' },
    { key: 'vtScore', label: 'VirusTotal score', placeholder: '54/70' },
  ],
  CREDENTIAL: [
    { key: 'login', label: 'Email / username' },
    { key: 'breach', label: 'Breach', placeholder: 'LinkedIn 2012 / Collection #1' },
    { key: 'breachDate', label: 'Fecha breach', type: 'date' },
    { key: 'recordCount', label: 'Registros del breach', type: 'number' },
    { key: 'dataExposed', label: 'Datos expuestos', placeholder: 'email, password, phone, dob' },
  ],
  NETWORK: [
    { key: 'cidr', label: 'CIDR', placeholder: '192.168.1.0/24' },
    { key: 'asn', label: 'ASN' },
    { key: 'asnOwner', label: 'ASN owner', placeholder: 'Cloudflare / OVH / Hurricane Electric' },
    { key: 'country', label: 'País' },
    { key: 'region', label: 'Región' },
    { key: 'purpose', label: 'Uso', placeholder: 'corporate / hosting / VPN / Tor' },
  ],
};

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

export function Inspector({
  nodeId,
  boardId,
  onClose,
  readOnly = false,
  onPatch,
  onDelete,
  fallbackData,
}: {
  nodeId: string;
  boardId: string;
  onClose: () => void;
  readOnly?: boolean;
  /** Aplica el patch en el estado local del canvas Y persiste en DB. */
  onPatch?: (nodeId: string, patch: Record<string, unknown>) => void;
  /** Elimina el nodo (canvas + DB). */
  onDelete?: (nodeId: string) => void;
  /** Datos del nodo desde el estado local del canvas (renderiza inmediato). */
  fallbackData?: FallbackNode;
}) {
  const { data: nodes } = trpc.node.list.useQuery({ boardId });
  // Para el nodo seleccionado, traemos versión COMPLETA (con attachments dataURL).
  // node.list solo devuelve metadatos para reducir el payload del canvas.
  const { data: fullNode } = trpc.node.byId.useQuery(
    { boardId, id: nodeId },
    { enabled: !!nodeId },
  );
  const dbNode = fullNode ?? nodes?.find((n) => n.id === nodeId);
  // Usa el dato de la DB si está, sino el del canvas (para nodos recién creados)
  const node = dbNode ??
    (fallbackData
      ? {
          id: nodeId,
          type: fallbackData.type,
          title: fallbackData.title,
          subtitle: fallbackData.subtitle ?? null,
          tags: fallbackData.tags ?? [],
          fields: fallbackData.fields ?? {},
          contentMd: null as string | null,
        }
      : null);
  const update = trpc.node.update.useMutation();
  const utils = trpc.useUtils();

  /** Si el padre pasó onPatch lo usamos (refleja en canvas), sino caemos al mutate directo. */
  const applyPatch = (patch: Record<string, unknown>) => {
    if (onPatch) onPatch(nodeId, patch);
    else update.mutate({ boardId, id: nodeId, patch }, { onSuccess: () => utils.node.list.invalidate({ boardId }) });
  };

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [fields, setFields] = useState<Fields>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado local cuando cambia el nodo seleccionado (id) o cuando
  // el snapshot del servidor llega/cambia. Incluimos campos clave para evitar
  // perder updates de otros clientes en realtime.
  useEffect(() => {
    if (!node) return;
    setTitle(node.title);
    setSubtitle(node.subtitle ?? '');
    setFields((node.fields as Fields) ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, dbNode?.id, dbNode?.title, dbNode?.subtitle, dbNode?.fields]);

  if (!node) {
    return (
      <aside className="w-[380px] border-l border-border-subtle bg-bg-surface p-4">
        <p className="text-sm text-text-muted">Cargando...</p>
      </aside>
    );
  }

  const handleDelete = () => {
    if (!onDelete) return;
    setConfirmDelete(true);
  };

  const confirmDeletion = () => {
    if (!onDelete) return;
    onDelete(nodeId);
  };

  const meta = NODE_TYPE_META[node.type as keyof typeof NODE_TYPE_META];
  const typeFields = TYPE_FIELDS[node.type] ?? [];
  const photoUrl = typeof fields.photoUrl === 'string' ? fields.photoUrl : null;
  const attachments = (Array.isArray(fields.attachments) ? fields.attachments : []) as Attachment[];

  const persistFields = (next: Fields) => {
    setFields(next);
    // Solo enviamos las claves que cambiaron — el merge de fields lo hace el callback / DB
    applyPatch({ fields: next });
  };

  const setField = (key: string, value: string | number | null) => {
    const next = { ...fields, [key]: value };
    persistFields(next);
  };

  const addTag = () => {
    // Normaliza: lowercase, sin # inicial, sin espacios extras
    const t = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (!t) return;
    // Anti-duplicado: case-insensitive (filtra todas las variantes)
    const existing = node.tags.map((x) => x.toLowerCase());
    if (existing.includes(t)) {
      setTagInput('');
      return;
    }
    applyPatch({ tags: [...node.tags, t] });
    setTagInput('');
  };

  const removeTag = (t: string) => {
    applyPatch({ tags: node.tags.filter((x) => x !== t) });
  };

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error('Error leyendo el archivo'));
      r.readAsDataURL(file);
    });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(`Tipo no soportado: "${file.type || 'desconocido'}". Usa JPG, PNG o WebP.`);
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError(`Archivo de ${(file.size / 1024 / 1024).toFixed(2)} MB excede el máximo de ${(MAX_PHOTO_BYTES / 1024 / 1024).toFixed(0)} MB`);
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      persistFields({ ...fields, photoUrl: dataUrl });
    } catch (err) {
      setError(`Error leyendo el archivo: ${(err as Error).message}`);
      return;
    }
    if (photoRef.current) photoRef.current.value = '';
  };

  const removePhoto = () => {
    const { photoUrl: _drop, ...rest } = fields;
    persistFields(rest);
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError(`Máximo ${(MAX_ATTACHMENT_BYTES / 1024 / 1024).toFixed(0)} MB por archivo`);
      return;
    }
    const dataUrl = await readAsDataUrl(file);
    const att: Attachment = { name: file.name, mime: file.type || 'application/octet-stream', size: file.size, dataUrl };
    persistFields({ ...fields, attachments: [...attachments, att] });
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeAttachment = (idx: number) => {
    persistFields({ ...fields, attachments: attachments.filter((_, i) => i !== idx) });
  };

  return (
    <aside className="flex w-[380px] flex-col border-l border-border-subtle bg-bg-surface">
      <header className="flex items-center justify-between border-b border-border-subtle p-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
          <span className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
            {meta.label}
          </span>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* PERSON: foto */}
        {node.type === 'PERSON' && !readOnly && (
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
              Foto
            </label>
            <div className="mt-2 flex items-start gap-3">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded border border-border-subtle bg-bg-elevated">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-text-faded">
                    <ImageIcon size={28} strokeWidth={1.2} />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => photoRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload size={13} />
                  {photoUrl ? 'Cambiar' : 'Subir foto'}
                </Button>
                {photoUrl && (
                  <Button variant="ghost" size="sm" onClick={removePhoto} className="gap-1.5 text-danger">
                    <Trash2 size={13} /> Quitar
                  </Button>
                )}
                <p className="text-[10px] text-text-faded">Máx 10 MB · JPG / PNG / WebP</p>
              </div>
            </div>
          </div>
        )}

        {/* Título / subtítulo */}
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
              Título
            </label>
            <Input
              className="mt-1"
              value={title}
              disabled={readOnly}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title !== node.title && applyPatch({ title })}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
              Subtítulo
            </label>
            <Input
              className="mt-1"
              value={subtitle}
              disabled={readOnly}
              onChange={(e) => setSubtitle(e.target.value)}
              onBlur={() => subtitle !== (node.subtitle ?? '') && applyPatch({ subtitle })}
            />
          </div>
        </div>

        {/* Campos específicos por tipo */}
        {typeFields.length > 0 && (
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
              Datos
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {typeFields.map((f) => (
                <div key={f.key} className={f.key === 'address' || f.key === 'aliases' || f.key === 'website' ? 'col-span-2' : ''}>
                  <label className="text-[10px] text-text-faded">{f.label}</label>
                  <Input
                    key={`${node.id}-${f.key}`}
                    type={f.type ?? 'text'}
                    placeholder={f.placeholder}
                    disabled={readOnly}
                    defaultValue={(fields[f.key] as string | number | undefined) ?? ''}
                    onBlur={(e) => {
                      const v = e.target.value;
                      const current = fields[f.key];
                      const next: string | number | null = f.type === 'number' && v ? Number(v) : v || null;
                      if (next !== current) setField(f.key, next);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rotación / inclinación manual */}
        {!readOnly && (
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
                Inclinación
              </label>
              <span className="text-[10px] text-text-faded font-typewriter">
                {((typeof fields.rotation === 'number' ? fields.rotation : 0) as number).toFixed(1)}°
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="range"
                min={-15}
                max={15}
                step={0.5}
                value={(typeof fields.rotation === 'number' ? fields.rotation : 0) as number}
                onChange={(e) => {
                  // Solo refresca local + canvas durante el drag (no toca DB)
                  const next = { ...fields, rotation: Number(e.target.value) };
                  setFields(next);
                  if (onPatch) onPatch(nodeId, { fields: next });
                }}
                onPointerUp={(e) => {
                  // Al soltar persiste el valor final
                  const v = Number((e.target as HTMLInputElement).value);
                  const next = { ...fields, rotation: v };
                  update.mutate(
                    { boardId, id: nodeId, patch: { fields: next } },
                    { onSuccess: () => utils.node.list.invalidate({ boardId }) },
                  );
                }}
                className="hilo-slider flex-1"
              />
              <button
                onClick={() => {
                  const next = { ...fields };
                  delete next.rotation;
                  persistFields(next);
                }}
                className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
                title="Volver a rotación automática"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-text-faded">
              <span>−15°</span>
              <span>auto</span>
              <span>+15°</span>
            </div>
          </div>
        )}

        {/* Color de texto */}
        {!readOnly && (
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
              Color de texto
            </label>
            <div className="mt-2 flex items-center gap-2">
              {/* Swatches presets */}
              {(['#1a1a1a', '#ffffff', '#c1272d', '#2d5f8b', '#5a7d3a', '#6b1e5f', '#c97f1a'] as const).map(
                (preset) => {
                  const active = (fields.textColor as string | undefined) === preset;
                  return (
                    <button
                      key={preset}
                      onClick={() => setField('textColor', preset)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        active ? 'border-accent ring-2 ring-accent/40' : 'border-border-subtle'
                      }`}
                      style={{ background: preset }}
                      title={preset}
                      aria-label={`Color ${preset}`}
                    />
                  );
                },
              )}
              {/* Color personalizado */}
              <label
                className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border-2 border-border-subtle"
                title="Color personalizado"
              >
                <input
                  type="color"
                  value={(fields.textColor as string | undefined) ?? '#1a1a1a'}
                  onChange={(e) => setField('textColor', e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className="block h-full w-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, #ef4444, #fbbf24, #4ade80, #60a5fa, #c084fc, #ef4444)',
                  }}
                />
              </label>
              <button
                onClick={() => {
                  const next = { ...fields };
                  delete next.textColor;
                  persistFields(next);
                }}
                className="ml-auto rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
                title="Volver al color por defecto"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-text-faded">
              Útil cuando el contraste con el fondo del nodo no se nota bien.
            </p>
          </div>
        )}

        {/* Visibilidad — qué se ve en la tarjeta del canvas */}
        {!readOnly && (
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
              Mostrar en la tarjeta
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {([
                { key: 'type', label: 'Etiqueta de tipo' },
                ...(node.type === 'PERSON' ? [{ key: 'photo', label: 'Foto' }] : []),
                ...(node.type === 'EVIDENCE' ? [{ key: 'stamp', label: 'Sello' }] : []),
                { key: 'subtitle', label: 'Subtítulo' },
                { key: 'tags', label: 'Tags' },
                { key: 'attachments', label: 'Contador adjuntos' },
              ] as const).map((opt) => {
                const display = (fields.display ?? {}) as Record<string, boolean>;
                const visible = display[opt.key] !== false;
                return (
                  <button
                    key={opt.key}
                    onClick={() =>
                      persistFields({
                        ...fields,
                        display: { ...display, [opt.key]: !visible },
                      })
                    }
                    className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                      visible
                        ? 'border-border-strong bg-bg-elevated text-text-primary'
                        : 'border-border-subtle bg-transparent text-text-faded line-through'
                    }`}
                  >
                    {visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
            Tags
          </label>
          <div className="mt-1 flex flex-wrap gap-1">
            {node.tags.map((t) => (
              <button
                key={t}
                disabled={readOnly}
                onClick={() => removeTag(t)}
                className="group inline-flex items-center"
                title="Quitar tag"
              >
                <Tag>
                  #{t} {!readOnly && <X size={10} className="ml-1 opacity-50 group-hover:opacity-100" />}
                </Tag>
              </button>
            ))}
          </div>
          {!readOnly && (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="añadir tag…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button variant="secondary" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                +
              </Button>
            </div>
          )}
        </div>

        {/* Notas (markdown) */}
        <div>
          <label className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
            Notas
          </label>
          <textarea
            key={`${node.id}-notes`}
            disabled={readOnly}
            defaultValue={node.contentMd ?? ''}
            placeholder="Markdown soportado…"
            className="mt-1 h-32 w-full resize-none rounded-md border border-border-subtle bg-bg-elevated p-2 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onBlur={(e) => applyPatch({ contentMd: e.target.value })}
          />
        </div>

        {/* Adjuntos */}
        {!readOnly && (
          <div>
            <label className="text-xs uppercase tracking-wider text-text-muted font-typewriter">
              Adjuntos
            </label>
            <div className="mt-2 space-y-1.5">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-elevated px-2 py-1.5 text-xs"
                >
                  <FileText size={14} className="flex-shrink-0 text-text-muted" />
                  <a
                    href={a.dataUrl}
                    download={a.name}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 truncate text-text-primary hover:underline"
                  >
                    {a.name}
                  </a>
                  <span className="text-text-faded">{(a.size / 1024).toFixed(0)} KB</span>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="text-text-muted hover:text-danger"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <input ref={fileRef} type="file" className="hidden" onChange={handleAttach} />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="w-full gap-1.5"
              >
                <Paperclip size={13} /> Adjuntar archivo
              </Button>
              <p className="text-[10px] text-text-faded">Máx 5 MB por archivo</p>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-border-subtle p-3">
        {/* Historial: oculto hasta tener viewer de NodeVersion */}
        {!readOnly && onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            className="gap-1.5"
            title="Eliminar nodo (Supr)"
          >
            <Trash2 size={14} />
            Eliminar
          </Button>
        )}
      </footer>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar nodo"
        description={
          <>
            Vas a eliminar <strong className="text-text-primary">"{node.title}"</strong> y todas sus conexiones. Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        tone="danger"
        onConfirm={confirmDeletion}
      />
    </aside>
  );
}
