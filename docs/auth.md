# 🔐 Auth Providers — Setup Guides

Har provider **same unified user model** par map hota hai
(`users` table: `email / name / passwordHash(nullable) / avatarUrl`). Isliye
provider badalne par aapka dashboard, links aur analytics kabhi migrate nahi
karna padta — sirf identity layer map hoti hai.

| Provider | Type | Status |
| :--- | :--- | :--- |
| `builtin` (default) | Lucia-style DB sessions + bcrypt | ✅ Working |
| `supabase` | Supabase Auth REST (email/password only) | ⚠️ Partial — social/magic-link callbacks baki |
| `clerk` | Clerk | 🚧 NOT IMPLEMENTED — 501 (`src/lib/auth/external.ts`) |
| `nextauth` | Auth.js | 🚧 NOT IMPLEMENTED — 501 (`src/lib/auth/external.ts`) |
| `neon` | Neon Auth | 🚧 NOT IMPLEMENTED — 501 (`src/lib/auth/external.ts`) |

## 1. Built-in (default) — recommended for self-hosting

Kahin signup nahi karna, koi API key nahi. Sessions Postgres/SQLite me store
hote hain (httpOnly cookie, SameSite=Lax, 30 din).

```env
AUTH_PROVIDER=builtin
AUTH_SECRET=<32+ random bytes>   # session + IP-hash salt
```

- Passwords: bcrypt (10 rounds)
- Reset flow: `/forgot-password` → token DB me hash hokar store →
  email provider na ho to **mail_outbox** table me queue (MailHog/SMTP adapter
  plug kar sakte hain — `docker compose --profile mail up`)
- Danger zone: "Sign out everywhere" saare sessions revoke karta hai

## 2. Supabase Auth

```env
AUTH_PROVIDER=supabase
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # sirf server-side signup (admin API) ke liye
```

Flow: email/password sign-in Supabase REST (`/auth/v1/token`) se hota hai,
identity local `users` row se **upsert-by-email** map hoti hai, fir local
session issue hota hai. External users ke liye profile (bio page) auto-create
hoti hai — builtin signup jaisi.
> ⚠️ Social providers / magic links: Supabase dashboard me enable karne ke
> baad `/api/auth/...` callback par `mapExternalUser()` wiring **baki hai**
> (abhi 501 nahi — sirf email/password flow working hai).

## 3. Clerk — 🚧 NOT IMPLEMENTED (501)

> Adapter skeleton `src/lib/auth/external.ts:75-76,120-121` me `throw 501`
> karta hai. Neeche setup **plan** hai, working guide nahi.

```env
AUTH_PROVIDER=clerk
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
```

Clerk `<SignIn/>` components ko `(auth)` routes me mount karein aur webhook
(`user.created`) se `mapExternalUser()` call karein. Adapter skeleton
`src/lib/auth/external.ts` me ready hai.

## 4. NextAuth.js / Auth.js — 🚧 NOT IMPLEMENTED (501)

> Callbacks wiring baki hai — abhi 501 aayega.

```env
AUTH_PROVIDER=nextauth
NEXTAUTH_URL=https://your-app.vercel.app
AUTH_SECRET=...
# + OAuth provider keys (Google/GitHub/etc.)
```

NextAuth callbacks me `mapExternalUser()` invoke karke local session bridge
karein — baaki pura app unchanged rehta hai.

## 5. Neon Auth — 🚧 NOT IMPLEMENTED (501)

> JWT verify + middleware wiring baki hai — abhi 501 aayega.

```env
AUTH_PROVIDER=neon
NEON_AUTH_URL=https://...neon.tech/auth
```

Neon Auth JWT ko middleware me verify karke `mapExternalUser()` se local
session issue karein.

---

## Security Model (sab providers par common)

- 🍪 Session cookie: `httpOnly`, `SameSite=Lax`, `Secure` (production)
- 🛡️ CSRF: mutation routes par Origin/Host match + SameSite cookies
- 🚦 Rate limits: login/signup 10 req/min per IP
- 🔑 Passwords: bcrypt 10 rounds (kabhi plain-text/hash leaks nahi)
- 📧 User enumeration protection: forgot-password hamesha same response
- ⏱️ Reset tokens: SHA-256 hashed, 1 hour expiry, single-use
