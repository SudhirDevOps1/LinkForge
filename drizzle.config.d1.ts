// ☁️ Drizzle Kit config — Cloudflare D1 migrations
// Pehle: wrangler d1 create linkforge → database_id yahan daalein
// Usage: npx drizzle-kit push --config drizzle.config.d1.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.sqlite.ts",
  out: "./drizzle/d1",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.D1_ACCOUNT_ID ?? "",
    databaseId: process.env.D1_DATABASE_ID ?? "",
    token: process.env.D1_AUTH_TOKEN ?? "",
  },
});
