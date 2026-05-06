import { NextResponse, type NextRequest } from 'next/server';

/**
 * Security headers globales. Aplica también a `/api/*` (en JSON los headers
 * ayudan poco pero mantenemos la consistencia y nosniff cubre algunos casos).
 *
 * NOTA sobre CSP: usamos `unsafe-inline` para `style-src` porque hay estilos
 * inline en componentes del canvas (transforms dinámicas, rotaciones, gradients).
 * Para script-src usamos `'self' 'unsafe-eval'` (Next.js dev requiere eval; en
 * prod se puede endurecer con nonces).
 */
const CSP_HEADER = [
  "default-src 'self'",
  // Open Osint carga fuentes via next/font (que las sirve self), pero permitimos data: por si acaso
  "font-src 'self' data:",
  "img-src 'self' data: https: blob:",
  // unsafe-inline necesario por estilos dinámicos del canvas (transform, gradient inline)
  "style-src 'self' 'unsafe-inline'",
  // unsafe-eval requerido por Next dev/HMR
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  // CSP solo para HTML (rutas no /api/*) — los endpoints JSON no la requieren
  if (!_req.nextUrl.pathname.startsWith('/api/')) {
    res.headers.set('Content-Security-Policy', CSP_HEADER);
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
