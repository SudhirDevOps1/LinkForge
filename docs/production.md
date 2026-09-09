# 🚀 Production Guide — deploy, backup, retention, health

> P0 code ke saath ship hua sach: health me real DB+storage ping hai,
> standalone Docker output on hai, `upload_tickets` additive table hai.

## Pre-deploy checklist

1. Fresh DB par `npx drizzle-kit push` (postgres) ya provider config
   (`db:push:turso`, `db:push:d1`). **Backup-first**: `pg_dump $DATABASE_URL`.
   Nayi tables additive hain (`upload_tickets`, `profiles.design` nullable) —
   purana data untouched rehta hai.
2. `AUTH_SECRET` 32+ random bytes. `NEXT_PUBLIC_APP_URL` production domain.
3. `APP_DOMAIN` (custom domains), Upstash env (multi-instance rate limits).
4. `GET /api/health` → 200 `{ status: "ok", checks: { db, storage } }`.
   DB down = 503 (orchestrator restart karega).
5. `npm run typecheck` + `npx vitest run` + `npm run build` green.

## Backups

- Postgres: nightly `pg_dump` (cron) + object-store copy.
- Uploads: DB + object-store backups coordinated rakho (keys URLs me hain).
- `npm run cleanup:uploads` daily cron (expired tickets + orphan objects).

## Analytics retention

`ANALYTICS_RETENTION_DAYS` (default 30) — probabilistic GC har ~1% write par.
Exact-deadline chahiye to daily `DELETE FROM events WHERE created_at < ...`
cron lagao (retention cron, docs me "probabilistic" default likha hai).

## Email

Default `MAIL_PROVIDER=console` (dev logs). Public reset ke liye SMTP/MailHog
env set karo (`.env.example` → MAIL section, `src/lib/mail.ts`).

## Security ops

- Webhooks: HTTPS-only, no-redirect, DNS-pinned, 3-attempt retry (lib/outbound.ts).
- Rate limits single-instance in-memory; multi-instance par Upstash (fail-open).
- `npm audit`: 4 moderate (drizzle-kit toolchain) documented; critical/high = blocker.

## Platform notes

- Vercel/Netlify: external Postgres + S3 storage; direct uploads (ticket flow)
  se function payload limits bypass hote hain.
- Docker: `output: "standalone"` on — `docker compose --profile full up`.
- Cloudflare D1: 🚧 experimental — Workers binding verify karke hi production.
