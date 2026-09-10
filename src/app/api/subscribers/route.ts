// =============================================================================
// 👥 /api/subscribers — Dashboard Subscribers Management & CSV Export
// -----------------------------------------------------------------------------
// Lists all newsletter subscribers for the authenticated user's profile.
// Supports ?export=csv for direct download.
// =============================================================================
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { autoMigrate } from "@/db/auto-migrate";
import { subscribers } from "@/db/schema";
import { ApiError, handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const GET = handle(async (req: Request) => {
  await autoMigrate();
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const url = new URL(req.url);
  const isCsv = url.searchParams.get("export") === "csv";

  const rows = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.profileId, profile.id))
    .orderBy(desc(subscribers.createdAt))
    .limit(500);

  if (isCsv) {
    const csvRows = [
      ["Email", "Status", "Subscribed At"],
      ...rows.map((r) => [
        `"${r.email.replace(/"/g, '""')}"`,
        r.status,
        r.createdAt.toISOString(),
      ]),
    ];
    const csvContent = csvRows.map((e) => e.join(",")).join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="subscribers-${profile.slug}-${Date.now()}.csv"`,
      },
    });
  }

  return json({
    subscribers: rows.map((r) => ({
      id: r.id,
      email: r.email,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    totalCount: rows.length,
  });
});

export const DELETE = handle(async (req: Request) => {
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) throw new ApiError(400, "Subscriber ID required");

  await db
    .delete(subscribers)
    .where(and(eq(subscribers.id, id), eq(subscribers.profileId, profile.id)));

  return json({ success: true });
});
