// 🌐 Drizzle Kit config — PostgreSQL (Neon / Supabase / Local Postgres)
// Automatically picks up NEON_DATABASE_URL or DATABASE_URL from .env
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url =
  process.env.NEON_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url,
  },
});
