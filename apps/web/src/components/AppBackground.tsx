/**
 * Fondo dark slate compartido (mismo lenguaje que el canvas).
 * Es un div fijo `-z-10` que se monta una sola vez por página.
 */
export function AppBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: 'var(--color-bg-canvas)',
        backgroundImage: `
          linear-gradient(rgba(180,200,220,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(180,200,220,0.04) 1px, transparent 1px),
          radial-gradient(ellipse at 20% 0%, rgba(99,145,220,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(239,68,68,0.05) 0%, transparent 50%),
          linear-gradient(135deg, #181c24 0%, #14171c 50%, #0f1217 100%)
        `,
        backgroundSize: '32px 32px, 32px 32px, 100% 100%, 100% 100%, 100% 100%',
      }}
    />
  );
}
