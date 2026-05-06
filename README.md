# Open Osint

**The Investigation Board** — Open-source visual intelligence for journalists, analysts and curious citizens.

Open Osint is a real-time collaborative canvas for connecting evidence, people, locations, events and organizations. Build investigation graphs with typed nodes, weighted connections, attachments and a public ranking system to recognize the community's contributions.

> 🔴 **Detective-board aesthetic** · 🌐 **Real-time collaboration (Yjs / Hocuspocus)** · 🛡️ **Anti-doxxing safeguards** · 🏆 **Gamified public ranking** · 🌍 **i18n (Spanish / English)**

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Database Migrations](#database-migrations)
- [Production Deployment](#production-deployment)
- [Internationalization](#internationalization)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- 📋 **Typed nodes**: Person, Company, Event, Evidence, Location, Custom — each with a polaroid/file/post-it visual identity
- 🔗 **Threaded connections**: Family, Professional, Suspect, Financial, Communication, Ownership — color-coded, with strength
- 🤝 **Real-time collaboration** with Yjs + Hocuspocus (presence, cursors, conflict-free merging)
- 🎯 **Public / Private / Unlisted boards** with granular contribution modes (closed, invite, open-pending, open-instant)
- 👥 **Membership flow**: invite users by `@username`, request to join, approve / reject
- 🔔 **In-app notifications** (follows, invites, requests, accepts, rejects)
- 🏆 **Gamified profile**: 5 levels (Novato → Leyenda), score from boards/nodes/connections/followers, GitHub-style activity heatmap
- 🌐 **Public ranking** at `/ranking` with Top-3 podium and full leaderboard
- 🔍 **Public exploration** at `/explore` with featured + recent boards
- 🛡️ **Security hardening**: rate limiting, Turnstile, anti-doxxing tracker, IDOR-safe routers, mass-assignment whitelists
- 🔑 **Full auth flow**: register, login, forgot/reset password (with email via Resend), session security
- 🌍 **i18n**: Spanish (default) and English, switchable from user menu (cookie-based, no URL change)
- 🎨 **Dark mode + custom typography** (Special Elite typewriter, Caveat handwritten, Inter UI)
- 🖼️ **Auto-generated favicon, Apple touch icon and OpenGraph preview** via `next/og`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4 |
| Canvas | ReactFlow (`@xyflow/react`) v12 |
| Real-time | Yjs + Hocuspocus |
| Backend | tRPC v11, NextAuth v5 (Credentials) |
| Database | PostgreSQL 16 + pgvector |
| Cache / queues | Redis 7 |
| ORM | Prisma 6 |
| Object storage | S3-compatible (MinIO local, S3 prod) |
| Search | Meilisearch (optional) |
| Build | Turborepo + pnpm workspaces |
| Validation | Zod |

---

## Project Structure

```
open-osint/
├── apps/
│   ├── web/              # Next.js app (frontend + API routes + tRPC)
│   ├── realtime/         # Hocuspocus WebSocket server
│   └── worker/           # Background jobs (OCR, AI, Osint Lock signing)
├── packages/
│   ├── canvas/           # ReactFlow nodes, edges, Yjs sync
│   ├── ui/               # Buttons, Dialogs, Tooltips, etc.
│   ├── shared/           # Zod schemas, types, crypto helpers
│   ├── db/               # Prisma schema + client
│   └── config/           # Rate limits, anti-doxxing config
└── infra/
    └── docker-compose.yml  # Postgres + Redis + MinIO + Meili
```

> Internal package names use the `@hilo/*` namespace for legacy reasons (the project was initially called *Hilo Rojo*). They're an internal implementation detail and don't affect the user-facing brand.

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js 22+** (required — see `engines` in `package.json`)
- **pnpm 10+**
- **Docker Desktop** running (for Postgres + Redis)
- **Git**

### 1. Clone

```bash
git clone https://github.com/Gohanckz/open-osint.git
cd open-osint
```

### 2. Install dependencies

```bash
pnpm install
```

This installs all workspaces and runs Prisma's postinstall.

### 3. Start infrastructure (Postgres + Redis)

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

Optional services (MinIO for files, Meili for search):

```bash
docker compose -f infra/docker-compose.yml up -d
```

Verify they're up:

```bash
docker ps
```

### 4. Configure environment

Copy the example file and fill in the secrets:

```bash
cp .env.example .env
cp .env.example apps/web/.env.local
```

Edit `.env` and replace the placeholder values (see [Environment Variables](#environment-variables)).

> ⚠️ **Important on Windows**: use `127.0.0.1` instead of `localhost` in your `DATABASE_URL` and `REDIS_URL` to avoid IPv6 resolution issues with Docker.

#### Generate required secrets at once

```bash
# Run these and paste the outputs into your .env
openssl rand -base64 32  # AUTH_SECRET
openssl rand -base64 32  # IP_HASH_SALT
openssl rand -base64 32  # HOCUSPOCUS_SECRET (only if using realtime)
```

### 5. Apply database schema

```bash
pnpm --filter @hilo/db db:push
# or, if you prefer migrations:
pnpm --filter @hilo/db migrate
```

(Optional) Seed initial data:

```bash
pnpm --filter @hilo/db seed
```

### 6. Generate the Prisma client

```bash
pnpm --filter @hilo/db generate
```

### 7. Run

```bash
pnpm --filter @hilo/web dev
```

App is now at **http://localhost:3001**.

> 💡 **First-time login tip**: If you ever see an `HTTP 431 — Request Header Fields Too Large` error after logging in, your browser has accumulated cookies that exceed its local cookie limit. The fastest fix is to open the app at `http://127.0.0.1:3001` (different hostname → no cookies) or clear cookies for `localhost:3001` from DevTools (`F12` → Application → Cookies → Clear).

### 8. (Optional) Tweak dev server for cookie-heavy debugging

If you're testing with very large avatars or attachments and hit header-size errors, increase Node's HTTP header limit:

```bash
# Add cross-env if you don't have it
pnpm --filter @hilo/web add -D cross-env
```

Then in `apps/web/package.json`:

```json
{
  "scripts": {
    "dev": "cross-env NODE_OPTIONS=--max-http-header-size=32768 next dev -p 3001"
  }
}
```

---

## Environment Variables

Required and optional vars. See `.env.example` for the full template.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection string | `postgresql://hilo:hilo@127.0.0.1:5432/hilo?schema=public` |
| `DIRECT_URL` | Same as above (used by Prisma migrations) | same as `DATABASE_URL` |
| `REDIS_URL` | Redis connection string | `redis://127.0.0.1:6379` |
| `AUTH_SECRET` | NextAuth secret (min 32 chars) | `openssl rand -base64 32` |
| `AUTH_URL` / `NEXTAUTH_URL` | Public app URL | `http://localhost:3001` |
| `IP_HASH_SALT` | Salt for hashing IPs (anti-doxxing) | `openssl rand -base64 32` |

### Optional (recommended for production)

| Variable | Description | When needed |
|----------|-------------|-------------|
| `TURNSTILE_SECRET` | Cloudflare Turnstile secret | If using public anonymous contributions |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | Same |
| `HOCUSPOCUS_URL` | Real-time WS server URL | For collaboration |
| `HOCUSPOCUS_SECRET` | Shared secret with Hocuspocus | Same |
| `S3_ENDPOINT` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET` | Object storage | For attachments / avatars at scale |
| `MEILI_HOST` / `MEILI_KEY` | Meilisearch | For search |
| `ANTHROPIC_API_KEY` | Claude API | For AI assist features |
| `RESEND_API_KEY` / `EMAIL_FROM` | Email via Resend | **Forgot password** (sends real emails). In dev without it, the reset link is printed to the server console. |
| `HILO_LOCK_PRIVATE_KEY` | ed25519 private key | For cryptographic seals |

> 🔐 **Forgot password in development**: if you don't set `RESEND_API_KEY`, the `/forgot-password` flow still works — it generates a valid reset token and prints it to your terminal:
>
> ```
> [forgot-password] Reset link for user@email.com:
> http://localhost:3001/reset-password?token=abc123...
> ```
>
> Copy that URL into your browser to test the reset flow without a real email service.

### Generating secrets

```bash
# AUTH_SECRET, IP_HASH_SALT, HOCUSPOCUS_SECRET
openssl rand -base64 32

# HILO_LOCK_PRIVATE_KEY (ed25519 hex-encoded 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Running the Application

### Frontend only (most common during dev)

```bash
pnpm --filter @hilo/web dev
```

### Full monorepo (web + realtime + worker)

```bash
pnpm dev
```

(Each app runs in parallel via Turborepo.)

### Just realtime server

```bash
pnpm --filter @hilo/realtime dev
```

### Build & start production locally

```bash
pnpm build
pnpm --filter @hilo/web start
```

---

## Database Migrations

Open Osint uses Prisma. Two ways to evolve the schema:

### `db push` (development — fast iteration)

```bash
pnpm --filter @hilo/db db:push
```

Syncs your `schema.prisma` directly. **Don't use in prod**.

### `migrate dev` (development — versioned)

```bash
pnpm --filter @hilo/db migrate
# enter migration name when prompted
```

Creates a SQL migration file in `packages/db/prisma/migrations/`. Commit these.

### `migrate deploy` (production)

```bash
pnpm --filter @hilo/db migrate:deploy
```

Applies pending migrations without prompting.

### Regenerate Prisma client

After any schema change you must regenerate types:

```bash
pnpm --filter @hilo/db generate
```

If you're on Windows and the dev server is running, **stop it first** — the `query_engine-windows.dll.node` is locked while running.

### Inspect the database

```bash
pnpm --filter @hilo/db studio
```

Opens Prisma Studio at http://localhost:5555.

---

## Production Deployment

### Vercel + Neon (recommended)

The fastest path. Vercel handles Next.js + serverless; Neon provides Postgres with branching.

#### 1. Database

Create a Neon project at https://neon.tech. Take the **pooled** connection string (for `DATABASE_URL`) and the **direct** connection (for `DIRECT_URL`).

#### 2. Redis

Create a free Redis instance at https://upstash.com. Copy the connection URL.

#### 3. Push schema

```bash
DATABASE_URL="postgres://...@neon.tech/db?sslmode=require" \
DIRECT_URL="postgres://...@neon.tech/db?sslmode=require" \
pnpm --filter @hilo/db migrate:deploy
```

#### 4. Vercel project

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy from repo root
vercel --cwd apps/web
```

In the Vercel dashboard, set all required env vars (see table above) plus:

```
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
AUTH_URL=https://your-domain.com
```

#### 5. Real-time (Hocuspocus)

The Hocuspocus WebSocket server can't run on Vercel (no long-lived connections). Deploy `apps/realtime` to:

- **Fly.io**: `fly launch` from `apps/realtime/` (recommended)
- **Railway**: connect repo, set root to `apps/realtime`
- **Render**: web service from the same path

Set `HOCUSPOCUS_URL` (in `apps/web` env) to the public URL of that deployment (e.g. `wss://realtime.yourapp.com`).

### Self-hosted (Docker)

A complete production stack ships in this repo: [`apps/web/Dockerfile`](./apps/web/Dockerfile) (multi-stage build, ~200MB final image, runs as non-root) and [`infra/docker-compose.prod.yml`](./infra/docker-compose.prod.yml) (web + Postgres + Redis with healthchecks).

#### Prerequisites
- Docker + Docker Compose
- A domain pointed to your server
- Reverse proxy (Caddy / Traefik / Nginx) for TLS

#### 1. Configure secrets

Create `.env.prod` at the repo root with at minimum:

```bash
# Database
POSTGRES_USER=osint
POSTGRES_PASSWORD="$(openssl rand -base64 24)"
POSTGRES_DB=osint

# App
AUTH_SECRET="$(openssl rand -base64 32)"
IP_HASH_SALT="$(openssl rand -base64 32)"
APP_DOMAIN=open-osint.example.com

# Optional
RESEND_API_KEY=
TURNSTILE_SECRET=
HOCUSPOCUS_URL=
HOCUSPOCUS_SECRET=
```

#### 2. Build the image

```bash
# From the repository root
docker build -f apps/web/Dockerfile -t openosint/web:latest .
```

The build is multi-stage: deps install → Next.js build → minimal runtime. Takes 3-5 min the first time, much faster on rebuilds thanks to layer caching.

#### 3. Start the stack

```bash
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod up -d
```

#### 4. Apply migrations

```bash
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod exec web \
  node -e "require('child_process').execSync('npx prisma migrate deploy', {stdio:'inherit'})"
```

Or run migrations from your dev machine pointing to the production DB:

```bash
DATABASE_URL="postgresql://osint:<password>@<server>:5432/osint" \
DIRECT_URL="postgresql://osint:<password>@<server>:5432/osint" \
pnpm --filter @hilo/db migrate:deploy
```

#### 5. Reverse proxy

Your reverse proxy must:
- Route `https://yourapp.com` → web container (port 3001)
- Route `wss://realtime.yourapp.com` → realtime container (port 1234) — only if using collaboration
- Forward `cf-connecting-ip` / `x-forwarded-for` headers (used for IP hashing in anti-doxxing)

**Caddy example** (`Caddyfile`):

```
open-osint.example.com {
  reverse_proxy localhost:3001
}
```

#### 6. Operational notes

```bash
# View logs
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod logs -f web

# Restart after config change
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod restart web

# Backup the database
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod exec postgres \
  pg_dump -U osint osint > backup.sql

# Update to new version
git pull
docker build -f apps/web/Dockerfile -t openosint/web:latest .
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod up -d
```

> The realtime container (`apps/realtime`) is optional — collaboration via Yjs requires it but the app works fully without (just no live cursors / multi-user editing). A Dockerfile for it is on the roadmap.

---

## Internationalization

Open Osint ships with **Spanish (default)** and **English**. Users can switch language from the avatar menu (top-right).

### Switching language

The selection is stored in a cookie (`oo_locale`) for 1 year. The server reads it on each request and renders accordingly. No URL-based locale routing — keeps URLs clean.

### Adding a new language

1. Create `apps/web/src/i18n/messages/<code>.ts` matching the shape of `es.ts`:

```ts
import type { Messages } from './es';

export const fr: Messages = {
  brand: 'Open Osint',
  // … translate every key
};
```

2. Register it in `apps/web/src/i18n/locales.ts`:

```ts
export const LOCALES = ['es', 'en', 'fr'] as const;
export const LOCALE_LABELS: Record<Locale, ...> = {
  // …
  fr: { native: 'Français', flag: '🇫🇷' },
};
```

3. Register it in `apps/web/src/i18n/server.ts` and `client.tsx`:

```ts
import { fr } from './messages/fr';
const dictionaries = { es, en, fr } as const;
```

That's it — the language switcher and detection logic pick it up automatically.

### Using translations in code

**Client component:**

```tsx
'use client';
import { useT } from '@/i18n/client';

export function MyButton() {
  const t = useT();
  return <button>{t.common.save}</button>;
}
```

**Server component:**

```tsx
import { getMessages } from '@/i18n/server';

export default async function Page() {
  const { t } = await getMessages();
  return <h1>{t.dashboard.yourBoards}</h1>;
}
```

---

## Security

This project takes security seriously. Highlights:

- **No mass assignment**: tRPC mutations use Zod whitelists, not generic record patches.
- **IDOR-safe**: every CRUD verifies the resource belongs to the authenticated board context (`{ id, boardId }` filter).
- **Rate limiting** in-memory on auth, follows, password change, profile updates, notifications.
- **Anti-doxxing tracker**: detects PII contributed against the same target by the same source within a sliding window, escalates to flagged.
- **Bcrypt with timing-attack mitigation**: dummy compare runs even when the user doesn't exist.
- **Turnstile** server-side verification for anonymous public contributions.
- **CSP, X-Frame-Options, nosniff, Permissions-Policy** in middleware.
- **IP hashing** with mandatory salt in production (throws if missing).
- **Privacy mode** that hides users from public ranking, exploration and profile pages.

Found a security issue? Please email `gohanckz@gmail.com` (do NOT open a public issue).

---

## Contributing

Contributions welcome! The project follows standard GitHub flow:

1. Fork → branch → PR
2. Include a description of what changed and why
3. Run `pnpm typecheck` and `pnpm lint` before pushing
4. Commit messages: `feat: …`, `fix: …`, `chore: …`

### Local development workflow

```bash
# Start infra
docker compose -f infra/docker-compose.yml up -d postgres redis

# Run dev server
pnpm --filter @hilo/web dev

# In another terminal, regenerate types after schema changes
pnpm --filter @hilo/db generate
```

### Common scripts

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Run all workspaces in parallel |
| `pnpm --filter @hilo/web dev` | Run only the Next.js app |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm --filter @hilo/db generate` | Regenerate Prisma client |
| `pnpm --filter @hilo/db studio` | Open Prisma Studio |
| `pnpm --filter @hilo/db db:push` | Push schema to DB (no migration file) |
| `pnpm --filter @hilo/db migrate` | Create + apply a migration |

---

## Troubleshooting

### `Cannot find native binding` on Windows

Some optional native deps (lightningcss, @tailwindcss/oxide) aren't always installed correctly by pnpm on Windows. Workaround:

```bash
cd node_modules/.pnpm/lightningcss@1.32.0/node_modules/lightningcss
npm install --no-save lightningcss-win32-x64-msvc

cd ../../@tailwindcss+oxide@4.2.4/node_modules/@tailwindcss/oxide
npm install --no-save @tailwindcss/oxide-win32-x64-msvc
```

Then restart the dev server.

### `Prisma Client could not locate the Query Engine`

After schema changes, you must regenerate. **Stop the dev server first** on Windows (the engine binary is locked while running):

```bash
pnpm --filter @hilo/db generate
```

### `Can't reach database server`

Make sure Docker Desktop is running and your Postgres container is healthy:

```bash
docker ps
# expect to see hilo-postgres-1 with "(healthy)"
```

If `localhost` doesn't resolve, switch to `127.0.0.1` in your `DATABASE_URL`.

### `HTTP 431 — Request Header Fields Too Large`

This means your **browser** is sending cookies too large for the local HTTP limit. Usually happens after old development sessions accumulated cookies (e.g. an old NextAuth JWT containing an avatar data URL).

**Fix (3 options):**

1. **Use `127.0.0.1:3001`** instead of `localhost:3001` — a different hostname has no old cookies.
2. **Clear cookies** in DevTools: `F12` → Application → Cookies → `localhost:3001` → Clear all.
3. **Run from console** on the error page: `F12` → Console → paste:
   ```js
   document.cookie.split(';').forEach(c => {
     const n = c.split('=')[0].trim();
     document.cookie = `${n}=; expires=Thu, 01 Jan 1970; path=/;`;
   });
   location.reload();
   ```

The current code does **not** persist the avatar in the JWT (only `userId`), so new sessions will be small. The 431 only affects browsers that have a stale large cookie.

### Page shows the wrong language

Clear the `oo_locale` cookie or switch via the avatar menu (top-right). The language preference is stored 1 year via cookie. The server reads it on each request — no URL changes.

### Login redirects but I don't see the dashboard

Check the dev server terminal for errors — usually it's a Prisma issue (you forgot to regenerate the client after a schema change) or DB not running. Run:

```bash
pnpm --filter @hilo/db generate
```

And restart `pnpm --filter @hilo/web dev`.

### `Module not found: ... lightningcss / @tailwindcss/oxide` on Windows

Already covered in the section above ("Cannot find native binding"). Use the `npm install --no-save` workaround.

---

## License

[MIT + Commons Clause](./LICENSE) — free to use, study, and contribute; commercial use reserved exclusively by the author.

---

## Acknowledgements

- [ReactFlow / xyflow](https://reactflow.dev/) for the canvas engine
- [Yjs](https://yjs.dev/) and [Hocuspocus](https://www.hocuspocus.dev/) for real-time CRDT
- [Prisma](https://www.prisma.io/) for the typesafe ORM
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Lucide](https://lucide.dev/) for the icon set
- [UI/UX Pro Max](https://uupm.cc) skill for design guidance during development

Built with ❤️ for journalists, analysts and everyone curious enough to chase a thread.
