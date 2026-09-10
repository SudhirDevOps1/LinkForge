// 🩺 Health Check — platform load balancers / uptime monitors ke liye
// DB + storage ping ke saath: DB down ho to 503 (orchestrator restart kare).
import { sql } from "drizzle-orm";
import { authProvider } from "@/config/auth.config";
import { dbProvider, dbProviderLabel } from "@/config/db.config";
import { storageProvider } from "@/config/storage.config";
import { db, initDb } from "@/db";
import { getStorage, getStorageAdapter } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;
  let schemaOk = false;
  try {
    await db.execute(sql`SELECT 1`);
    dbOk = true;
    try {
      await initDb();
      schemaOk = true;
    } catch (schemaErr) {
      console.warn("[health] schema auto-migration notice:", (schemaErr as Error).message);
    }
  } catch (err) {
    console.warn("[health] db ping failed:", (err as Error).message);
  }
  let storageStatus = "error";
  let storageDriver = "unknown";
  try {
    const adapter = await getStorageAdapter();
    storageDriver = adapter.driver;
    const isAlive = adapter.ping ? await adapter.ping() : true;
    storageStatus = isAlive ? "connected" : "degraded";
  } catch (err) {
    storageStatus = "error";
    console.warn("[health] storage ping failed:", (err as Error).message);
  }
  const ok = dbOk && (storageStatus === "connected" || storageStatus === "degraded");
  return Response.json(
    {
      status: ok ? "ok" : "degraded",
      service: "linkforge",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      checks: {
        db: dbOk ? "ok" : "fail",
        schema: schemaOk ? "ok" : "fail",
        storage: storageStatus,
        driver: storageDriver,
      },
      providers: {
        database: dbProvider,
        databaseLabel: dbProviderLabel[dbProvider],
        storage: storageProvider,
        driver: storageDriver,
        auth: authProvider,
      },
    },
    { status: ok ? 200 : 503 },
  );
}
