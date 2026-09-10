"use client";

// =============================================================================
// 📇 VCardButton — "Save to Contacts" (.vcf) button for public bio profiles
// When clicked on mobile or desktop, downloads a clean vCard 3.0 file that
// directly prompts iOS & Android to add the creator to their phone contacts.
// =============================================================================
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface VCardButtonProps {
  displayName: string;
  slug: string;
  bio?: string;
  avatarUrl?: string | null;
}

export function VCardButton({
  displayName,
  slug,
  bio,
  avatarUrl,
}: VCardButtonProps) {
  function downloadVCard() {
    const publicUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${slug}`
      : `https://linkforge-demo.vercel.app/${slug}`;

    // Standard vCard 3.0 format
    const vcardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${displayName}`,
      `N:${displayName};;;;`,
      bio ? `NOTE:${bio.replace(/\n/g, "\\n")}` : "",
      `URL:${publicUrl}`,
      avatarUrl ? `PHOTO;VALUE=URI:${avatarUrl}` : "",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([vcardLines], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug || "contact"}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Contact card (.vcf) downloaded!");
  }

  return (
    <button
      type="button"
      onClick={downloadVCard}
      title="Save to Phone Contacts (.vcf)"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
      aria-label="Save contact to phone"
    >
      <UserPlus className="h-4 w-4" />
    </button>
  );
}
