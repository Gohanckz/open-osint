'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button, Input } from '@hilo/ui';
import { ArrowLeft, ArrowRight, Mail, Network, Check } from 'lucide-react';
import { useT } from '@/i18n/client';

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Error');
      }
      setSent(true);
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
              {t.auth.forgotEyebrow}
            </span>
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight xl:text-5xl">
              {t.auth.forgotTitle}
            </h2>
            <p className="max-w-md text-base leading-relaxed text-text-muted">
              {t.auth.forgotSubtitle}
            </p>
          </div>

          <p className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-text-faded">
            © 2026 Open Osint · MIT License
          </p>
        </aside>

        {/* === FORM === */}
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
                {t.auth.forgotEyebrow}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text-primary">
                {t.auth.forgotTitle}
              </h1>
              <p className="mt-1 text-sm text-text-muted">{t.auth.forgotSubtitle}</p>
            </div>

            {sent ? (
              <div className="rounded-xl border border-success/30 bg-success/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                    <Check size={16} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {t.common.confirm} ✓
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      {t.auth.forgotSent}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                  }}
                  className="mt-4 w-full text-center text-xs text-text-muted transition-colors hover:text-accent"
                >
                  {t.auth.forgotResend}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
                    {t.settings.accountEmail}
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
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full gap-2" disabled={submitting || !email} size="lg">
                  {submitting ? (
                    <>{t.auth.forgotSubmitting}</>
                  ) : (
                    <>
                      {t.auth.forgotSubmit}
                      <ArrowRight size={14} />
                    </>
                  )}
                </Button>
              </form>
            )}

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
