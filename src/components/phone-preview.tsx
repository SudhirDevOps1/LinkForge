"use client";

// =============================================================================
// 📱 PhonePreview — dashboard editor ka live phone-frame preview
// BioRenderer ko scaled device frame me dikhata hai.
// =============================================================================
import type { Link } from "@/db/schema";
import { BioRenderer, type BioProfileShape } from "./bio-renderer";

export function PhonePreview({
  profile,
  links,
}: {
  profile: BioProfileShape;
  links: Link[];
}) {
  return (
    <div className="sticky top-6 mx-auto w-fit">
      {/* Device frame */}
      <div className="relative h-[640px] w-[310px] rounded-[44px] border border-white/15 bg-black p-2.5 shadow-[0_30px_80px_-20px_rgba(139,92,246,.35)]">
        {/* Dynamic island */}
        <div className="absolute left-1/2 top-4 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="relative h-full w-full overflow-hidden rounded-[36px]">
          <div className="h-full w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <BioRenderer profile={profile} links={links} trackClicks={false} />
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-zinc-500">
        Live preview — changes real-time me yahan dikhte hain
      </p>
    </div>
  );
}
