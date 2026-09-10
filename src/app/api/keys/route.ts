// 🔌 /api/keys — REST API keys: GET (list) / POST (create)
// Raw key sirf create response me dikhti hai — DB me sirf SHA-256 hash.
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { randomToken, sha256Hex } from "@/lib/crypto";
import { apiKeySchema } from "@/lib/validations";

export const GET = handle(async () => {
  const { user } = await requireUser();
  const rows = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .orderBy(desc(apiKeys.createdAt));
  return json({
    keys: rows.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      lastUsedAt: k.lastUsedAt,
      revoked: Boolean(k.revokedAt),
      createdAt: k.createdAt,
    })),
  });
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "keys:write", 20);
  const { user } = await requireUser();
  const { name } = parseOrThrow(apiKeySchema, await req.json().catch(() => ({})));

  const rawKey = `lfk_${randomToken(24)}`;
  const [created] = await db
    .insert(apiKeys)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      name,
      prefix: rawKey.slice(0, 12),
      keyHash: sha256Hex(rawKey),
    })
    .returning();

  return json(
    {
      key: {
        id: created.id,
        name: created.name,
        prefix: created.prefix,
        createdAt: created.createdAt,
      },
      rawKey, // ⚠️ only visible once — copy and store in a secure location
    },
    { status: 201 },
  );
});
