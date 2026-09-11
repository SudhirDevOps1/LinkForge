// =============================================================================
// 🗄️ Database Entrypoint — Multi-Provider Abstraction Layer
// -----------------------------------------------------------------------------
// `DATABASE_PROVIDER` ke hisaab se sahi driver select hota hai. Saare app
// queries `db` ke through drizzle ke unified query API se chalti hain — isliye
// Postgres (Neon/Supabase/local) aur SQLite (Turso/D1) dono par same code
// kaam karta hai.
// =============================================================================
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbProvider, isSqliteProvider } from "@/config/db.config";
import type * as schema from "./schema";
import { createD1Db } from "./providers/d1";
import { createNeonDb } from "./providers/neon";
import { createPostgresDb } from "./providers/postgres";
import { createTursoDb } from "./providers/turso";

/** Canonical Db type (pg dialect). SQLite providers runtime-par cast hote hain. */
export type Db = NodePgDatabase<typeof schema>;

/**
 * true jab turso/d1 (SQLite dialect) active ho — schema.sqlite.ts applies,
 * batch-tx + `.returning()` limits ke liye docs/database.md dekhein.
 */
export const sqliteMode = isSqliteProvider;

let cached: Db | undefined;
let migrationStarted = false;

export async function initDb(): Promise<void> {
  const { autoMigrate } = await import("./auto-migrate");
  await autoMigrate();
}

export function getDb(): Db {
  if (cached) return cached;
  switch (dbProvider) {
    case "neon":
      cached = createNeonDb() as unknown as Db;
      break;
    case "turso":
      cached = createTursoDb() as unknown as Db;
      break;
    case "d1":
      cached = createD1Db() as unknown as Db;
      break;
    default:
      // postgres + supabase dono node-postgres Pool se chalte hain
      cached = createPostgresDb();
  }

  // Auto-migrate tables in background on first db connection in runtime (skip in build/CI)
  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    Boolean(process.env.CI) ||
    !process.env.DATABASE_URL;

  if (
    !migrationStarted &&
    typeof window === "undefined" &&
    process.env.NODE_ENV !== "test" &&
    !isBuildPhase
  ) {
    migrationStarted = true;
    import("./auto-migrate")
      .then((m) => m.autoMigrate())
      .catch((e) => {
        console.warn("[db] auto-migrate background notice:", (e as Error).message);
      });
  }

  return cached;
}

/**
 * Query-compatible lazy proxy — module evaluate hote hi connection nahi khulta.
 * Build/prerender ke dauraan bhi safe (tab tak DB touch nahi hota jab tak
 * koi actual query na ho).
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value;
  },
});
