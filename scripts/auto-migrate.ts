// =============================================================================
// 🚀 One-Command Direct Migration Script
// Usage: npm run db:migrate
// =============================================================================
import "dotenv/config";
import { autoMigrate } from "../src/db/auto-migrate";
import { dbProvider, dbProviderLabel } from "../src/config/db.config";

async function main() {
  console.log(`[db:migrate] Running schema migration for ${dbProviderLabel[dbProvider]} (${dbProvider})...`);
  const start = Date.now();
  try {
    const res = await autoMigrate(true);
    const elapsed = Date.now() - start;
    console.log(`[db:migrate] ✅ Migration completed successfully in ${elapsed}ms (${res.count} statements executed).`);
    process.exit(0);
  } catch (err) {
    console.error(`[db:migrate] ❌ Migration failed:`, (err as Error).message);
    process.exit(1);
  }
}

main();
