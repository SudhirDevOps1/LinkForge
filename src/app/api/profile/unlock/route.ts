// 🔓 /api/profile/unlock — password-protected profile ke liye visitor unlock
// Visitor POST karta hai { slug, password } → bcrypt compare → signed cookie set
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { handle, json } from "@/lib/api";

export const POST = handle(async (req: Request) => {
  const body = (await req.json().catch(() => ({}))) as { slug?: string; password?: string };
  const { slug, password } = body;

  if (!slug || !password) {
    return json({ error: "Handle and password are required" }, { status: 400 });
  }

  const [profile] = await db
    .select({ id: profiles.id, profilePassword: profiles.profilePassword })
    .from(profiles)
    .where(eq(profiles.slug, slug))
    .limit(1);

  if (!profile || !profile.profilePassword) {
    return json({ error: "Profile not found or password not configured" }, { status: 404 });
  }

  const valid = await compare(password, profile.profilePassword);
  if (!valid) {
    return json({ error: "Galat password" }, { status: 401 });
  }

  // Set a short-lived cookie so visitor doesn't have to re-enter on refresh
  const jar = await cookies();
  jar.set(`pf_unlock_${profile.id}`, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return json({ ok: true });
});
