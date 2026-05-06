# Arquitectura

## Diagrama lógico

```
┌──────────────────────────────────────────────────────────────────┐
│                        EDGE / CDN (Cloudflare)                   │
│        WAF · Rate-limit anónimo · Geo-routing · Asset cache      │
└──────────────────────────────────────────────────────────────────┘
                │                          │
                ▼                          ▼
   ┌─────────────────────┐     ┌─────────────────────────┐
   │  apps/web           │     │  apps/realtime           │
   │  Next.js 15 + tRPC  │◄───►│  Hocuspocus (Yjs CRDT)   │
   └─────────────────────┘     └─────────────────────────┘
            │                            │
            ▼                            ▼
   ┌──────────────────┐  ┌──────────────────┐
   │ Postgres+pgvector│  │ Redis            │
   │ (RLS multi-tenant│  │ (presence, queue)│
   └──────────────────┘  └──────────────────┘
            │                    │
            └─── apps/worker ────┘
                    │
                    ▼
              ┌──────────┐
              │ S3 / R2  │
              └──────────┘
```

## Decisiones clave

| Capa | Elección | Razón |
|---|---|---|
| Canvas | React Flow v12 + custom | DX rápido, fallback PixiJS para >1k nodos |
| Realtime | Yjs + Hocuspocus | CRDT sin lock-in, offline-first |
| API | tRPC v11 | Type-safety end-to-end |
| Auth | Auth.js v5 | Magic-link + WebAuthn + SSO en Enterprise |
| Workers | BullMQ + Redis | DLQ, retries, observabilidad |
| Storage | Cloudflare R2 | S3-compat sin egress fees |
| Search | Meilisearch + pgvector | Híbrido FTS + semántico |
| Cripto | @noble/curves (ed25519) | Auditado, sin deps nativas |

## Seguridad

- **RLS** en Postgres por `boardId` y `role`.
- **Rate limit** por IP-hash con salt rotatorio (GDPR-friendly).
- **PII scan** antes de publicar.
- **Anti-doxxing**: `DoxxingTrack` con escalado a moderación.
- **Hilo Lock**: sello ed25519 + merkle root para audit forense.
- **Headers** de seguridad en `middleware.ts`.

## Multi-tenant

- Lógico por `workspaceId` en MVP.
- Físico (single-tenant) opcional para Enterprise via deploy aislado.

## Realtime auth

`apps/realtime/src/index.ts#onAuthenticate` valida que el `token` (userId) sea miembro del board. Tableros públicos permiten lectura anónima en `readOnly`.
