import { ImageResponse } from 'next/og';

/**
 * OG image para previews en Twitter/X, Facebook, LinkedIn, Slack, Discord, etc.
 * Aparece cuando alguien comparte el link.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Open Osint — The Investigation Board';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: '#14171c',
          backgroundImage: `
            linear-gradient(rgba(180,200,220,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,200,220,0.05) 1px, transparent 1px),
            radial-gradient(ellipse at 30% 20%, rgba(99,145,220,0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 70% 80%, rgba(239,68,68,0.15) 0%, transparent 55%),
            linear-gradient(135deg, #181c24 0%, #14171c 50%, #0f1217 100%)
          `,
          backgroundSize: '40px 40px, 40px 40px, 100% 100%, 100% 100%, 100% 100%',
          color: '#e8eaed',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #ef4444 0%, #c1272d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 700,
              color: 'white',
              boxShadow: '0 0 30px rgba(239,68,68,0.4)',
            }}
          >
            O
          </div>
          <span
            style={{
              fontSize: 22,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#e8eaed',
            }}
          >
            Open Osint
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span
            style={{
              fontSize: 22,
              color: '#ef4444',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            The Investigation Board
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 88, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              Conecta los puntos.
            </span>
            <span
              style={{
                fontSize: 88,
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Cuenta la verdad.
            </span>
          </div>
          <span style={{ fontSize: 26, color: '#9aa3b3', maxWidth: 900, lineHeight: 1.3 }}>
            Tableros de investigación visual, colaborativos y open source.
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 18,
            color: '#6b7280',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span>Open Source · MIT</span>
          <span>Real-time · Anti-doxxing · Ranking</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
