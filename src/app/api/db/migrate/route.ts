// =============================================================================
// 🗄️ /api/db/migrate — On-Demand Database Migration & Schema Bootstrap
// Executes idempotent table, index, and column creation.
// Safe to call repeatedly on Neon, Supabase, Postgres, Turso, or D1.
// =============================================================================
import { dbProvider, dbProviderLabel } from "@/config/db.config";
import { handle, json } from "@/lib/api";
import { autoMigrate } from "@/db/auto-migrate";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const result = await autoMigrate(true);
  return json({
    status: "ok",
    migrated: result.ok,
    statementsExecuted: result.count,
    provider: dbProvider,
    label: dbProviderLabel[dbProvider],
    timestamp: new Date().toISOString(),
  });
});

export const POST = handle(async () => {
  const result = await autoMigrate(true);
  return json({
    status: "ok",
    migrated: result.ok,
    statementsExecuted: result.count,
    provider: dbProvider,
    label: dbProviderLabel[dbProvider],
    timestamp: new Date().toISOString(),
  });
});
