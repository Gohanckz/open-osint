# Roadmap

## Sprint 0 — Fundaciones (esta entrega)

- [x] Monorepo Turborepo + pnpm workspaces
- [x] Prisma schema completo con pgvector
- [x] @hilo/shared (Zod, crypto, PII, Hilo Lock ed25519)
- [x] @hilo/ui design system (tokens, Radix, dark mode)
- [x] @hilo/canvas (React Flow + Yjs sync + clustering)
- [x] Next.js 15 con tRPC v11 + Auth.js v5
- [x] Hocuspocus realtime con auth por board
- [x] BullMQ workers (OCR, IA, embeddings, Hilo Lock)
- [x] docker-compose + GitHub Actions CI

## v0.1 (6 sem) — "Solo tú"

- [ ] Magic-link login completo (Resend)
- [ ] Storage S3/R2 con uploads firmados
- [ ] Markdown rich editor en Inspector
- [ ] Export PNG/PDF
- [ ] Search con Meilisearch

## v0.2 (4 sem) — "Colaboración"

- [ ] Cursores remotos en canvas
- [ ] Threads de comentarios resueltos
- [ ] Versionado visual (diff de tablero)
- [ ] Webhooks de actividad

## v0.3 (4 sem) — "Público y moderación"

- [ ] Diff visual de Contribution
- [ ] Turnstile + ratelimit por IP
- [ ] Workflow de Reports
- [ ] Sistema de reputación

## v0.4 (6 sem) — "IA"

- [ ] Sugerencias de duplicados / conexiones (claude-haiku-4-5)
- [ ] Embeddings + búsqueda semántica
- [ ] Tags inteligentes
- [ ] Resumen de cluster (claude-sonnet-4-6)
- [ ] OCR real (Tesseract o Mistral)

## v0.5 (6 sem) — "Profesional"

- [ ] Plantillas marketplace
- [ ] Comparador de versiones
- [ ] Export GraphML / Gephi
- [ ] API pública

## v1.0 (8 sem) — "Enterprise"

- [ ] SSO SAML/OIDC
- [ ] Audit log con sello criptográfico (Hilo Lock anclado periódicamente)
- [ ] DLP automático
- [ ] Compliance docs (SOC2 path)
