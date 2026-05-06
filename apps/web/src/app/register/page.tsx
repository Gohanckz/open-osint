'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@hilo/ui';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  Network,
  Check,
} from 'lucide-react';
import { useT } from '@/i18n/client';

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordOk = password.length >= 8;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Error al registrarse');
      }
      // Auto sign-in
      const csrfRes = await fetch('/api/auth/csrf').then((x) => x.json());
      const params = new URLSearchParams({
        csrfToken: csrfRes.csrfToken as string,
        email,
        password,
        callbackUrl: '/dashboard',
      });
      const signinRes = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        redirect: 'manual',
      });
      if (signinRes.status >= 400) {
        throw new Error('Cuenta creada pero falló el login automático. Intenta entrar manualmente.');
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundColor: 'var(--color-bg-canvas)',
          backgroundImage: `
            linear-gradient(rgba(180,200,220,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,200,220,0.04) 1px, transparent 1px),
            radial-gradient(ellipse at 25% 30%, rgba(99,145,220,0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 70%, rgba(239,68,68,0.10) 0%, transparent 55%),
            linear-gradient(135deg, #181c24 0%, #14171c 50%, #0f1217 100%)
          `,
          backgroundSize: '32px 32px, 32px 32px, 100% 100%, 100% 100%, 100% 100%',
        }}
      />

      <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(420px,520px)]">
        {/* === SIDE BRAND === */}
        <aside className="relative hidden flex-col justify-between p-12 lg:flex">
          <Link href="/" className="inline-flex w-fit items-center gap-2.5 group">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md text-base font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #c1272d 100%)',
                boxShadow: '0 0 14px rgba(239,68,68,0.4)',
              }}
            >
              O
            </span>
            <span className="font-typewriter text-xs uppercase tracking-[0.3em] text-text-primary group-hover:text-accent transition-colors">
              {t.brand}
            </span>
          </Link>

          <div className="relative flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-typewriter text-[10px] uppercase tracking-[0.25em] text-accent">
              <Network size={11} />
              {t.auth.registerTitle}
            </span>
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight xl:text-5xl">
              {t.auth.registerSubtitle.split('.')[0]}.
            </h2>
            <ul className="mt-2 space-y-2 text-sm text-text-muted">
              <li className="inline-flex items-center gap-2">
                <Check size={14} className="flex-shrink-0 text-success" />
                Free plan · no credit card
              </li>
              <li className="inline-flex items-center gap-2">
                <Check size={14} className="flex-shrink-0 text-success" />
                Public + private boards
              </li>
              <li className="inline-flex items-center gap-2">
                <Check size={14} className="flex-shrink-0 text-success" />
                Real-time collaboration
              </li>
              <li className="inline-flex items-center gap-2">
                <Check size={14} className="flex-shrink-0 text-success" />
                Open source · MIT
              </li>
            </ul>
          </div>

          <p className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-text-faded">
            © 2026 Open Osint · MIT License
          </p>
        </aside>

        {/* === FORM === */}
        <section className="relative flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 lg:hidden group">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #c1272d 100%)' }}
              >
                O
              </span>
              <span className="font-typewriter text-xs uppercase tracking-[0.3em] text-text-primary">
                {t.brand}
              </span>
            </Link>

            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              <ArrowLeft size={12} />
              {t.auth.backHome}
            </Link>

            <div className="mb-8">
              <p className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-text-faded">
                {t.auth.submitRegister}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text-primary">
                {t.auth.registerTitle}
              </h1>
              <p className="mt-1 text-sm text-text-muted">{t.auth.registerSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                  {t.auth.displayName}
                </label>
                <div className="relative">
                  <UserIcon
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faded"
                  />
                  <Input
                    required
                    name="displayName"
                    placeholder={t.auth.displayName}
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9"
                    maxLength={80}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faded"
                  />
                  <Input
                    required
                    type="email"
                    name="email"
                    placeholder={t.auth.email}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                  {t.auth.password}
                </label>
                <div className="relative">
                  <Lock
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faded"
                  />
                  <Input
                    required
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faded transition-colors hover:text-text-primary"
                    aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {/* Password strength hint */}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordOk ? 'bg-success' : 'bg-border-subtle'
                    }`}
                  />
                  <span
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= 12 ? 'bg-success' : 'bg-border-subtle'
                    }`}
                  />
                  <span className={passwordOk ? 'text-success' : 'text-text-faded'}>
                    {passwordOk ? '✓ Suficiente' : `${password.length}/8`}
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={submitting || !passwordOk || !email || !displayName}
                size="lg"
              >
                {submitting ? (
                  <>{t.auth.submittingRegister}</>
                ) : (
                  <>
                    {t.auth.submitRegister}
                    <ArrowRight size={14} />
                  </>
                )}
              </Button>

              <p className="text-center text-[11px] text-text-faded">
                MIT · Open Source
              </p>
            </form>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border-subtle" />
              <span className="font-typewriter text-[9px] uppercase tracking-[0.25em] text-text-faded">
                {t.auth.or}
              </span>
              <span className="h-px flex-1 bg-border-subtle" />
            </div>

            <p className="text-center text-sm text-text-muted">
              {t.auth.haveAccount}{' '}
              <Link href="/login" className="font-medium text-accent hover:underline">
                {t.auth.loginLink}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
