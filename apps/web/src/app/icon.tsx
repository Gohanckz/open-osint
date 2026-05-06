import { ImageResponse } from 'next/og';

/**
 * Favicon dinámico generado por Next.js. Aparece en pestañas, bookmarks, etc.
 * 32x32 — el tamaño estándar de favicon.ico.
 */
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ef4444 0%, #c1272d 100%)',
          borderRadius: 6,
          letterSpacing: '-0.05em',
        }}
      >
        O
      </div>
    ),
    { ...size },
  );
}
