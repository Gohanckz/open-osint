import { Trophy, Sparkles, Boxes, Network, Users, ShieldCheck } from 'lucide-react';
import { getLevelProgress, type LevelKey } from '@/lib/ranking';
import type { UserContribution } from '@/lib/ranking';

export interface GameStatsProps {
  contribution: UserContribution;
  score: number;
  rank: number | null;
  /** Heatmap data: arr de 364 valores (números de actividad por día, [oldest..newest]) */
  heatmap: number[];
}

const LEVEL_RING: Record<LevelKey, string> = {
  novato: '#94a3b8',
  investigador: '#60a5fa',
  detective: '#4ade80',
  maestro: '#fbbf24',
  leyenda: '#ef4444',
};

export function GameStats({ contribution, score, rank, heatmap }: GameStatsProps) {
  const { current, next, progress, toNext } = getLevelProgress(score);
  const ringColor = LEVEL_RING[current.key];

  return (
    <div className="space-y-6">
      {/* === LEVEL CARD === */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6"
        style={{
          borderColor: ringColor + '4D',
          background: `linear-gradient(135deg, var(--color-bg-surface) 0%, color-mix(in srgb, ${ringColor} 8%, var(--color-bg-surface)) 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-25 blur-3xl"
          style={{ background: ringColor }}
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-typewriter text-[10px] uppercase tracking-[0.25em] text-text-faded">
              Nivel actual
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight" style={{ color: ringColor }}>
                {current.name}
              </h3>
              <span className="font-typewriter text-xs tabular-nums text-text-muted">
                {Math.round(score).toLocaleString('es')} pts
              </span>
            </div>
            {rank !== null && (
              <p className="mt-2 inline-flex items-center gap-1.5 font-typewriter text-xs text-text-muted">
                <Trophy size={11} className="text-warning" />
                Posición global <span className="font-semibold text-text-primary">#{rank}</span>
              </p>
            )}
          </div>
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2"
            style={{
              borderColor: ringColor,
              background: `${ringColor}1a`,
              boxShadow: `0 0 24px ${ringColor}33`,
            }}
          >
            <Sparkles size={22} style={{ color: ringColor }} />
          </div>
        </div>

        {/* Progress bar al siguiente nivel */}
        {next ? (
          <div className="relative mt-5">
            <div className="flex items-center justify-between text-[10px] font-typewriter uppercase tracking-wider text-text-faded">
              <span>{current.name}</span>
              <span>
                {toNext > 0 ? `${toNext.toLocaleString('es')} pts para ${next.name}` : `¡${next.name}!`}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-bg-canvas/80">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  background: `linear-gradient(90deg, ${ringColor}, color-mix(in srgb, ${ringColor} 60%, white))`,
                  boxShadow: `0 0 10px ${ringColor}88`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="relative mt-5 text-center font-typewriter text-xs uppercase tracking-wider text-warning">
            🏆 Nivel máximo alcanzado
          </div>
        )}
      </div>

      {/* === STATS GRID === */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Boxes size={16} />}
          label="Tableros"
          value={contribution.boardCount}
          color="#60a5fa"
        />
        <StatCard
          icon={<Network size={16} />}
          label="Nodos"
          value={contribution.totalNodes}
          color="#4ade80"
        />
        <StatCard
          icon={<Sparkles size={16} />}
          label="Hilos"
          value={contribution.totalConnections}
          color="#ef4444"
        />
        <StatCard
          icon={<Users size={16} />}
          label="Seguidores"
          value={contribution.followerCount}
          color="#c084fc"
        />
      </div>

      {/* Featured / Verified badges */}
      {(contribution.featuredCount > 0 || contribution.isVerified) && (
        <div className="flex flex-wrap gap-2">
          {contribution.isVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">
              <ShieldCheck size={12} /> Verificado +100
            </span>
          )}
          {contribution.featuredCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles size={12} /> {contribution.featuredCount} destacado{contribution.featuredCount === 1 ? '' : 's'} ·
              +{contribution.featuredCount * 50}
            </span>
          )}
        </div>
      )}

      {/* === ACTIVITY HEATMAP === */}
      {heatmap.length > 0 && <ActivityHeatmap data={heatmap} />}
    </div>
  );
}

/* ============================================================================
   STAT CARD
   ========================================================================== */

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border border-border-subtle p-3"
      style={{
        background: `linear-gradient(135deg, var(--color-bg-surface) 0%, color-mix(in srgb, ${color} 4%, var(--color-bg-surface)) 100%)`,
      }}
    >
      <div className="flex items-center gap-2 text-text-muted">
        <span style={{ color }}>{icon}</span>
        <span className="font-typewriter text-[10px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-text-primary">
        {value.toLocaleString('es')}
      </p>
    </div>
  );
}

/* ============================================================================
   ACTIVITY HEATMAP — 52 weeks × 7 days
   ========================================================================== */

function ActivityHeatmap({ data }: { data: number[] }) {
  const total = data.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...data);

  // Construye la grilla: columnas = semanas, filas = días (lun..dom)
  const weeks = Math.ceil(data.length / 7);

  function intensity(v: number): string {
    if (v === 0) return 'rgba(154,163,179,0.07)';
    const ratio = v / max;
    if (ratio < 0.25) return 'rgba(239,68,68,0.25)';
    if (ratio < 0.5) return 'rgba(239,68,68,0.45)';
    if (ratio < 0.75) return 'rgba(239,68,68,0.7)';
    return 'rgba(239,68,68,0.95)';
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-5">
      <div className="flex items-center justify-between">
        <div className="font-typewriter text-[10px] uppercase tracking-[0.2em] text-text-muted">
          Actividad · últimos 12 meses
        </div>
        <div className="text-[10px] text-text-faded">
          <span className="tabular-nums text-text-primary">{total.toLocaleString('es')}</span>{' '}
          contribuciones
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="flex gap-[3px]" style={{ minWidth: weeks * 14 }}>
          {Array.from({ length: weeks }, (_, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, d) => {
                const idx = w * 7 + d;
                const v = data[idx] ?? 0;
                if (idx >= data.length) {
                  return <div key={d} className="h-[11px] w-[11px]" />;
                }
                return (
                  <div
                    key={d}
                    className="h-[11px] w-[11px] rounded-sm transition-transform hover:scale-150"
                    style={{ background: intensity(v) }}
                    title={`${v} contribución${v === 1 ? '' : 'es'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-text-faded">
        <span>menos</span>
        {[0, 0.2, 0.5, 0.8, 1].map((r, i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-sm"
            style={{
              background:
                r === 0
                  ? 'rgba(154,163,179,0.07)'
                  : `rgba(239,68,68,${0.25 + r * 0.7})`,
            }}
          />
        ))}
        <span>más</span>
      </div>
    </div>
  );
}
