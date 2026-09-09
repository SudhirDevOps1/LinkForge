// 🌐 Drizzle Kit config — Turso (libSQL) migrations
// Usage: npx drizzle-kit push --config drizzle.config.turso.ts
// Note: drizzle-kit 0.31 ki Config types abhi turso driver ko expose nahi
// karti, isliye cast use kiya hai — runtime par authToken sahi se pass hota hai.
import { defineConfig } from "drizzle-kit";

const config = {
  dialect: "sqlite",
  schema: "./src/db/schema.sqlite.ts",
  out: "./drizzle/turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
};

export default defineConfig(config as unknown as Parameters<typeof defineConfig>[0]);
