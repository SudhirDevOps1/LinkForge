// =============================================================================
// 🗄️ Database Provider Configuration (डेटाबेस प्रोवाइडर कॉन्फ़िग)
// -----------------------------------------------------------------------------
// `DATABASE_PROVIDER` env var ke basis par sahi driver select hota hai:
//
//   postgres  → Local / Railway / Render Postgres (node-postgres Pool)
//   neon      → Neon Serverless Postgres (HTTP driver, edge-friendly)
//   supabase  → Supabase Postgres (transaction pooler URL)
//   turso     → Turso / libSQL (SQLite dialect)
//   d1        → Cloudflare D1 (SQLite dialect, Workers binding)
//
// Migrations har provider par Drizzle Kit se chalti hain — docs/database.md
// =============================================================================

export type DatabaseProvider = "postgres" | "neon" | "supabase" | "turso" | "d1";

const envProvider = (process.env.DATABASE_PROVIDER ?? "postgres")
  .trim()
  .toLowerCase();

export const dbProvider: DatabaseProvider = (
  ["postgres", "neon", "supabase", "turso", "d1"].includes(envProvider)
    ? envProvider
    : "postgres"
) as DatabaseProvider;

/** SQLite-dialect providers (schema.sqlite.ts use karte hain) */
export const isSqliteProvider = dbProvider === "turso" || dbProvider === "d1";

/** Human-readable label — health endpoint aur logs ke liye */
export const dbProviderLabel: Record<DatabaseProvider, string> = {
  postgres: "PostgreSQL (self-hosted / Railway / Render)",
  neon: "Neon Serverless Postgres",
  supabase: "Supabase Postgres",
  turso: "Turso (libSQL)",
  d1: "Cloudflare D1",
};
