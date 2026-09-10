// ✅ POST /api/media/complete — presigned PUT verify karke media row banao
// Checks (fail-closed): owner + expiry + provider-match + single-use +
// actual size (HeadObject/stat) + magic-byte signature.
// Fail par object delete + ticket consume (retry ke liye naya presign lo).
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaFiles, uploadTickets } from "@/db/schema";
import {
  ApiError,
  assertSameOrigin,
  guardRateLimit,
  handle,
  json,
  parseOrThrow,
} from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { fileCategory } from "@/lib/media";
import { getStorage } from "@/lib/storage";
import { isTicketExpired, verifyMagicBytes } from "@/lib/upload-validation";
import { completeSchema } from "@/lib/validations";
import { encryptField } from "@/lib/db-cipher";

async function consumeTicket(id: string) {
  await db.update(uploadTickets).set({ usedAt: new Date() }).where(eq(uploadTickets.id, id));
}

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "media:complete", 20);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");

  const { ticketId } = parseOrThrow(completeSchema, await req.json().catch(() => ({})));
  const [ticket] = await db
    .select()
    .from(uploadTickets)
    .where(and(eq(uploadTickets.id, ticketId), eq(uploadTickets.profileId, profile.id)))
    .limit(1);
  if (!ticket) throw new ApiError(404, "Ticket nahi mili");
  if (ticket.usedAt) throw new ApiError(410, "Ticket already used — naya presign lo");
  if (isTicketExpired(ticket.expiresAt)) {
    await consumeTicket(ticket.id);
    throw new ApiError(410, "Ticket expire ho gayi — naya presign lo");
  }

  const storage = await getStorage();
  if (storage.provider !== ticket.provider) {
    throw new ApiError(
      400,
      `Provider mismatch (ticket: ${ticket.provider}, current: ${storage.provider})`,
    );
  }
  if (!storage.stat || !storage.readPrefix) {
    throw new ApiError(501, "Provider verify support nahi karta — multipart upload use karein");
  }

  // 1. Actual size (object exists bhi karta hai ya nahi — yehi PUT ka proof)
  let actualSize = 0;
  try {
    const st = await storage.stat(ticket.storageKey);
    actualSize = st.sizeBytes;
  } catch {
    await consumeTicket(ticket.id);
    throw new ApiError(422, "Upload nahi mili — pehle PUT complete karein");
  }
  if (actualSize !== ticket.expectedSize) {
    try {
      await storage.delete(ticket.storageKey);
    } catch {
      /* best-effort */
    }
    await consumeTicket(ticket.id);
    throw new ApiError(413, `Size mismatch (expected ${ticket.expectedSize}, got ${actualSize})`);
  }

  // 2. Magic-byte signature (spoofed extension/content-type pakdo)
  const head = await storage.readPrefix(ticket.storageKey, 16 * 1024);
  const magic = await verifyMagicBytes(head, ticket.expectedMime);
  if (!magic.ok) {
    try {
      await storage.delete(ticket.storageKey);
    } catch {
      /* best-effort */
    }
    await consumeTicket(ticket.id);
    throw new ApiError(
      422,
      `File signature mismatch (detected: ${magic.detected ?? "unknown"}, expected: ${ticket.expectedMime})`,
    );
  }

  // 3. Media row + ticket consume
  const [created] = await db
    .insert(mediaFiles)
    .values({
      profileId: profile.id,
      fileName: encryptField(ticket.fileName),
      mimeType: ticket.expectedMime,
      sizeBytes: actualSize,
      storageProvider: storage.provider,
      storageKey: encryptField(ticket.storageKey),
      url: storage.getUrl(ticket.storageKey),
    })
    .returning();
  await consumeTicket(ticket.id);

  return json({
    file: {
      ...created,
      fileName: ticket.fileName,
      storageKey: ticket.storageKey,
    },
    category: fileCategory(ticket.expectedMime),
  }, { status: 201 });
});
