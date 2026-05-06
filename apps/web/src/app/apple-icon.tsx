import { ImageResponse } from 'next/og';

/**
 * Apple touch icon — para cuando el usuario añade la app a la pantalla
 * de inicio en iOS / iPadOS.
 */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #ef4444 0%, #c1272d 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Glow detrás de la O */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)',
          }}
        />
        <div
          style={{
            fontSize: 124,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.05em',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 1,
          }}
        >
          O
        </div>
      </div>
    ),
    { ...size },
  );
}
