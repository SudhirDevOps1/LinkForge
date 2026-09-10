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

function detectDbProvider(): DatabaseProvider {
  const envProvider = (process.env.DATABASE_PROVIDER ?? "")
    .trim()
    .toLowerCase();

  if (["postgres", "neon", "supabase", "turso", "d1"].includes(envProvider)) {
    return envProvider as DatabaseProvider;
  }

  // Auto-detection based on connection strings for zero-config deployments
  const dbUrl = (
    process.env.NEON_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    ""
  ).toLowerCase();

  if (process.env.NEON_DATABASE_URL || dbUrl.includes("neon.tech")) {
    return "neon";
  }
  if (process.env.SUPABASE_DATABASE_URL || dbUrl.includes("supabase.co")) {
    return "supabase";
  }
  if (process.env.TURSO_DATABASE_URL || dbUrl.startsWith("libsql://")) {
    return "turso";
  }

  return "postgres";
}

export const dbProvider: DatabaseProvider = detectDbProvider();

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
