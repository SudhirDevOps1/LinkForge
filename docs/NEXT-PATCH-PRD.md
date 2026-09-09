# NEXT-PATCH PRD — LinkForge Strict Gap-Fix Release

> Source of truth: `next-patch.md` (1368 lines) vs actual disk state.
> Principle: **bina kuch hataye** — additive-only, no delete of working features/data.
> Date: 2026-09-09 | Type: corrective patch, not v2 rewrite.

## 0. Executive Summary (strict verdict)

`next-patch.md:1-792` = real setup docs. `next-patch.md:793-1367` = build-log jisme **~35 `Created` files claim hain jo disk par EXIST HI NAHI KARTE**.
App ka core (builtin auth, postgres/neon/turso driver, local+S3 upload basic, theme/layout, analytics summary, webhooks basic, landing, legal) **WORKING** hai.
Lekin docs me jo "production-grade / verified / complete" bola gaya, usme se ye **FAKE ya HALF-BROKEN** hai:

| # | Claim | Reality |
|---|-------|---------|
| 1 | Clerk / NextAuth / Neon Auth ready (`next-patch.md:46-78`) | `src/lib/auth/external.ts:75-80,120-125` sab `throw 501`. Koi SDK, route, webhook, JWT verify nahi. |
| 2 | Supabase full + social | Sirf email/pass REST (`external.ts:58-73,97-118`). Koi callback/social, koi profile creation nahi. |
| 3 | `mapExternalUser` unified | `external.ts:27-45` user banata hai par **profile row nahi** (vs builtin `lib/auth/index.ts:91-97`). External user = bio page bina = broken. Name/avatar update bhi nahi. |
| 4 | `sha256(AUTH_SECRET::ip)` privacy | Jhooth. `lib/auth/index.ts:114` = unsalted `sha256Hex(ip).slice(0,32)`. Salted `lib/crypto.ts:32-35` kabhi call nahi hota. |
| 5 | Mail / reset delivery | `lib/mail*` file hi nahi. `api/auth/forgot/route.ts:16` non-existent file ko point karta hai. Sirf `mailOutbox` table. |
| 6 | D1 production ready | Scaffold. `db/providers/d1.ts:16-29` binding throw, `wrangler.toml:11-14` commented, `next-patch.md:369` khud kehta "must not be presented as verified". |
| 7 | Supabase DB separate provider | Alias hai. `db/index.ts:35-36` + `providers/postgres.ts:12-15` sirf URL pick. |
| 8 | Isomorphic schema + portable tx | Galat. pg (`uuid.defaultRandom/bigserial/timestamp tz`) vs `schema.sqlite.ts` (`text PK no default/integer bool/timestamp_ms`). SQLite me `id` bina default = fail. `.returning()` 13+ jagah D1 par tootega. `db/index.ts:18` unsafe cast. `isSqliteProvider` 0 usage. `neon-http` me interactive tx nahi. |
| 9 | `POST /api/media/presign → PUT → POST /api/media/complete` (`:327,329`) | **Exist nahi karta.** `glob api/media/**` = sirf `route.ts` + `[id]/route.ts`. Koi ticket table, koi `HeadObject`, koi signature check, koi `file-type` dep nahi. |
| 10 | Dropzone presign/progress/cancel/retry | `components/file-dropzone.tsx:42-67` single `fetch(/api/media)`. Koi progress/cancel. |
| 11 | Delete guards (provider-mismatch + link-ref) | `api/media/[id]/route.ts:30-38` unconditional delete. Link tootega. |
| 12 | Range/206 seek + disposition/length headers | `api/files/[folder]/[name]/route.ts:50-55` sirf 3 headers. Koi `Range/206/Accept-Ranges` nahi. |
| 13 | Vercel-Blob round-trip | `lib/storage/index.ts:87-102`: `getUrl(key){return key}`, `delete(key)` URL-vs-key mismatch = broken. |
| 14 | `upload-validation.ts`, `cleanup-uploads.ts`, `docs/media.md` | Teenon missing (glob zero). |
| 15 | Design Studio 30+ controls/undo/QR/per-card | `appearance-editor.tsx:1-145` sirf `theme+layout`. `customization.tsx:77` fake save (sirf `setSaved(true)`, koi fetch nahi). `icons.tsx/icon-picker/share-button/design-store/appearance.ts/api/design` sab missing. |
| 16 | Analytics filters/comparison/feed/refresh + CSV safety | Sirf `?days=` (`analytics/page.tsx:28-40`). `analytics-extras.tsx/csv.ts` missing. `api/analytics/export/route.ts:9-12` me `=+-@` prefix nahi = formula injection. Retention probabilistic (`Math.random()<0.01`). |
| 17 | GitHub non-destructive import | Ulta: `api/profile/import/route.ts:42-63` pehle `delete(links)` = destructive. `github.ts/github-sync.ts/api/integrations/github` missing. Export me design nahi. Homepage upstream `coleam00` ko link (`app/page.tsx:117,403`), `SudhirDevOps1/LinkForge` nahi. |
| 18 | Landing "no fake stats" | `landing/sections.tsx:198-223` me `Priya/Rohan/Sneha` invented testimonials. Comparison pricing unverified. |
| 19 | Webhook SSRF + retry | `lib/webhooks.ts:17-39` me koi HTTPS-only/redirect/DNS-pin/private-IP check nahi. `outbound.ts` missing. Best-effort only, retry queue nahi. |
| 20 | Health/Deploy/CI | `api/health/route.ts:8-20` me DB ping nahi (sirf env echo). `Dockerfile:24-25` `.next/standalone` copy par `next.config.ts` me `output:standalone` nahi = docker broken. `wrangler.toml:8` me Vercel path. `package.json` me `deploy:*` scripts nahi. `.github/workflows/ci.yml`, `playwright.config.ts`, `tests/studio.test.ts/workspace.spec.ts`, `scripts/sync-github/check-database/cleanup-uploads`, `docs/production.md` sab missing. Test-count "80/65" galat (unit ~80, koi e2e nahi). |

## 1. Goals

1. Har documented claim ko ya to **real implement** karo ya docs me **scaffold / not-verified** label do — jhootha "working" nahi.
2. Sab fix **additive migration** se: purane users/profiles/links/events kabhi delete/migrate nahi.
3. Security gaps (SSRF, CSV injection, CSRF bypass, unsalted IP, destructive import) band karo.
4. Media flow ko real S3-ticket flow banao **aur** purana multipart path chalu rakho (fallback).
5. External auth ko ya to complete karo ya explicit 501 + docs; aadha-wada "bridge" mat bolo.
6. Deploy/CI/health ko real verification do.

## 2. Non-Goals (bina kuch hataye)

- Koi working route/component/table drop nahi. Koi demo data force-overwrite nahi.
- Koi new DB (Mongo etc.), koi framework migration, koi UI redesign nahi.
- Fake testimonials ko "real" mat bolo — ya to hatao ya `Sample` label do (yeh ekmatra allowed content correction hai).

## 3. Scope — P0 (must, patch blocking)

### P0-A Auth honesty + safety
- A1. `mapExternalUser` me profile auto-create + name/avatar update (`allocateSlug` reuse). Acceptance: external signup ke baad `/[slug]` 200.
- A2. `AUTH_SECRET`-salted IP hash (`hashIp` ko wire karo) ya docs me unsalted likho. Acceptance: `grep hashIp src/lib/auth` hit + test.
- A3. `lib/mail.ts` adapter interface + `mailOutbox` consumer doc; `forgot/route.ts:16` comment fix. Acceptance: file exists, MailHog/SMTP env documented.
- A4. CSRF: `Origin==null` (curl/non-browser) ko mutations par block ya explicit allowlist + test. Acceptance: `tests/security` me curl-POST 403 case.
- A5. Clerk/NextAuth/Neon: ya to `@clerk/nextjs` + webhook + `(auth)` mount + JWT verify implement karo, **ya** `external.ts` + `docs/auth.md` + `.env.example` me `NOT IMPLEMENTED — 501` badge. Aadha claim nahi. Acceptance: docs ↔ code 1:1.

### P0-B DB honesty
- B1. Supabase row ko "Postgres-compatible URL preset" likho, alag provider mat bolo. Acceptance: docs table fix.
- B2. D1 ko `Experimental — not verified on Workers` badge (`docs/database.md` + README + `.env.example`). `wrangler.toml` binding uncomment + `getRequestContext` wiring ya "manual" likho.
- B3. SQLite defaults: `schema.sqlite.ts` me `id` default (`randomUUID`) + timestamp defaults, ya insert layer me id inject. Acceptance: `vitest` sqlite insert bina id pass.
- B4. `.returning()` audit: D1 path par `returning` hatao ya fallback select. Acceptance: grep list + D1-local test.
- B5. `isSqliteProvider` ko actually use karo (schema select) ya dead-code hatao.

### P0-C Media/S3 ticket flow (real)
- C1. `upload_tickets` table (additive): `id, profileId, provider, key, expectedMime, expectedSize, expiresAt, usedAt, createdAt`.
- C2. `POST /api/media/presign` (general files, sirf avatar nahi) + `POST /api/media/complete` (owner/expiry/provider/size/mime/magic-byte via `file-type`, single-use `usedAt`). Acceptance: presign→PUT→complete→201, reuse→410, wrong-owner→403, oversize→413.
- C3. `file-dropzone.tsx` me branch: S3-family = presign flow (progress via XHR + cancel/retry), local/blob = existing multipart. Purana path mat hatao.
- C4. Delete guard: provider-mismatch refuse + `links.url == file.url` check → 409 with referencing link ids. Acceptance: referenced file delete 409, unreferenced 200.
- C5. `files/[folder]/[name]` me `Accept-Ranges/Content-Length/Content-Disposition/206` + `Range` parse. Acceptance: `Range: bytes=0-1023` → 206.
- C6. Vercel-Blob `getUrl/delete` fix (store full URL, delete by URL). Acceptance: round-trip test.
- C7. `lib/upload-validation.ts` (ext↔mime map, magic-byte, filename sanitize) + `scripts/cleanup-uploads.ts` (expired tickets + orphan Head/Delete) + `docs/media.md` (CORS JSON, lifecycle warning, R2 public URL note).

### P0-D Destructive import fix
- D1. `POST /api/profile/import` default = **merge/skip-duplicate-URL**; `?mode=replace` par hi delete. Design settings include. Acceptance: re-import se count same (idempotent), manual links survive.
- D2. Export me `design` block add. Acceptance: export→import round-trip me theme/layout same.

### P0-E Webhook SSRF + health + docker
- E1. `lib/outbound.ts`: https-only, no-redirect, timeout 5s, DNS-pin + private-IP reject (`10/172.16/192.168/127/169.254/::1`). `webhooks.ts:deliver` use kare. Acceptance: `http://169.254.169.254` → blocked test.
- E2. Retry queue (DB `webhook_deliveries` ya in-DB attempts with backoff; minimum: 3 attempts log). Best-effort-only nahi.
- E3. `GET /api/health` me `db.select 1` ping + storage ping + `{checks:{db,storage}}`. Acceptance: DB down → 503.
- E4. `next.config.ts` me `output:"standalone"` (Dockerfile se match) ya Dockerfile fix. Acceptance: `docker build` pass.
- E5. `package.json` me `deploy:vercel/cloudflare/netlify`, `db:push:*`, `cleanup:uploads` scripts + missing deps (`file-type`, optional `qrcode.react` — warna QR claim hatao).

## 4. Scope — P1 (should, same patch agar time)

- Design Studio: real persist (`PATCH /api/profile` me design JSON), icon-size/spacing/color/font controls, per-card style, undo/redo (client), QR/share dialog (`qrcode.react` add ya custom SVG). `customization.tsx` fake-save hatao.
- Analytics: device filter, period-over-period %, activity feed (latest events), refresh button, CSV `=+-@` sanitizer (`lib/csv.ts`), retention cron doc (exact deadline chahiye to cron, warna "probabilistic" likho).
- GitHub: `lib/github.ts` (public profile/repos fetch) + preview-before-import UI + `scripts/sync-github.ts` (backup-first, additive). Homepage links `SudhirDevOps1/LinkForge`.
- Landing: testimonials ko `Sample` label ya real quotes; comparison me "as of 2026, verify" note.
- CI: `.github/workflows/ci.yml` (typecheck+lint+vitest+build), `playwright.config.ts` + 2 smoke specs (studio persist, media upload/serve).

## 5. Scope — P2 (next release, is patch me docs-only)

- Neon Auth JWT + Clerk full + NextAuth full (bada kaam — is patch me sirf honesty badge).
- D1 Workers native + batch tx + Turso hosted e2e.
- Malware scan/quarantine, private-vault encryption (explicit non-goal as vault).
- Multi-team roles beyond `team_members` CRUD.

## 6. API Contracts (additive, breaking nahi)

```
POST /api/media/presign {mime,size,folder} → {ticketId, url(PUT), key, expiresAt}
POST /api/media/complete {ticketId, key} → 201 {media} | 403/410/413
POST /api/profile/import?mode=merge(default)|replace
GET  /api/health → {status, checks:{db,storage}, providers}
DELETE /api/media/[id] → 409 {referencedBy:[linkIds]} | 200
```

## 7. DB Migrations (additive only)

- `upload_tickets` CREATE (fresh). `mediaFiles` ALTER nahi ( guard code-level).
- `webhook_deliveries` CREATE (attempts log).
- `profiles.design` JSON column ADD (nullable) — existing theme/layout untouched.
- `npx drizzle-kit push` per-provider; backup-first (`pg_dump` / file copy) mandatory.

## 8. Security Requirements

- SSRF block + test, CSRF strict + test, salted IP + test, CSV sanitize + test, ticket single-use + test, delete-guard + test.
- `npm audit`: 0 critical/high (4 moderate drizzle-kit allowed, documented).
- Secrets: koi hardcode nahi, `.env.example` placeholders only.

## 9. Test Plan (patch gate)

```
npm run typecheck (0 errors)
npm run lint (0 warnings — 2 old navigation warnings fix)
npx vitest run (existing ~80 + new: auth-external, ticket-flow, delete-guard, range, ssrf, csv, import-merge, sqlite-defaults)
npm run build (0 errors, no standalone-trace warning)
docker build (pass)
manual: presign→PUT→complete, referenced-delete 409, Range 206, health 503 on DB-down
```

## 10. Docs to Update

`docs/auth.md` (501 badges), `docs/database.md` (supabase alias + D1 experimental), `docs/media.md` (NEW — CORS/lifecycle/ticket), `docs/production.md` (NEW — health/cron/backup), `docs/security.md` (SSRF/CSV/CSRF truth), `README.md` (test-count + repo link fix), `.env.example` (missing keys + comments).

## 11. GitHub Handoff & Push Workflow (additive — koi code change nahi)

- Target repo: `https://github.com/SudhirDevOps1/LinkForge.git` (source of truth for push).
- Strategy: **local commit first → test verify → push only on user approval.** Bina bole `git push` nahi.
- Steps:
  1. `git init` (agar `.git` nahi) + `git remote add origin https://github.com/SudhirDevOps1/LinkForge.git` (agar remote nahi).
  2. `git add` (gitignored: `.env`, `node_modules/`, `.next/`, `uploads/` runtime, `*.sqlite/*.db`, `drizzle/`) + local `git commit`.
  3. Verify gate: `npm run typecheck` + `npx vitest run` (+ `npm run lint` best-effort) — sab green tabhi push-ready.
  4. Push: sirf user ke "push karo" bolne par — `git push -u origin <branch>` (default `main`, ya user-batayi branch). Force-push kabhi nahi.
- Never push: `.env`/secrets, `node_modules/`, `.next/`, uploaded media, local `*.sqlite/*.db`, `backups/`.

## 12. Verified Working Matrix (disk + test evidence, 2026-09-09)

> Sawal: "jo jo esmein hai wo app mein working hai na?" — Jawab: **neeche wali list disk par maujood + test me green hai.** Baaki sab (§0 gaps 1–20) missing/skeleton hai aur Phases 1–7 me fix hoga. Koi purani line edit/delete nahi ki — ye section sirf ADD hai.

### ✅ WORKING (file exists + vitest/typecheck green)

| Area | Evidence | Status |
|------|----------|--------|
| Builtin auth signup/signin/sessions (bcrypt 10r, 30d cookie) | `src/lib/auth/index.ts:35-39,62-165` | Working |
| Reset tokens (SHA-256, 1h, single-use, enumeration-safe) + `mailOutbox` queue | `src/lib/auth/index.ts:213-248`, `src/app/api/auth/forgot/route.ts:27-31` | Working (delivery adapter P0-A3 me baki) |
| Rate-limit buckets (login/signup 10/min, forgot 5/min) | `src/lib/rate-limit.ts:33-49,98-107` | Working single-instance (Upstash global P0 me baki) |
| Postgres + Neon + Turso drivers | `src/db/providers/postgres.ts:11-27`, `neon.ts:6-10`, `turso.ts:6-15` | Working |
| Full schema topology (users/sessions/profiles/links/events/webhooks/api_keys/team_members/mailOutbox/mediaFiles) | `src/db/schema.ts:25-280` | Working (pg dialect) |
| Local + S3-family (B2/R2/S3/MinIO) + Vercel-Blob factory | `src/lib/storage/s3.ts:27-132`, `src/lib/storage/index.ts:76-108` | Working basic (ticket flow C2 baki) |
| Multipart upload `POST /api/media` (MIME whitelist, 10 MiB, sanitize) | `src/app/api/media/route.ts:36-85` | Working |
| Avatar server-proxy (2 MiB, images only) | `src/app/api/profile/avatar/route.ts:11-39` | Working |
| Local file serving (traversal guard, nosniff, immutable) | `src/app/api/files/[folder]/[name]/route.ts:38-55` | Working basic (Range C5 baki) |
| Theme (12) + List/Bento + live phone preview + persist | `src/lib/themes.ts:28-263`, `src/components/appearance-editor.tsx:15-144`, `bio-renderer.tsx:156-299` | Working narrow (30+ controls P1 me baki) |
| Links drag-drop reorder (dnd-kit + atomic tx) | `src/components/links-editor.tsx:87-106`, `src/app/api/links/reorder/route.ts:17-24` | Working |
| Analytics summary (views/clicks/unique/CTR/devices/geo/referrers) + charts + CSV | `src/lib/analytics/index.ts:134-194`, `analytics-charts.tsx`, `api/analytics/export/route.ts` | Working basic (filters/comparison P1, CSV-sanitize P0 baki) |
| API keys (`lfk_` + SHA-256-only) + webhooks CRUD + HMAC delivery | `src/app/api/keys/route.ts:36-59`, `src/lib/webhooks.ts:17-64` | Working basic (SSRF E1 baki) |
| Landing page + ThemePlayground + SEO (sitemap/robots/OG) | `src/app/page.tsx:83-454`, `landing/theme-playground.tsx` | Working (testimonial honesty P1 me baki) |
| Privacy + Terms pages (12 sections each, footer-linked) | `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` | Working |
| Health endpoint (env echo) | `src/app/api/health/route.ts:8-20` | Working basic (DB-ping E3 baki) |
| Tests: **83/83 green** (`65 security` + `18 media`), typecheck **0 errors** | `npx vitest run` + `npm run typecheck` 2026-09-09 | Verified |

### ❌ NOT working / missing (disk par file hi nahi — `Test-Path` False verified)

`upload-validation.ts`, `outbound.ts`, `csv.ts`, `github.ts/github-sync.ts`, `api/media/presign+complete`, `scripts/cleanup-uploads/check-database/sync-github`, `docs/media.md/production.md`, `.github/workflows/ci.yml`, `icons.tsx/icon-picker/share-button/analytics-extras/github-integration/marketing-home/legal-document`, `api/design`, `api/integrations/github`, `app/docs` — ye sab Phases 1–7 me NEW banenge.
