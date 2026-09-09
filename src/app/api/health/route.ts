// 🩺 Health Check — platform load balancers / uptime monitors ke liye
// DB + storage ping ke saath: DB down ho to 503 (orchestrator restart kare).
import { sql } from "drizzle-orm";
import { authProvider } from "@/config/auth.config";
import { dbProvider, dbProviderLabel } from "@/config/db.config";
import { storageProvider } from "@/config/storage.config";
import { db } from "@/db";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;
  try {
    await db.execute(sql`SELECT 1`);
    dbOk = true;
  } catch (err) {
    console.warn("[health] db ping failed:", (err as Error).message);
  }
  let storageOk = false;
  let storageDetail = "unknown";
  try {
    const storage = await getStorage();
    storageDetail = storage.provider;
    storageOk = true;
  } catch (err) {
    storageDetail = (err as Error).message;
  }
  const ok = dbOk && storageOk;
  return Response.json(
    {
      status: ok ? "ok" : "degraded",
      service: "linkforge",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      checks: {
        db: dbOk ? "ok" : "fail",
        storage: storageOk ? "ok" : "fail",
        storageDetail,
      },
      providers: {
        database: dbProvider,
        databaseLabel: dbProviderLabel[dbProvider],
        storage: storageProvider,
        auth: authProvider,
      },
    },
    { status: ok ? 200 : 503 },
  );
}
