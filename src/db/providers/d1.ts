// ☁️ Cloudflare D1 Provider — Workers binding se milta hai
// wrangler.toml:
//   [[d1_databases]]
//   binding = "DB"
//   database_name = "linkforge"
//   database_id = "<D1_DATABASE_ID>"
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../schema.sqlite";

type D1Binding = {
  prepare(query: string): unknown;
  batch?(statements: unknown[]): Promise<unknown>;
  exec?(query: string): Promise<unknown>;
};

export function createD1Db() {
  // OpenNext / next-on-pages runtime binding ko globalThis par expose karta hai
  const g = globalThis as typeof globalThis & {
    D1_DATABASE?: D1Binding;
    DB?: D1Binding;
    __env__?: { DB?: D1Binding };
  };
  const binding = g.DB ?? g.D1_DATABASE ?? g.__env__?.DB;
  if (!binding) {
    throw new Error(
      "Cloudflare D1 binding not found. Please configure [[d1_databases]] binding = \"DB\" in wrangler.toml.",
    );
  }
  return drizzle(binding as never, { schema });
}
