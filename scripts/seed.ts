// =============================================================================
// 🌱 Seed Script — demo data ke saath instant setup
// Run: npx tsx scripts/seed.ts
//
// Creates:
//   👤 demo@linkforge.dev / demo1234
//   🪪 /demo bio page (bento layout, midnight theme, embeds)
//   📊 30 din ka realistic analytics data (privacy-safe fake hashes)
//   📁 Demo PDF (media library) + file link
//   🪝 sample webhook + 🔌 sample API key
// =============================================================================
import "dotenv/config";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { count, eq, max } from "drizzle-orm";
import { db } from "../src/db";
import {
  apiKeys,
  events,
  links,
  mediaFiles,
  profiles,
  users,
  webhooks,
} from "../src/db/schema";
import { randomToken, sha256Hex } from "../src/lib/crypto";

// Deterministic PRNG — har run par same realistic data
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

const COUNTRIES = ["IN", "US", "GB", "DE", "BR", "IN", "US", "IN", "AE", "SG"];
const DEVICES = ["Mobile", "Mobile", "Mobile", "Desktop", "Desktop", "Tablet"];
const BROWSERS = ["Chrome", "Chrome", "Safari", "Firefox", "Edge"];
const OS = ["Android", "iOS", "Windows", "macOS", "Android", "iOS"];
const REFERRERS = ["Direct", "instagram.com", "twitter.com", "youtube.com", "Direct", "linkedin.com", "whatsapp.com"];

/** Valid one-page PDF (correct xref offsets) — demo media-kit ke liye */
function buildDemoPdf(): Buffer {
  const content =
    "BT /F1 28 Tf 72 720 Td (LinkForge Media Kit) Tj ET\n" +
    "BT /F1 14 Tf 72 684 Td (One link. Every platform. Zero lock-in.) Tj ET\n" +
    "BT /F1 12 Tf 72 650 Td (This demo PDF is served from your configured storage.) Tj ET\n" +
    "BT /F1 12 Tf 72 632 Td (Try: Dashboard > Media > upload your own files.) Tj ET\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefPos = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

async function main() {
  console.log("🌱 Seeding LinkForge demo data...\n");

  // ---- Demo user -------------------------------------------------------------
  const email = "demo@linkforge.dev";
  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    console.log("✓ Demo user pehle se exists karta hai, skip");
  } else {
    [user] = await db
      .insert(users)
      .values({
        email,
        name: "Aarav Kapoor",
        passwordHash: await bcrypt.hash("demo1234", 10),
        avatarUrl: null,
      })
      .returning();
    console.log("✓ Demo user banaya:", email);
  }

  // ---- Demo profile ----------------------------------------------------------
  let [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.slug, "demo"))
    .limit(1);
  if (profile) {
    console.log("✓ Demo profile exists, skip");
  } else {
    [profile] = await db
      .insert(profiles)
      .values({
        userId: user.id,
        slug: "demo",
        displayName: "Aarav Kapoor",
        bio: "Creator & Developer — shipping products, videos and code every week. Building in public.",
        avatarUrl: "/api/files/avatars/demo-avatar.png",
        theme: "midnight",
        layout: "bento",
        seoTitle: "Aarav Kapoor — Creator & Developer",
        seoDescription: "Aarav ke saare projects, videos aur socials ek jagah.",
      })
      .returning();
    console.log("✓ Demo profile banaya: /demo");
  }

  // ---- Links -------------------------------------------------------------------
  const existingLinks = await db
    .select({ count: count() })
    .from(links)
    .where(eq(links.profileId, profile.id));
  let createdLinks: Array<{ id: string; title: string; url: string }> = [];

  if ((existingLinks[0]?.count ?? 0) > 0) {
    console.log("✓ Links exist karte hain, skip");
    createdLinks = await db
      .select({ id: links.id, title: links.title, url: links.url })
      .from(links)
      .where(eq(links.profileId, profile.id));
  } else {
    const seedLinks = [
      { title: "Latest YouTube Video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", description: "Building a link-in-bio SaaS in 24 hours", type: "youtube", size: "feature", icon: "video", position: 0 },
      { title: "My Spotify Playlist", url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M", description: "Code karne wala mix", type: "spotify", size: "wide", icon: "music", position: 1 },
      { title: "Portfolio Website", url: "https://vercel.com", description: "Saare projects ek jagah", type: "link", size: "standard", icon: "globe", position: 2 },
      { title: "Book a 1:1 Call", url: "https://cal.com", description: "30 min mentorship", type: "link", size: "standard", icon: "calendar", position: 3 },
      { title: "GitHub", url: "https://github.com/coleam00/link-in-bio-page-builder", description: "Open source contributions", type: "github", size: "standard", icon: "link", position: 4 },
      { title: "X (Twitter)", url: "https://x.com", description: "Daily build-in-public updates", type: "x", size: "standard", icon: "at", position: 5 },
      { title: "Instagram", url: "https://instagram.com", description: "Behind the scenes", type: "instagram", size: "wide", icon: "camera", position: 6 },
      { title: "Newsletter — Ship Weekly", url: "https://substack.com", description: "Har hafte ek naya build", type: "link", size: "wide", icon: "mail", position: 7 },
      { title: "Merch Store", url: "https://shopify.com", description: "Limited edition dev merch", type: "link", size: "standard", icon: "shop", position: 8 },
      { title: "Resume.pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", description: "Hire me", type: "link", size: "standard", icon: "file", position: 9 },
    ];
    for (const link of seedLinks) {
      const [created] = await db
        .insert(links)
        .values({
          id: crypto.randomUUID(),
          profileId: profile.id,
          isActive: true,
          title: link.title,
          url: link.url,
          description: link.description,
          type: link.type,
          size: link.size,
          icon: link.icon,
          position: link.position,
        })
        .returning({ id: links.id, title: links.title, url: links.url });
      createdLinks.push(created);
    }
    console.log(`✓ ${createdLinks.length} links banaye`);
  }

  // ---- Demo PDF + media file + file link -------------------------------------------
  const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
  const pdfPath = path.join(uploadDir, "files", "demo-media-kit.pdf");
  const pdfUrl = "/api/files/files/demo-media-kit.pdf";
  const [mediaAgg] = await db
    .select({ count: count() })
    .from(mediaFiles)
    .where(eq(mediaFiles.profileId, profile.id));

  if ((mediaAgg?.count ?? 0) === 0) {
    if (!existsSync(pdfPath)) {
      mkdirSync(path.dirname(pdfPath), { recursive: true });
      writeFileSync(pdfPath, buildDemoPdf());
      console.log("✓ Demo PDF likha:", pdfPath);
    }
    const stat = await import("fs").then((fs) => fs.statSync(pdfPath));
    await db.insert(mediaFiles).values({
      profileId: profile.id,
      fileName: "demo-media-kit.pdf",
      mimeType: "application/pdf",
      sizeBytes: stat.size,
      storageProvider: process.env.STORAGE_PROVIDER ?? "local",
      storageKey: "files/demo-media-kit.pdf",
      url: pdfUrl,
    });
    const [posAgg] = await db
      .select({ max: max(links.position) })
      .from(links)
      .where(eq(links.profileId, profile.id));
    await db.insert(links).values({
      id: crypto.randomUUID(),
      profileId: profile.id,
      title: "Media Kit (PDF)",
      url: pdfUrl,
      description: "Brand collabs ke liye one-pager",
      type: "file",
      size: "wide",
      icon: "file",
      position: (posAgg?.max ?? 9) + 1,
      isActive: true,
    });
    console.log("✓ Demo media file + file link banaye");
  } else {
    console.log("✓ Media files exist karte hain, skip");
  }

  // ---- Analytics events -----------------------------------------------------------
  const [eventAgg] = await db
    .select({ count: count() })
    .from(events)
    .where(eq(events.profileId, profile.id));
  if ((eventAgg?.count ?? 0) > 0) {
    console.log("✓ Analytics events exist karte hain, skip");
  } else {
    const rows: Array<typeof events.$inferInsert> = [];
    for (let day = 29; day >= 0; day--) {
      // growth curve: purane din kam, recent din zyada
      const growth = 1 + (29 - day) * 0.14;
      const viewsToday = Math.floor((6 + rand() * 14) * growth);
      for (let v = 0; v < viewsToday; v++) {
        const ts = new Date(Date.now() - day * 86_400_000 - Math.floor(rand() * 20 * 3_600_000));
        rows.push({
          profileId: profile.id,
          linkId: null,
          type: "view",
          referrer: pick(REFERRERS),
          country: pick(COUNTRIES),
          device: pick(DEVICES),
          browser: pick(BROWSERS),
          os: pick(OS),
          ipHash: randomToken(8),
          createdAt: ts,
        });
        // ~40% CTR
        if (rand() < 0.42 && createdLinks.length > 0) {
          const link = pick(createdLinks);
          rows.push({
            profileId: profile.id,
            linkId: link.id,
            type: "click",
            referrer: pick(REFERRERS),
            country: pick(COUNTRIES),
            device: pick(DEVICES),
            browser: pick(BROWSERS),
            os: pick(OS),
            ipHash: randomToken(8),
            createdAt: new Date(ts.getTime() + Math.floor(rand() * 90_000)),
          });
        }
      }
    }
    // chunks me insert
    for (let i = 0; i < rows.length; i += 200) {
      await db.insert(events).values(rows.slice(i, i + 200));
    }
    console.log(`✓ ${rows.length} analytics events (30 din)`);
  }

  // ---- Webhook sample -------------------------------------------------------------
  const [hookAgg] = await db
    .select({ count: count() })
    .from(webhooks)
    .where(eq(webhooks.profileId, profile.id));
  if ((hookAgg?.count ?? 0) === 0) {
    await db.insert(webhooks).values({
      id: crypto.randomUUID(),
      profileId: profile.id,
      url: "https://webhook.site/your-unique-url",
      secret: randomToken(16),
      events: "click",
      isActive: false, // sample — disabled by default
    });
    console.log("✓ Sample webhook (disabled)");
  }

  // ---- API key sample ----------------------------------------------------------------
  const demoKey = `lfk_${randomToken(24)}`;
  const [keyAgg] = await db.select({ count: count() }).from(apiKeys).where(eq(apiKeys.userId, user.id));
  if ((keyAgg?.count ?? 0) === 0) {
    await db.insert(apiKeys).values({
      id: crypto.randomUUID(),
      userId: user.id,
      name: "Demo REST API key",
      prefix: demoKey.slice(0, 12),
      keyHash: sha256Hex(demoKey),
    });
    console.log("✓ Demo API key");
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 Seed complete!\n");
  console.log("   Login:    demo@linkforge.dev / demo1234");
  console.log("   Bio page: http://localhost:3000/demo");
  console.log("   Dashboard: http://localhost:3000/dashboard");
  if (demoKey) console.log(`   API key:  ${demoKey}  (sirf ab dikhi)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
