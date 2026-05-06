'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@hilo/ui';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Network, Check } from 'lucide-react';
import { useT } from '@/i18n/client';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordOk = password.length >= 8;
  const matches = password === confirm && password.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!matches) {
      setError(t.settings.pwdMismatch);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(data.error ?? 'Error');
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Sin token: muestra error
  if (!token) {
    return (
      <ResetLayout t={t}>
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-5">
          <p className="text-sm font-medium text-text-primary">{t.auth.resetTokenInvalid}</p>
          <Link
            href="/forgot-password"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
          >
            {t.auth.resetRequestNew}
            <ArrowRight size={11} />
          </Link>
        </div>
      </ResetLayout>
    );
  }

  if (success) {
    return (
      <ResetLayout t={t}>
        <div className="rounded-xl border border-success/30 bg-success/10 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
              <Check size={16} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">{t.auth.resetSuccess}</p>
            </div>
          </div>
        </div>
      </ResetLayout>
    );
  }

  return (
    <ResetLayout t={t}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
            {t.settings.fieldNewPwd}
          </label>
          <div className="relative">
            <Lock
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faded"
            />
            <Input
              required
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faded transition-colors hover:text-text-primary"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
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
              {passwordOk ? '✓' : `${password.length}/8`}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
            {t.settings.fieldConfirmPwd}
          </label>
          <div className="relative">
            <Lock
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faded"
            />
            <Input
              required
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="pl-9"
            />
          </div>
          {confirm.length > 0 && !matches && (
            <p className="mt-1 text-[11px] text-danger">{t.settings.pwdMismatch}</p>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={submitting || !matches || !passwordOk}
          size="lg"
        >
          {submitting ? (
            <>{t.auth.resetSubmitting}</>
          ) : (
            <>
              {t.auth.resetSubmit}
              <ArrowRight size={14} />
            </>
          )}
        </Button>
      </form>
    </ResetLayout>
  );
}

function ResetLayout({
  t,
  children,
}: {
  t: ReturnType<typeof useT>;
  children: React.ReactNode;
}) {
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
              {t.auth.resetEyebrow}
            </span>
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight xl:text-5xl">
              {t.auth.resetTitle}
            </h2>
            <p className="max-w-md text-base leading-relaxed text-text-muted">
              {t.auth.resetSubtitle}
            </p>
          </div>

          <p className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-text-faded">
            © 2026 Open Osint · MIT License
          </p>
        </aside>

        <section className="relative flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            <Link
              href="/login"
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              <ArrowLeft size={12} />
              {t.auth.backLogin}
            </Link>

            <div className="mb-8">
              <p className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-text-faded">
                {t.auth.resetEyebrow}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text-primary">
                {t.auth.resetTitle}
              </h1>
              <p className="mt-1 text-sm text-text-muted">{t.auth.resetSubtitle}</p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
