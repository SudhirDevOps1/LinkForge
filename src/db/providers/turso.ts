// 🌐 Turso / libSQL Provider — distributed SQLite (edge replicas supported)
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../schema.sqlite";

export function createTursoDb() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is required for the turso provider");
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
    // Embedded replica (local file sync) optional: TURSO_EMBEDDED_REPLICA_PATH
  });
  // SQLite dialect schema use hota hai; query API pg ke saath identical hai
  return drizzle(client, { schema });
}
