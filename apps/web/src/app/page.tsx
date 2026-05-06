import Link from 'next/link';
import { auth } from '@/server/auth';
import { prisma } from '@hilo/db';
import { Button } from '@hilo/ui';
import { AppHeader } from '@/components/AppHeader';
import { AppBackground } from '@/components/AppBackground';
import {
  Compass,
  Lock,
  Shield,
  Network,
  Sparkles,
  ArrowRight,
  Boxes,
  Users,
  Activity,
  Trophy,
  Zap,
  Eye,
} from 'lucide-react';

export default async function HomePage() {
  const session = await auth();
  const isLogged = !!session?.user?.id;

  // Stats sociales para social proof — número real de investigaciones / nodos / usuarios
  const [boardCount, nodeCount, userCount] = await Promise.all([
    prisma.board.count({ where: { visibility: 'PUBLIC' } }).catch(() => 0),
    prisma.node.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
  ]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <AppBackground />
      <AppHeader />

      {/* Decoración: hilos rojos diagonales animados sutilmente */}
      <DecorativeThreads />

      {/* === HERO === */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Columna izquierda: copy + CTA */}
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-typewriter text-[10px] uppercase tracking-[0.25em] text-accent">
              <Network size={11} />
              Open Source · The Investigation Board
            </span>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Conecta los puntos.
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #f87171 50%, #ef4444 100%)',
                }}
              >
                Cuenta la verdad.
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-text-muted">
              Tableros de investigación visual con colaboración en tiempo real, gestión de evidencia
              y ranking público. Para periodistas, analistas y ciudadanos curiosos.
            </p>

            <div className="flex flex-wrap gap-3">
              {isLogged ? (
                <Button asChild size="lg" className="gap-2">
                  <Link href="/dashboard">
                    Ir al dashboard
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="gap-2">
                    <Link href="/register">
                      Empezar gratis
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/login">Iniciar sesión</Link>
                  </Button>
                </>
              )}
              <Button asChild size="lg" variant="ghost" className="gap-2">
                <Link href="/explore">
                  <Compass size={16} />
                  Explorar tableros
                </Link>
              </Button>
            </div>

            {/* Stats sociales (compactos) */}
            {boardCount + nodeCount + userCount > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Boxes size={13} className="text-info" />
                  <span className="font-semibold tabular-nums text-text-primary">
                    {boardCount.toLocaleString('es')}
                  </span>
                  investigaciones
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Network size={13} className="text-accent" />
                  <span className="font-semibold tabular-nums text-text-primary">
                    {nodeCount.toLocaleString('es')}
                  </span>
                  nodos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={13} className="text-success" />
                  <span className="font-semibold tabular-nums text-text-primary">
                    {userCount.toLocaleString('es')}
                  </span>
                  investigadores
                </span>
              </div>
            )}
          </div>

          {/* Columna derecha: mini-canvas decorativo */}
          <div className="hidden lg:block">
            <DecorativeBoardPreview />
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="relative mx-auto mt-24 max-w-7xl px-6">
        <div className="mb-10 text-center">
          <p className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-text-faded">
            Características
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Todo lo que una investigación seria necesita.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<Sparkles size={20} />}
            color="#60a5fa"
            title="Canvas fluido"
            description="Hasta 5.000 nodos a 60 fps. Atajos de teclado, zoom semántico, snap inteligente."
            badge="Real-time"
          />
          <Feature
            icon={<Network size={20} />}
            color="#ef4444"
            title="Hilos tipados"
            description="Familia, profesional, sospechoso, financiero, comunicación, propiedad — con etiqueta y peso."
          />
          <Feature
            icon={<Lock size={20} />}
            color="#a78bfa"
            title="Osint Lock"
            description="Sello criptográfico ed25519 + anclaje en blockchain pública para verificar timestamps."
            badge="Cripto"
          />
          <Feature
            icon={<Shield size={20} />}
            color="#4ade80"
            title="Anti-doxxing"
            description="Detección de PII y throttle automático ante aportes sospechosos sobre la misma persona."
          />
          <Feature
            icon={<Trophy size={20} />}
            color="#fbbf24"
            title="Ranking público"
            description="Reconocimiento gamificado: 5 niveles, podio Top-3, heatmap anual de actividad por perfil."
          />
          <Feature
            icon={<Zap size={20} />}
            color="#fb923c"
            title="Open source"
            description="MIT. Self-host con Docker o despliega en Vercel + Neon en 5 minutos."
            badge="MIT"
          />
        </div>
      </section>

      {/* === SOCIAL PROOF / USE CASES === */}
      <section className="relative mx-auto mt-24 max-w-7xl px-6">
        <div className="rounded-3xl border border-border-subtle bg-bg-surface/40 p-8 sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-text-faded">
                Para quién es
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Diseñado para los que persiguen <span className="text-accent">historias</span>.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <UseCase
                icon={<Eye size={16} />}
                title="Periodistas"
                description="Construye historias visualmente. Comparte borradores con tu redacción en tiempo real."
              />
              <UseCase
                icon={<Activity size={16} />}
                title="Analistas OSINT"
                description="Mapas de relaciones, evidencia adjunta y exportación con sello criptográfico."
              />
              <UseCase
                icon={<Compass size={16} />}
                title="Investigadores académicos"
                description="Documenta cadenas de evidencia con versionado y reproducibilidad."
              />
              <UseCase
                icon={<Users size={16} />}
                title="Comunidades"
                description="Tableros públicos con contribuciones moderadas y ranking de aportes."
              />
            </div>
          </div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="relative mx-auto mt-24 max-w-7xl px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl border border-accent/30 p-10 text-center sm:p-16"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(239,68,68,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(99,145,220,0.1) 0%, transparent 50%), linear-gradient(135deg, var(--color-bg-surface) 0%, var(--color-bg-elevated) 100%)',
          }}
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Empieza tu primera investigación.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-text-muted">
            Crea tu cuenta gratis, sin tarjeta. Plan free incluido. Open source para siempre.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {!isLogged && (
              <Button asChild size="lg" className="gap-2">
                <Link href="/register">
                  Empezar gratis
                  <ArrowRight size={16} />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link href="/explore">
                <Compass size={16} />
                Ver tableros públicos
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================================
   DECORATIVE: hilos diagonales sutiles en el fondo
   ========================================================================== */

function DecorativeThreads() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-[5] h-full w-full opacity-30"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="thread1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
          <stop offset="50%" stopColor="#ef4444" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="20%" x2="100%" y2="35%" stroke="url(#thread1)" strokeWidth="1" />
      <line x1="100%" y1="50%" x2="0" y2="65%" stroke="url(#thread1)" strokeWidth="1" />
      <line x1="20%" y1="0" x2="40%" y2="100%" stroke="url(#thread1)" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================================
   DECORATIVE: mini preview de un tablero
   ========================================================================== */

function DecorativeBoardPreview() {
  return (
    <div
      className="relative aspect-[4/5] w-full max-w-md rounded-2xl border border-border-subtle p-6"
      style={{
        background:
          'linear-gradient(135deg, #181c24 0%, #14171c 50%, #0f1217 100%)',
        backgroundImage: `
          linear-gradient(rgba(180,200,220,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(180,200,220,0.04) 1px, transparent 1px),
          linear-gradient(135deg, #181c24 0%, #14171c 50%, #0f1217 100%)
        `,
        backgroundSize: '24px 24px, 24px 24px, 100% 100%',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 80px rgba(239,68,68,0.08)',
      }}
    >
      {/* Hilos rojos SVG */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 500" preserveAspectRatio="none">
        <path
          d="M 100,90 Q 220,200 320,140"
          stroke="#ef4444"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
          style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.7))' }}
        />
        <path
          d="M 100,90 Q 200,260 130,360"
          stroke="#ef4444"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
          style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.7))' }}
        />
        <path
          d="M 320,140 Q 280,260 130,360"
          stroke="#ef4444"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
          strokeDasharray="6 5"
          style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.7))' }}
        />
        <circle cx="100" cy="90" r="3" fill="#ef4444" />
        <circle cx="320" cy="140" r="3" fill="#ef4444" />
        <circle cx="130" cy="360" r="3" fill="#ef4444" />
      </svg>

      {/* Mini "polaroid" cards */}
      <MiniCard
        style={{ top: '10%', left: '8%', transform: 'rotate(-2deg)' }}
        type="PERSONA"
        color="#60a5fa"
        title="Juan Pérez"
        photo
      />
      <MiniCard
        style={{ top: '15%', right: '8%', transform: 'rotate(3deg)' }}
        type="EMPRESA"
        color="#fbbf24"
        title="ACME Corp"
      />
      <MiniCard
        style={{ bottom: '15%', left: '15%', transform: 'rotate(-1.5deg)' }}
        type="EVIDENCIA"
        color="#4ade80"
        title="Email_2024.pdf"
      />
    </div>
  );
}

function MiniCard({
  style,
  type,
  title,
  color,
  photo,
}: {
  style: React.CSSProperties;
  type: string;
  title: string;
  color: string;
  photo?: boolean;
}) {
  return (
    <div
      className="absolute"
      style={{ ...style, width: '38%' }}
    >
      {/* Tachuela */}
      <span
        className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle at 32% 28%, #ff6b73 0%, #ff4757 50%, #7a1419 100%)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.55), inset 0 -1px 1px rgba(0,0,0,0.3)',
        }}
      />
      <div
        className="rounded-sm bg-[#f5e6c8] p-2 text-[#1a1a1a] shadow-2xl"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 12% 18%, rgba(139,111,78,0.1) 0%, transparent 40%), radial-gradient(ellipse at 88% 82%, rgba(139,111,78,0.12) 0%, transparent 45%)',
        }}
      >
        {photo && (
          <div
            className="mb-1.5 aspect-[4/3] w-full rounded-sm"
            style={{
              background:
                'linear-gradient(135deg, #2a2520 0%, #4a3c2e 50%, #2a2520 100%)',
            }}
          />
        )}
        <div className="flex items-center gap-1 font-typewriter text-[7px] uppercase tracking-wider text-[#4a3c2e]">
          <span className="h-1 w-1 rounded-full" style={{ background: color }} />
          {type}
        </div>
        <p className="mt-0.5 font-typewriter text-[10px] leading-tight">{title}</p>
      </div>
    </div>
  );
}

/* ============================================================================
   FEATURE CARD
   ========================================================================== */

function Feature({
  icon,
  color,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border-subtle p-6 transition-all hover:-translate-y-0.5 hover:border-border-strong"
      style={{
        background: `linear-gradient(135deg, var(--color-bg-surface) 0%, color-mix(in srgb, ${color} 5%, var(--color-bg-surface)) 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-30"
        style={{ background: color }}
      />
      <div className="relative flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ background: `${color}1a`, color }}
        >
          {icon}
        </div>
        {badge && (
          <span
            className="rounded-full border px-2 py-0.5 font-typewriter text-[9px] uppercase tracking-[0.18em]"
            style={{
              borderColor: `${color}40`,
              color,
              background: `${color}10`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <h3 className="relative mt-5 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="relative mt-1.5 text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}

function UseCase({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border-subtle bg-bg-canvas/40 p-4">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{description}</p>
      </div>
    </div>
  );
}
