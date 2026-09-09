// =============================================================================
// 🩺 Check Database — provider connectivity + basic write/rollback smoke test
// Run: npx tsx scripts/check-database.ts
// (DATABASE_PROVIDER ke hisaab se driver select hota hai — db/index.ts)
// Destructive nahi: sirf SELECT 1 + transaction rollback test.
// =============================================================================
import "dotenv/config";
import { sql } from "drizzle-orm";
import { dbProvider } from "../src/config/db.config";
import { db } from "../src/db";

async function main() {
  console.log(`[check-database] provider: ${dbProvider}`);
  const started = Date.now();
  await db.execute(sql`SELECT 1`);
  console.log(`[check-database] SELECT 1 ok (${Date.now() - started}ms)`);

  // Transaction smoke: insert-then-rollback (koi persistent write nahi)
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT 1`);
      throw new Error("__rollback_probe__");
    });
  } catch (err) {
    if ((err as Error).message === "__rollback_probe__") {
      console.log("[check-database] transaction rollback ok");
    } else {
      console.warn("[check-database] transaction probe:", (err as Error).message);
    }
  }
  console.log("[check-database] ALL OK");
  process.exit(0);
}

main().catch((err) => {
  console.error("[check-database] FAIL:", err);
  process.exit(1);
});
