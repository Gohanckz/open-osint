import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { prisma } from '@hilo/db';
import { enforceRateLimit, getClientIp } from '@/server/rate-limit';

const ForgotSchema = z.object({
  email: z.string().email().toLowerCase().max(200),
});

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export async function POST(req: Request) {
  // Rate limit por IP: máx 5 / 15 minutos (anti-enum + anti-spam)
  const limited = enforceRateLimit(`forgot:${getClientIp(req)}`, {
    window: 15 * 60_000,
    max: 5,
  });
  if (limited) return limited;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ForgotSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  const { email } = parsed.data;

  // Anti-enumeration: SIEMPRE devolvemos ok=true al cliente. La existencia o
  // no del email no se filtra. Si existe, se genera un token y se envía email.
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    // Guardamos el token en VerificationToken (modelo ya existente en el schema)
    // identifier = email para poder buscarlo al verificar.
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    // Email: si RESEND_API_KEY está configurado, enviamos. Sino, solo loggeamos
    // (en dev el usuario puede ver el token en la consola del servidor).
    const resetUrl = `${process.env.AUTH_URL ?? 'http://localhost:3001'}/reset-password?token=${token}`;
    if (process.env.RESEND_API_KEY) {
      await sendResetEmail(email, resetUrl).catch((err) => {
        console.error('[forgot-password] sendResetEmail failed', err);
      });
    } else {
      // Dev only: imprime el link para que el desarrollador pueda continuar el flujo
      console.log(`\n[forgot-password] Reset link for ${email}:\n${resetUrl}\n`);
    }
  }

  return NextResponse.json({
    ok: true,
    message: 'Si existe una cuenta con ese email, recibirás un link para restablecer.',
  });
}

async function sendResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const from = process.env.EMAIL_FROM ?? 'Open Osint <noreply@open-osint.app>';

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Restablece tu contraseña en Open Osint',
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#14171c;color:#e8eaed">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px">
            <div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#ef4444 0%,#c1272d 100%);display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:700">O</div>
            <span style="font-size:14px;letter-spacing:0.3em;text-transform:uppercase">Open Osint</span>
          </div>
          <h1 style="font-size:24px;margin:0 0 16px">Restablece tu contraseña</h1>
          <p style="color:#9aa3b3;line-height:1.5">
            Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, ignora este email.
          </p>
          <p style="margin:32px 0">
            <a href="${resetUrl}" style="display:inline-block;background:#ef4444;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500">
              Restablecer contraseña
            </a>
          </p>
          <p style="color:#6b7280;font-size:12px;line-height:1.5">
            El link expira en 1 hora. Si no funciona, copia y pega esta URL en tu navegador:<br>
            <span style="word-break:break-all">${resetUrl}</span>
          </p>
        </div>
      `,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}`);
}
