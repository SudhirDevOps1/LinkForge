# NEXT-PATCH TODO — Strict Checklist (bina kuch hataye)

> Order = P0 → P1 → Docs → Gate. Har item ke saath evidence file:line.
> Tick tabhi karo jab Acceptance + test green.

## Phase 0 — Freeze & Backup (30 min)

- [ ] `git status` clean, naya branch `next-patch` banao
- [ ] DB backup: `pg_dump $DATABASE_URL > backups/pre-patch.sql` + `uploads/` copy
- [ ] `npm audit` baseline note karo (4 moderate drizzle-kit expected)

## Phase 1 — P0-A Auth (half day)

- [ ] A1 `src/lib/auth/external.ts:27-45` me profile auto-create (`allocateSlug` reuse, `src/lib/auth/index.ts:91-97` jaisa) + name/avatar update on existing
  - Acc: external signup → `/[slug]` 200 · Test: `tests/auth-external.test.ts`
- [ ] A2 IP salt: `src/lib/crypto.ts:32-35 hashIp` ko `lib/auth/index.ts:114` + `lib/analytics/index.ts` me wire karo (env `AUTH_SECRET`)
  - Acc: `grep -rn hashIp src/lib/auth src/lib/analytics` ≥2 hits
- [ ] A3 `src/lib/mail.ts` banao (interface `sendMail` + `console`/`smtp` stub) + `api/auth/forgot/route.ts:16` comment fix + `docker-compose.yml` mailhog note
  - Acc: file exists, `.env.example` me `SMTP_*` documented
- [ ] A4 CSRF strict: `src/lib/api.ts:44-52` — `Origin==null` wale mutations ko 403 (sirf GET/health exempt) + test
  - Acc: curl-POST bina Origin → 403
- [ ] A5 Honesty badges: `external.ts:75-80,120-125` ke har 501 par JSDoc `@not-implemented` + `docs/auth.md` + `.env.example` me `CLERK/NEXTAUTH/NEON_AUTH = NOT IMPLEMENTED`
  - Acc: docs ↔ code 1:1, koi "bridge works" claim nahi

## Phase 2 — P0-B Database (half day)

- [ ] B1 `docs/database.md:99-104` + README table: Supabase = "Postgres URL preset" likho
- [ ] B2 D1 experimental badge: `docs/database.md` + README + `.env.example:26-29`; `wrangler.toml:11-14` uncomment ya "manual binding" note; `next-patch.md:369` wali warning ship karo
- [ ] B3 `src/db/schema.sqlite.ts:20,25` — `id` default (`$defaultFn(randomUUID)`) + timestamps default; ya insert-layer inject
  - Acc: sqlite insert bina `id` → pass
- [ ] B4 `.returning()` audit: `grep -rn "\.returning()" src` (13+ hits: `auth/index.ts:88`, `external.ts:43`, links/reorder/keys/webhooks…) → D1 path fallback
  - Acc: D1-local (`scripts/check-database.ts` banao ya local libSQL) green
- [ ] B5 `src/config/db.config.ts:28 isSqliteProvider` ko `src/db/index.ts` me use karo ya delete karo (dead-code nahi)

## Phase 3 — P0-C Media/S3 (1–2 days, sabse bada)

- [ ] C0 Deps: `npm i file-type` (+ `qrcode.react` agar QR P1 me). `package.json` verify
- [ ] C1 Migration: `upload_tickets(id,profileId,provider,key,expectedMime,expectedSize,expiresAt,usedAt,createdAt)` — additive, dono dialects (`schema.ts` + `schema.sqlite.ts`)
- [ ] C2a `POST /api/media/presign` (general files): auth + rate-limit + ticket create (60s TTL) + `getPresignedUploadUrl(PUT)`
  - Acc: `{ticketId,url,key,expiresAt}` 200
- [ ] C2b `POST /api/media/complete`: owner/expiry/provider/size (`HeadObject`)/mime + magic-byte (`fileTypeFromBuffer`) + single-use (`usedAt`) → `mediaFiles` insert
  - Acc: reuse→410, wrong-owner→403, oversize→413, spoofed-ext→422
- [ ] C3 `src/components/file-dropzone.tsx:42-67` branch: `isS3Compatible ? presign(XHR+progress+cancel/retry) : multipart POST`. Purana path rakho
  - Acc: B2/R2/MinIO par progress bar + cancel works
- [ ] C4 Delete guard `src/app/api/media/[id]/route.ts:30-38`: provider-mismatch→400 + `links` ref-check→409 `{referencedBy}`
  - Acc: referenced→409, free→200; test `tests/media-guard.test.ts`
- [ ] C5 Range: `src/app/api/files/[folder]/[name]/route.ts:50-55` me `Accept-Ranges/Content-Length/Content-Disposition` + `Range` parse → 206
  - Acc: `curl -H "Range: bytes=0-1023"` → 206
- [ ] C6 Vercel-Blob fix `src/lib/storage/index.ts:87-102`: full URL store, `getUrl` URL return, `delete` URL accept
  - Acc: upload→getUrl→delete round-trip
- [ ] C7a `src/lib/upload-validation.ts` (ext↔mime, magic-byte, `sanitizeFileName` reuse `lib/media.ts:6-20`)
- [ ] C7b `scripts/cleanup-uploads.ts` (expired tickets + orphan objects via Head/Delete; `files/` prefix lifecycle warning comment)
- [ ] C7c `docs/media.md` NEW (CORS JSON, R2 public-URL note, lifecycle warning, billing note) + `package.json` script `cleanup:uploads`

## Phase 4 — P0-D Import/Export (half day)

- [ ] D1 `src/app/api/profile/import/route.ts:42-63`: default `mode=merge` (skip duplicate URL, manual preserve); `?mode=replace` par hi `delete`
  - Acc: double-import idempotent, manual links survive · Test: `tests/import-merge.test.ts`
- [ ] D2 Export (`export/route.ts:19-46`) + import me `design` block
  - Acc: export→import round-trip theme/layout/design same

## Phase 5 — P0-E Webhook/Health/Docker (half day)

- [ ] E1 `src/lib/outbound.ts` NEW: https-only + no-redirect + 5s timeout + DNS-pin/private-IP reject; `src/lib/webhooks.ts:17-39` me wire
  - Acc: `http://169.254.169.254` + `http://` → blocked · Test: `tests/ssrf.test.ts`
- [ ] E2 Retry: `webhook_deliveries` table + 3-attempt backoff log (min viable)
- [ ] E3 `src/app/api/health/route.ts:8-20`: `db.select-1` + storage ping → `{checks:{db,storage}}`, DB-down→503
- [ ] E4 `next.config.ts:23-31` me `output:"standalone"` (ya Dockerfile:24-25 fix) — `docker build` green
- [ ] E5 `package.json` scripts: `deploy:vercel/cloudflare/netlify`, `db:push:*`, `cleanup:uploads`; `wrangler.toml:8` path fix (Vercel path hatao)

## Phase 6 — P1 (patch me agar time, warna P1-branch)

- [ ] Design: `customization.tsx:77` fake-save hatao → real `PATCH /api/profile`; size/spacing/color/font + per-card + undo/redo + QR/share (`share-button.tsx` banao)
- [ ] Analytics: device filter + WoW/MoM % + activity feed + refresh + `lib/csv.ts` (`=+-@` prefix) + retention-cron doc
- [ ] GitHub: `lib/github.ts` + preview-import UI + `scripts/sync-github.ts` (backup-first, additive); homepage links → `SudhirDevOps1/LinkForge` (`app/page.tsx:117,403` fix)
- [ ] Landing honesty: `landing/sections.tsx:198-223` testimonials → `Sample` label; comparison → "verify 2026" note
- [ ] CI: `.github/workflows/ci.yml` + `playwright.config.ts` + 2 smoke specs

## Phase 7 — Docs sweep (1 hr)

- [ ] `docs/auth.md` (501 badges) · `docs/database.md` (alias+D1-exp) · `docs/media.md` (NEW) · `docs/production.md` (NEW: health/cron/backup) · `docs/security.md` (SSRF/CSV/CSRF truth) · `README.md` (counts + repo link) · `.env.example` (keys+comments)

## Phase 8 — Final Gate (blocking)

- [ ] `npm run typecheck` 0 errors
- [ ] `npm run lint` 0 warnings (2 old nav warnings fix)
- [ ] `npx vitest run` all green (old ~80 + new 7 files)
- [ ] `npm run build` 0 errors, no standalone warning
- [ ] `docker build` pass
- [ ] Manual: presign→PUT→complete · referenced-delete 409 · Range 206 · health 503 · merge-import idempotent
- [ ] `npm audit`: 0 critical/high

## File Map (kya kahan banega — kuch delete nahi hoga)

```
NEW: src/lib/upload-validation.ts, src/lib/outbound.ts, src/lib/csv.ts (P1), src/lib/github.ts (P1)
NEW: src/app/api/media/presign/route.ts, src/app/api/media/complete/route.ts
NEW: scripts/cleanup-uploads.ts, scripts/check-database.ts, scripts/sync-github.ts (P1)
NEW: docs/media.md, docs/production.md, docs/NEXT-PATCH-PRD.md (done), docs/NEXT-PATCH-TODO.md (ye file)
NEW: tests/auth-external, media-guard, ssrf, csv, import-merge, ticket-flow, range
EDIT: lib/auth/external+index, lib/api, lib/storage/index+s3, api/media/[id], api/files/[folder]/[name],
      api/profile/import+export, lib/webhooks, api/health, next.config.ts, wrangler.toml, package.json,
      components/file-dropzone, docs/auth+database+security, README, .env.example
```

## Strict Definition of Done

Patch tabhi DONE jab: koi documented claim bina implementation ke "working" nahi bola gaya, har P0 acceptance green, gate all-green, aur `git diff --stat` me koi working-file deletion nahi.

## Phase 9 — GitHub Handoff: add → commit (local) → verify → push (only on approval)

> Target: `https://github.com/SudhirDevOps1/LinkForge.git` · Rule: **push sirf user ke bolne par.**

- [ ] P9.1 `git init` (agar `.git` nahi) + `git remote add origin https://github.com/SudhirDevOps1/LinkForge.git` (agar remote missing; galat remote ho to user se puchho, force change nahi)
- [ ] P9.2 `git add` scope check: `git status --short` me `.env`, `node_modules/`, `.next/`, `uploads/` runtime, `*.sqlite/*.db` nahi aane chahiye (`.gitignore` cover karta hai)
- [ ] P9.3 Local commit: `git commit -m "docs: add NEXT-PATCH PRD + TODO (strict gap-fix plan)"` — sirf docs files staged ho to wahi commit
- [ ] P9.4 Verify (push se PEHLE): `npm run typecheck` + `npx vitest run` green; result TODO me note karo
- [ ] P9.5 Push GATE (blocked until user says): user ke "push karo" ke baad hi `git push -u origin <branch>`; kabhi `--force` nahi; push ke baad URL + commit hash report karo
