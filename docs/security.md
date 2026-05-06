# Security & Privacy

## Modelo de amenazas

| Amenaza | Mitigación |
|---|---|
| Doxxing en tableros públicos | `scanPii` + `DoxxingTrack` con escalado humano |
| Tampering de evidencia | `Hilo Lock` (ed25519 + Merkle root + anclaje opcional) |
| Spam anónimo | Turnstile + `rateLimit` Redis + reputación |
| Unauthorized access | RLS Postgres + tRPC `boardProcedure` |
| Token leak | Sesiones JWT short-lived + Hocuspocus per-board auth |
| Supply-chain | `@noble/*` puro JS, sin deps nativas críticas |

## Datos personales

- `ipHash = sha256(salt + ip + ua)` con salt rotatorio mensual → **GDPR-compliant** (no es PII identificable).
- `email` opcional para contribuciones públicas.
- `User.privacyMode` oculta perfil en boards públicos.

## Hilo Lock — verificación pública

Cualquiera puede verificar un sello con `verifySeal(content, proof)`:

```ts
import { verifySeal } from '@hilo/shared';
const ok = verifySeal(canonicalContent, {
  payloadHash, signature, publicKey, algo: 'ed25519', createdAt
});
```

El `merkleRoot` se publica periódicamente (configurable via `HILO_LOCK_ANCHOR_INTERVAL_MIN`) en una blockchain pública si `anchorTxId` está habilitado — útil para periodistas que necesitan probar prior-art.

## Anti-doxxing

Si una IP/usuario aporta más de `ANTI_DOXXING.maxPersonalDataPerTarget` datos PII contra el mismo `targetKey` (hash del nodo Person) en `windowHours`, se escala automáticamente a moderación humana (`DoxxingTrack.escalated = true`).

## Compliance roadmap

- v1.0: SOC2 Type I (controles de auditoría, accesos, monitoreo).
- v1.1: ISO 27001 readiness.
- Enterprise: single-tenant con jurisdicción seleccionable (US/EU/SA).
