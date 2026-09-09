// ⚡ Neon Serverless Postgres Provider — HTTP driver (edge-friendly, no TCP)
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../schema";

export function createNeonDb() {
  const url = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("NEON_DATABASE_URL is required for the neon provider");
  // HTTP driver: serverless + edge runtimes par perfect, websockets ki zaroorat nahi
  return drizzle(neon(url), { schema });
}
