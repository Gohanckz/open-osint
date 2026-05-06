'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@hilo/ui';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail, Lock, Network } from 'lucide-react';
import { useT } from '@/i18n/client';

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const csrfRes = await fetch('/api/auth/csrf').then((x) => x.json());
      const body = new URLSearchParams({
        csrfToken: csrfRes.csrfToken as string,
        email,
        password,
        callbackUrl,
      });
      const r = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        redirect: 'manual',
      });
      if (r.status === 0 || r.type === 'opaqueredirect' || r.status === 302) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }
      const text = await r.text();
      if (text.includes('CredentialsSignin') || r.url.includes('error=')) {
        throw new Error(t.auth.invalidCredentials);
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fondo dark slate con grid sutil + glow ambiental */}
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
          {/* Brand */}
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

          {/* Hilo decorativo central */}
          <div className="relative flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-typewriter text-[10px] uppercase tracking-[0.25em] text-accent">
              <Network size={11} />
              The Investigation Board
            </span>
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight xl:text-5xl">
              {t.tagline.split('.')[0]}.
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #ef4444 0%, #f87171 50%, #ef4444 100%)',
                }}
              >
                {t.tagline.split('.')[1]?.trim()}.
              </span>
            </h2>
            <p className="max-w-md text-base leading-relaxed text-text-muted">
              {t.auth.loginSubtitle}
            </p>
          </div>

          {/* Decoración polaroid + hilos abajo */}
          <div className="relative h-48">
            <DecorativePolaroid />
          </div>

          {/* Footer */}
          <p className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-text-faded">
            © 2026 Open Osint · MIT License
          </p>
        </aside>

        {/* === FORM === */}
        <section className="relative flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            {/* Mobile-only brand */}
            <Link href="/" className="mb-8 inline-flex items-center gap-2 lg:hidden group">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #c1272d 100%)',
                }}
              >
                O
              </span>
              <span className="font-typewriter text-xs uppercase tracking-[0.3em] text-text-primary">
                {t.brand}
              </span>
            </Link>

            {/* Back link */}
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              <ArrowLeft size={12} />
              {t.auth.backHome}
            </Link>

            <div className="mb-8">
              <p className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-text-faded">
                {t.auth.loginLink}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text-primary">
                {t.auth.loginTitle}
              </h1>
              <p className="mt-1 text-sm text-text-muted">{t.auth.loginSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                  {t.settings.accountEmail.replace('Tu ', '').replace('Your ', '')}
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
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-medium uppercase tracking-wider text-text-muted">
                    {t.auth.password}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-text-faded transition-colors hover:text-accent"
                  >
                    {t.auth.forgotPassword}
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faded"
                  />
                  <Input
                    required
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
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
              </div>

              {error && (
                <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={submitting} size="lg">
                {submitting ? (
                  <>{t.auth.submittingLogin}</>
                ) : (
                  <>
                    {t.auth.submitLogin}
                    <ArrowRight size={14} />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border-subtle" />
              <span className="font-typewriter text-[9px] uppercase tracking-[0.25em] text-text-faded">
                {t.auth.or}
              </span>
              <span className="h-px flex-1 bg-border-subtle" />
            </div>

            <p className="text-center text-sm text-text-muted">
              {t.auth.noAccount}{' '}
              <Link href="/register" className="font-medium text-accent hover:underline">
                {t.auth.registerLink}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================================
   DECORATIVE POLAROID con hilo
   ========================================================================== */

function DecorativePolaroid() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Hilo SVG */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        <path
          d="M 60,50 Q 200,140 340,80"
          stroke="#ef4444"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
          style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.7))' }}
        />
        <circle cx="60" cy="50" r="3" fill="#ef4444" />
        <circle cx="340" cy="80" r="3" fill="#ef4444" />
      </svg>

      {/* Polaroid izquierda */}
      <div
        className="absolute left-0 top-2"
        style={{ transform: 'rotate(-4deg)', width: '38%' }}
      >
        <span
          className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle at 32% 28%, #ff6b73 0%, #ff4757 50%, #7a1419 100%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.55)',
          }}
        />
        <div
          className="rounded-sm p-2 shadow-xl"
          style={{
            background: '#f5e6c8',
            backgroundImage:
              'radial-gradient(ellipse at 12% 18%, rgba(139,111,78,0.1) 0%, transparent 40%)',
          }}
        >
          <div
            className="mb-1.5 aspect-[4/3] w-full rounded-sm"
            style={{
              background:
                'linear-gradient(135deg, #2a2520 0%, #4a3c2e 50%, #2a2520 100%)',
            }}
          />
          <div className="flex items-center gap-1 font-typewriter text-[7px] uppercase tracking-wider text-[#4a3c2e]">
            <span className="h-1 w-1 rounded-full bg-[#60a5fa]" />
            Persona
          </div>
        </div>
      </div>

      {/* Nota a la derecha */}
      <div
        className="absolute right-0 top-6"
        style={{ transform: 'rotate(3deg)', width: '40%' }}
      >
        <span
          className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle at 32% 28%, #ff6b73 0%, #ff4757 50%, #7a1419 100%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.55)',
          }}
        />
        <div
          className="rounded-sm p-3 shadow-xl"
          style={{
            background: '#ffe066',
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)',
          }}
        >
          <div className="font-typewriter text-[7px] uppercase tracking-wider text-[#4a3c2e]">
            Evento · 28.04
          </div>
          <p
            className="mt-1 leading-tight text-[#1a1a1a]"
            style={{ fontFamily: 'var(--font-handwritten)', fontSize: 13 }}
          >
            Reunión<br />sospechosa
          </p>
        </div>
      </div>
    </div>
  );
}
