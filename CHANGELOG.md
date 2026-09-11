# Changelog & Release Notes

All notable changes to **LinkForge** will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.0.1] - 2026-09-12

### 🚀 Overview
**LinkForge v0.0.1** is the first official release of the ultra-fast, modern Link-in-Bio and Personal Brand Studio platform built on **Next.js 16 (Turbopack)**, **React 19**, **Drizzle ORM**, **Better Auth**, and **Tailwind CSS v4**.

This release introduces an enterprise-grade security architecture, zero-dependency vulnerabilities, intelligent OpenGraph scrapers, a Bento Grid engine, real-time typing animation engines, and multi-cloud storage/database adapters.

---

### 🛡️ Security Audit & Hardening (Zero Vulnerabilities)
- **100% Clean Dependency Audit:** Executed comprehensive `npm audit` resolution (`0 vulnerabilities` across 852 packages):
  - Upgraded and pinned `postcss` to `^8.5.28` mitigating CVEs (GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849).
  - Configured npm overrides for `esbuild` and resolved `sharp` dependencies in dev tooling.
- **SSRF (Server-Side Request Forgery) Protection:**
  - Integrated DNS-pinned `safeFetch` with private IP resolution blocking (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `::1`, `fc00::/7`, `fe80::/10`).
  - Blocked cloud metadata hosts (`169.254.169.254`, `metadata.google.internal`).
  - Protected redirect hops: verifies each destination IP for safety prior to fetching.
  - Applied across both `/api/links/scrape` and `/api/integrations/feed`.
- **Dual-Bucket Rate Limiting:** Applied dual IP + account rate limiting across critical auth endpoints (`/api/auth/login`, `/api/auth/verify-2fa`, `/api/auth/reset-2fa`).
- **CSRF Defense:** Enforced `assertSameOrigin` validation on state-mutating requests.
- **Strict Content-Security-Policy (CSP):** Configured strict HTTP response headers including HSTS, X-Content-Type-Options (`nosniff`), X-Frame-Options (`SAMEORIGIN`), and granular CSP directives in `next.config.ts`.
- **Magic-Byte Upload Verification:** Server-side MIME validation and file signature sniffing using `file-type` to prevent file extension spoofing.

---

### ✨ Core Features & Enhancements

#### 1. 🔗 Smart OpenGraph Auto-Scraper & Bento Cards
- **Automated Metadata Extraction:** Enter any URL to auto-extract `og:title`, `og:description`, `og:image`, `og:site_name`, and domain favicons.
- **Specialized Platform Extractors:**
  - **YouTube:** Instant video thumbnail retrieval and oEmbed metadata.
  - **GitHub:** Dynamic social preview banners and repo metadata.
  - **Spotify:** High-resolution album artwork and oEmbed details.
- **Aesthetic Bento Grid Engine:**
  - 16:9 rich cover banners with subtle bottom gradient vignettes and hover micro-zoom.
  - Dynamic ambient radial glow matching platform brand colors for non-image cards.
  - Translucent watermark brand icons in card background.
  - Floating glassmorphic domain badges with external link arrows (`domain.com ↗`).

#### 2. 🎨 Appearance & Brand Studio
- **Multi-Mode Typewriter Engine:**
  - **Classic:** Natural keystrokes with blinking accent cursor and loop pauses.
  - **Terminal / Shell:** Hacker CLI prompt (`>_`) with monospaced typography.
  - **Matrix Decrypt:** Sci-fi alphanumeric character cycling with glitch resolution.
  - **Role Rotator:** Slide-in morphing transitions for titles and job headlines.
- **Live Gradient Builder:**
  - Manual angle slider (0°–360°), dual color stops, linear and radial modes.
  - Hex color pickers and instant one-click background application.
- **Visual Micro-Interactions:**
  - Glitch RGB-split hover animations, pulse bounce, 3D card tilt, and floating avatars.
  - 16+ curated aesthetic design themes (Midnight Violet, Cyberpunk Neon, Minimalist Monochrome, Sunset Amber, Glass Frost, etc.).

#### 3. 🔐 Authentication & Identity
- **Two-Factor Authentication (2FA):** TOTP QR code enrollment (Google Authenticator, 1Password) with single-use offline recovery backup codes.
- **Social OAuth:** Seamless login via GitHub, Google, and Discord.
- **Passkeys / WebAuthn:** Biometric hardware-backed authentication (`@better-auth/passkey`).
- **Strict DNS Verification:** Enforced MX record DNS verification for clean signup email hygiene.

#### 4. 📈 Analytics, Integrations & Webhooks
- **Click & View Tracking:** Privacy-focused geo, referrer, and device analytics.
- **DuckDB & Parquet Export:** High-performance analytical exports for power users.
- **Webhook Dispatcher:** Multi-event notifications (new subscriber, link clicked, page viewed) with auto-normalization for Discord, Slack, and Stoat/Revolt.
- **QR Code Studio:** Profile share QR generator with customizable logo embeds and SVG/PNG exports.

---

### 🧪 Quality Verification Matrix
| Test Suite / Quality Gate | Status | Details |
|---|---|---|
| **npm audit** | ✅ PASSED | 0 vulnerabilities (852 packages audited) |
| **npm run typecheck** | ✅ PASSED | TypeScript 5.9 strict mode (0 errors) |
| **npm run lint** | ✅ PASSED | ESLint 9 + Next.js rules (0 warnings, 0 errors) |
| **npm test (Vitest)** | ✅ PASSED | 9 test files, 145/145 unit tests passed |
| **npm run build** | ✅ PASSED | 56/56 Next.js routes statically optimized |

---

### 📦 Release Verification Checksums
```
Release: LinkForge v0.0.1
Tag: v0.0.1 / v.0.0.1
Runtime: Node.js 20+ / Edge Runtime
Framework: Next.js 16 (Turbopack) + React 19
```
