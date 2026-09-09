// =============================================================================
// 🧹 Cleanup Uploads — expired tickets + orphan S3 objects saaf karo
// Run: npm run cleanup:uploads  (cron: daily)
// Schedule: `npx tsx scripts/cleanup-uploads.ts`
//
// Kya karta hai (additive, safe):
//   1. `upload_tickets` me expired + unused tickets delete (60s TTL ke baad).
//   2. Har expired ticket ka S3 object best-effort delete (abandoned PUTs).
//   3. Report print (deleted tickets / objects / failures).
//
// Kya NAHI karta:
//   - `media_files` rows ko kabhi touch nahi (completed uploads safe).
//   - Poori `files/` prefix par lifecycle rule nahi (docs/media.md warning).
// =============================================================================
import "dotenv/config";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db } from "../src/db";
import { uploadTickets } from "../src/db/schema";
import { getStorage } from "../src/lib/storage";

async function main() {
  const now = new Date();
  const expired = await db
    .select()
    .from(uploadTickets)
    .where(and(lt(uploadTickets.expiresAt, now), isNull(uploadTickets.usedAt)))
    .limit(500);

  let objectsDeleted = 0;
  let objectFailures = 0;
  const storage = await getStorage().catch(() => null);

  for (const t of expired) {
    // Sirf same-provider objects delete karo (provider switch ke baad safe)
    if (storage && t.provider === storage.provider) {
      try {
        await storage.delete(t.storageKey);
        objectsDeleted++;
      } catch {
        objectFailures++;
      }
    }
    await db.delete(uploadTickets).where(eq(uploadTickets.id, t.id));
  }

  console.log(
    `[cleanup-uploads] tickets expired: ${expired.length}, objects deleted: ${objectsDeleted}, failures: ${objectFailures}`,
  );
}

main().catch((err) => {
  console.error("[cleanup-uploads] fatal:", err);
  process.exit(1);
});
