// 🐘 PostgreSQL Provider — Local / Railway / Render / Supabase (pg Pool)
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schema";

// HMR-safe global pool (dev me baar-baar pool na bane)
const globalForDb = globalThis as typeof globalThis & {
  __linkforgePgPool?: Pool;
};

export function createPostgresDb() {
  const connectionString =
    process.env.DATABASE_PROVIDER === "supabase"
      ? (process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL)
      : process.env.DATABASE_URL;

  // Build/CI safe fallback: pg.Pool is lazy and does not open TCP sockets until pool.query()
  const effectiveConnString =
    connectionString ||
    "postgresql://postgres:postgres@127.0.0.1:5432/linkforge_placeholder";

  const pool =
    globalForDb.__linkforgePgPool ?? new Pool({ connectionString: effectiveConnString });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__linkforgePgPool = pool;
  }
  return drizzle(pool, { schema });
}
