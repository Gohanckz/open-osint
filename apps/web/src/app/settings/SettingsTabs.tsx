'use client';

import { useRef, useState } from 'react';
import { Button, Input } from '@hilo/ui';
import { useRouter } from 'next/navigation';
import { Upload, Trash2, Image as ImageIcon, Eye, EyeOff, Check } from 'lucide-react';
import { getInitials } from '@/lib/initials';

type User = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  privacyMode: boolean;
  locale: string;
  createdAt: Date | string;
};

const TABS = [
  { id: 'profile' as const, label: 'Perfil' },
  { id: 'account' as const, label: 'Cuenta' },
  { id: 'privacy' as const, label: 'Privacidad' },
];

export function SettingsTabs({ initialUser }: { initialUser: User }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('profile');
  const [user, setUser] = useState(initialUser);

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-border-subtle">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 font-typewriter text-xs uppercase tracking-[0.18em] transition-colors ${
              tab === t.id
                ? 'text-text-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileForm user={user} onUserUpdate={setUser} />}
      {tab === 'account' && <AccountForm user={user} />}
      {tab === 'privacy' && <PrivacyForm user={user} onUserUpdate={setUser} />}
    </div>
  );
}

/* =============================================================================
   PROFILE
   ========================================================================== */

function ProfileForm({
  user,
  onUserUpdate,
}: {
  user: User;
  onUserUpdate: (u: User) => void;
}) {
  const router = useRouter();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initials = getInitials(displayName);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Solo imágenes (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setError('Máximo 1 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
    if (avatarRef.current) avatarRef.current.value = '';
  }

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const r = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          username: username || null,
          bio: bio || null,
          avatarUrl: avatarUrl || null,
        }),
      });
      const data = (await r.json()) as { error?: string; user?: User };
      if (!r.ok) throw new Error(data.error ?? 'Error al guardar');
      onUserUpdate({ ...user, ...data.user! });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    displayName !== user.displayName ||
    username !== (user.username ?? '') ||
    bio !== (user.bio ?? '') ||
    avatarUrl !== user.avatarUrl;

  return (
    <Section
      title="Tu perfil"
      description="Lo que otros investigadores ven sobre ti."
    >
      {/* Avatar */}
      <div className="flex items-start gap-5">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-border-strong bg-bg-elevated">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-accent text-2xl font-semibold text-white">
              {initials || '·'}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatar}
          />
          <Button variant="secondary" size="sm" onClick={() => avatarRef.current?.click()}>
            <Upload size={13} />
            Subir avatar
          </Button>
          {avatarUrl && (
            <Button variant="ghost" size="sm" onClick={() => setAvatarUrl(null)}>
              <Trash2 size={13} />
              Quitar
            </Button>
          )}
          <p className="text-[10px] text-text-faded">JPG / PNG / WebP · máximo 1 MB</p>
        </div>
      </div>

      <Field label="Nombre a mostrar" required>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
      </Field>

      <Field label="Username (handle)" hint="3-40 caracteres · letras, números, _ y -">
        <div className="flex items-center">
          <span className="flex h-9 items-center rounded-l-md border border-r-0 border-border-subtle bg-bg-elevated px-3 font-typewriter text-sm text-text-faded">
            @
          </span>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="tunombre"
            className="rounded-l-none"
            maxLength={40}
          />
        </div>
      </Field>

      <Field label="Biografía" hint={`${bio.length}/500`}>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 500))}
          placeholder="Cuéntanos algo sobre ti…"
          rows={4}
          className="w-full resize-none rounded-md border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-border-strong focus-visible:ring-2 focus-visible:ring-accent"
        />
      </Field>

      <FormFooter
        error={error}
        success={success && 'Perfil actualizado'}
        actions={
          <Button onClick={handleSave} disabled={saving || !dirty}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        }
      />
    </Section>
  );
}

/* =============================================================================
   ACCOUNT (email + password)
   ========================================================================== */

function AccountForm({ user }: { user: User }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleChange() {
    setError(null);
    setSuccess(false);
    if (next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (next !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(data.error ?? 'Error al cambiar contraseña');
      setSuccess(true);
      setCurrent('');
      setNext('');
      setConfirm('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Email" description="No puedes cambiar el email directamente. Contacta soporte si necesitas hacerlo.">
        <Field label="Tu email">
          <Input value={user.email ?? ''} disabled />
        </Field>
        {user.isVerified && (
          <p className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-1 text-xs text-success">
            <Check size={12} /> Email verificado
          </p>
        )}
      </Section>

      <Section title="Cambiar contraseña" description="Mínimo 8 caracteres.">
        <Field label="Contraseña actual">
          <PasswordInput value={current} onChange={setCurrent} show={showPwd} onToggle={setShowPwd} />
        </Field>
        <Field label="Nueva contraseña">
          <PasswordInput value={next} onChange={setNext} show={showPwd} onToggle={setShowPwd} />
        </Field>
        <Field label="Confirmar nueva contraseña">
          <PasswordInput value={confirm} onChange={setConfirm} show={showPwd} onToggle={setShowPwd} />
        </Field>
        <FormFooter
          error={error}
          success={success && 'Contraseña actualizada'}
          actions={
            <Button onClick={handleChange} disabled={saving || !current || !next || !confirm}>
              {saving ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          }
        />
      </Section>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => onToggle(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

/* =============================================================================
   PRIVACY
   ========================================================================== */

function PrivacyForm({
  user,
  onUserUpdate,
}: {
  user: User;
  onUserUpdate: (u: User) => void;
}) {
  const router = useRouter();
  const [privacyMode, setPrivacyMode] = useState(user.privacyMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const r = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyMode }),
      });
      const data = (await r.json()) as { error?: string; user?: User };
      if (!r.ok) throw new Error(data.error ?? 'Error al guardar');
      onUserUpdate({ ...user, ...data.user! });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const dirty = privacyMode !== user.privacyMode;

  return (
    <Section
      title="Privacidad"
      description="Controla qué se ve de ti en perfiles públicos y tableros compartidos."
    >
      <Toggle
        label="Modo privado"
        description="Tu perfil no aparece en /explore, tu username no es buscable y no se muestra tu actividad pública."
        value={privacyMode}
        onChange={setPrivacyMode}
      />

      <div className="rounded-lg border border-border-subtle bg-bg-elevated/50 p-4">
        <h4 className="font-typewriter text-xs uppercase tracking-[0.18em] text-text-muted">
          Próximamente
        </h4>
        <ul className="mt-2 space-y-1.5 text-sm text-text-faded">
          <li>· Quién puede mencionarte en tableros</li>
          <li>· Notificaciones por contribución a tableros públicos</li>
          <li>· Historial de actividad pública</li>
        </ul>
      </div>

      <FormFooter
        error={error}
        success={success && 'Privacidad actualizada'}
        actions={
          <Button onClick={handleSave} disabled={saving || !dirty}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        }
      />
    </Section>
  );
}

/* =============================================================================
   PRIMITIVES
   ========================================================================== */

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
    <section className="rounded-xl border border-border-subtle bg-bg-surface/60 p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
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

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-start justify-between gap-4 rounded-lg border border-border-subtle bg-bg-elevated p-4 text-left transition-colors hover:border-border-strong"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
      </div>
      <span
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          value ? 'bg-accent' : 'bg-bg-canvas'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

function FormFooter({
  error,
  success,
  actions,
}: {
  error: string | null;
  success: string | false;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <div className="min-h-[20px] text-xs">
        {error && <span className="text-danger">{error}</span>}
        {success && (
          <span className="inline-flex items-center gap-1 text-success">
            <Check size={12} /> {success}
          </span>
        )}
      </div>
      {actions}
    </div>
  );
}
