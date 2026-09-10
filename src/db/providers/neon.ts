// ⚡ Neon Serverless Postgres Provider — HTTP driver (edge-friendly, no TCP)
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../schema";

export function createNeonDb() {
  const url =
    process.env.NEON_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "NEON_DATABASE_URL ya DATABASE_URL required hai (neon provider ke liye)",
    );
  }
  // HTTP driver: serverless + edge runtimes par perfect, websockets ki zaroorat nahi
  return drizzle(neon(url), { schema });
}
