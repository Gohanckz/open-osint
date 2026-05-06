import Link from 'next/link';
import { auth } from '@/server/auth';
import { prisma } from '@hilo/db';
import { AppHeader } from '@/components/AppHeader';
import { AppBackground } from '@/components/AppBackground';
import { fetchRanking, type RankedUser } from '@/lib/ranking-query';
import { getLevel } from '@/lib/ranking';
import { getInitials } from '@/lib/initials';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  ShieldCheck,
  Boxes,
  Network,
  Users,
  Sparkles,
  Flame,
  AtSign,
  ArrowRight,
} from 'lucide-react';

// Sin force-dynamic: fetchRanking ya cachea con unstable_cache(60s) y la página se revalida bien.

export default async function RankingPage() {
  const ranking = await fetchRanking(100);
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  // Banner: si el usuario actual está logueado pero NO tiene username, le avisamos
  const session = await auth();
  const userId = session?.user?.id;
  const currentUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, privacyMode: true },
      })
    : null;
  const showUsernameBanner = !!currentUser && !currentUser.username;
  const showPrivacyBanner = !!currentUser && currentUser.privacyMode;

  return (
    <main className="relative min-h-screen">
      <AppBackground />
      <AppHeader />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* === BANNERS de visibilidad personal === */}
        {showPrivacyBanner && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
            <AtSign size={18} className="mt-0.5 flex-shrink-0 text-warning" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                Estás en modo privado
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Tu perfil está oculto del ranking público. Desactívalo en ajustes para aparecer.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 rounded-md bg-warning px-3 py-1.5 text-xs font-medium text-bg-canvas transition-colors hover:opacity-90"
            >
              Ajustes
              <ArrowRight size={12} />
            </Link>
          </div>
        )}
        {showUsernameBanner && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-info/30 bg-info/10 p-4">
            <AtSign size={18} className="mt-0.5 flex-shrink-0 text-info" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                Aún no tienes un @username
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Apareces en el ranking, pero sin link a tu perfil. Crea tu @username para que otros
                puedan visitarte.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 rounded-md bg-info px-3 py-1.5 text-xs font-medium text-bg-canvas transition-colors hover:opacity-90"
            >
              Crear
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* === HERO === */}
        <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface/40 p-8 sm:p-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(circle at 80% 20%, rgba(251,191,36,0.12), transparent 50%), radial-gradient(circle at 20% 80%, rgba(239,68,68,0.10), transparent 50%)',
            }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-canvas/60 px-3 py-1 font-typewriter text-[10px] uppercase tracking-[0.25em] text-text-muted">
              <Trophy size={11} />
              Ranking público
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
              Top <span className="text-accent">investigadores</span>.
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-text-muted">
              Clasificación de la comunidad por aportes a tableros públicos: investigaciones
              creadas, nodos publicados, hilos conectados y seguidores ganados.
            </p>
          </div>
        </section>

        {/* === PODIO TOP 3 === */}
        {top3.length > 0 && (
          <section className="mt-10">
            <SectionHeader icon={<Crown size={14} />} title="Podio" subtitle="Los 3 top de la comunidad" />
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {top3.map((u, i) => (
                <PodiumCard key={u.id} user={u} position={i + 1} />
              ))}
            </div>
          </section>
        )}

        {/* === RESTO DEL RANKING === */}
        {rest.length > 0 && (
          <section className="mt-10">
            <SectionHeader
              icon={<Flame size={14} />}
              title={`Posiciones 4 — ${ranking.length}`}
              subtitle="Sigue subiendo en la clasificación"
            />
            <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle bg-bg-surface/50">
              <table className="w-full">
                <thead className="border-b border-border-subtle bg-bg-canvas/50">
                  <tr className="text-left">
                    <Th>Rank</Th>
                    <Th>Investigador</Th>
                    <Th align="right">Nivel</Th>
                    <Th align="right" hideOnMobile>Tableros</Th>
                    <Th align="right" hideOnMobile>Nodos</Th>
                    <Th align="right" hideOnMobile>Seguidores</Th>
                    <Th align="right">Score</Th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((u) => (
                    <RankRow key={u.id} user={u} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {ranking.length === 0 && (
          <div className="mt-10 rounded-xl border border-border-subtle bg-bg-surface/40 p-12 text-center">
            <Trophy size={32} strokeWidth={1.3} className="mx-auto text-text-faded" />
            <h3 className="mt-3 text-base font-medium text-text-primary">
              El ranking está vacío
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Cuando la comunidad publique tableros aparecerán aquí. ¿Por qué no eres tú el primero?
            </p>
            <Link
              href="/boards/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Crear tablero público
            </Link>
          </div>
        )}

        {/* === LEYENDA SCORING === */}
        <section className="mt-10 rounded-xl border border-border-subtle bg-bg-surface/30 p-6">
          <SectionHeader icon={<Sparkles size={14} />} title="Cómo se calcula el score" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <ScoringRule label="Tablero público" value="+10" />
            <ScoringRule label="Nodo publicado" value="+1" />
            <ScoringRule label="Conexión" value="+0.5" />
            <ScoringRule label="Seguidor" value="+5" />
            <ScoringRule label="Tablero destacado" value="+50" />
            <ScoringRule label="Verificado" value="+100" />
            <ScoringRule label="Reputación" value="+1 por punto" />
          </div>
        </section>
      </div>
    </main>
  );
}

/* =============================================================================
   COMPONENTES
   ========================================================================== */

const POSITION_STYLES = {
  1: { color: '#FFD700', bg: 'rgba(255,215,0,0.10)', glow: 'rgba(255,215,0,0.4)', icon: Crown, label: '1ER LUGAR' },
  2: { color: '#C0C0C0', bg: 'rgba(192,192,192,0.10)', glow: 'rgba(192,192,192,0.3)', icon: Medal, label: '2DO LUGAR' },
  3: { color: '#CD7F32', bg: 'rgba(205,127,50,0.10)', glow: 'rgba(205,127,50,0.3)', icon: Award, label: '3ER LUGAR' },
} as const;

function PodiumCard({ user, position }: { user: RankedUser; position: 1 | 2 | 3 }) {
  const style = POSITION_STYLES[position];
  const Icon = style.icon;
  const level = getLevel(user.score);
  const initials = getInitials(user.displayName);

  // Si el usuario no tiene username, renderizamos un div en vez de Link
  const Wrapper: React.ComponentType<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> =
    user.username
      ? (props) => <Link href={`/u/${user.username}`} {...props} />
      : (props) => <div {...props} />;

  return (
    <Wrapper
      className="group relative block overflow-hidden rounded-2xl border bg-bg-surface p-5 transition-all hover:bg-bg-elevated"
      style={{ borderColor: style.color + '4D' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{ background: `radial-gradient(circle at 100% 0%, ${style.bg}, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute -top-1 -right-1 h-24 w-24 rounded-full opacity-30 blur-3xl"
        style={{ background: style.glow }}
      />

      <div className="relative">
        {/* Posición + medalla */}
        <div className="flex items-center justify-between">
          <span className="font-typewriter text-[10px] uppercase tracking-[0.25em]" style={{ color: style.color }}>
            {style.label}
          </span>
          <Icon size={20} style={{ color: style.color }} className="drop-shadow-md" />
        </div>

        {/* Avatar */}
        <div className="mt-4 flex items-center gap-3">
          <div
            className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 shadow-lg"
            style={{ borderColor: style.color }}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent text-xl font-semibold text-white">
                {initials || '·'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-text-primary group-hover:text-accent">
              {user.displayName}
            </p>
            <p className="truncate font-typewriter text-xs text-text-faded">
              {user.username ? `@${user.username}` : 'sin @username'}
            </p>
            {user.isVerified && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-info/15 px-1.5 py-0.5 text-[9px] font-medium text-info">
                <ShieldCheck size={9} />
                VERIFICADO
              </span>
            )}
          </div>
        </div>

        {/* Score grande */}
        <div className="mt-5 flex items-end justify-between border-t border-border-subtle pt-4">
          <div>
            <p className="font-typewriter text-[9px] uppercase tracking-[0.2em] text-text-faded">Score</p>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: style.color }}
            >
              {Math.round(user.score).toLocaleString('es')}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wider"
            style={{ background: `${level.color}1a`, color: level.color, border: `1px solid ${level.color}33` }}
          >
            {level.name}
          </span>
        </div>

        {/* Mini stats */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <Stat icon={<Boxes size={10} />} value={user.contribution.boardCount} />
          <Stat icon={<Network size={10} />} value={user.contribution.totalNodes} />
          <Stat icon={<Users size={10} />} value={user.contribution.followerCount} />
        </div>
      </div>
    </Wrapper>
  );
}

function RankRow({ user }: { user: RankedUser }) {
  const level = getLevel(user.score);
  const initials = getInitials(user.displayName);

  return (
    <tr className="border-b border-border-subtle last:border-0 transition-colors hover:bg-bg-elevated/50">
      <td className="px-4 py-3 align-middle">
        <span className="inline-block min-w-8 font-typewriter text-sm tabular-nums text-text-muted">
          #{user.rank}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        {user.username ? (
          <Link href={`/u/${user.username}`} className="flex items-center gap-3 group">
            <Avatar user={user} initials={initials} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-text-primary group-hover:text-accent">
                {user.displayName}
                {user.isVerified && <ShieldCheck size={11} className="text-info flex-shrink-0" />}
              </p>
              <p className="truncate font-typewriter text-[10px] text-text-faded">@{user.username}</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar user={user} initials={initials} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-text-primary">
                {user.displayName}
                {user.isVerified && <ShieldCheck size={11} className="text-info flex-shrink-0" />}
              </p>
              <p className="truncate font-typewriter text-[10px] text-text-faded">sin @username</p>
            </div>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right align-middle">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
          style={{ background: `${level.color}1a`, color: level.color, border: `1px solid ${level.color}33` }}
        >
          {level.name}
        </span>
      </td>
      <td className="hidden px-4 py-3 text-right align-middle text-sm tabular-nums text-text-muted md:table-cell">
        {user.contribution.boardCount}
      </td>
      <td className="hidden px-4 py-3 text-right align-middle text-sm tabular-nums text-text-muted md:table-cell">
        {user.contribution.totalNodes}
      </td>
      <td className="hidden px-4 py-3 text-right align-middle text-sm tabular-nums text-text-muted md:table-cell">
        {user.contribution.followerCount}
      </td>
      <td className="px-4 py-3 text-right align-middle">
        <span className="font-typewriter text-base font-semibold tabular-nums text-text-primary">
          {Math.round(user.score).toLocaleString('es')}
        </span>
      </td>
    </tr>
  );
}

function Avatar({
  user,
  initials,
}: {
  user: { avatarUrl: string | null };
  initials: string;
}) {
  return (
    <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-bg-elevated">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-accent text-xs font-semibold text-white">
          {initials || '·'}
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align = 'left',
  hideOnMobile = false,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  hideOnMobile?: boolean;
}) {
  return (
    <th
      className={`px-4 py-2.5 font-typewriter text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${hideOnMobile ? 'hidden md:table-cell' : ''}`}
    >
      {children}
    </th>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center justify-center gap-1 rounded border border-border-subtle bg-bg-canvas/50 py-1.5 text-xs text-text-muted">
      <span className="text-text-faded">{icon}</span>
      <span className="tabular-nums text-text-primary">{value}</span>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-1.5 font-typewriter text-xs uppercase tracking-[0.2em] text-text-muted">
        {icon}
        {title}
      </div>
      {subtitle && <p className="mt-0.5 text-sm text-text-faded">{subtitle}</p>}
    </div>
  );
}

function ScoringRule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-canvas/40 px-3 py-2">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="font-typewriter text-sm font-semibold tabular-nums text-accent">{value}</span>
    </div>
  );
}
