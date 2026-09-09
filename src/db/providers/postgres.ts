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

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for the postgres/supabase provider");
  }

  const pool =
    globalForDb.__linkforgePgPool ?? new Pool({ connectionString });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__linkforgePgPool = pool;
  }
  return drizzle(pool, { schema });
}
