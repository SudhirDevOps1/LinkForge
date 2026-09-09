// 404 — unknown slug
import { Link2 } from "lucide-react";
import Link from "next/link";

export default function BioNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
        <Link2 className="h-7 w-7 text-zinc-500" />
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold">Yeh page exist nahi karta</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        Ho sakta hai link galat ho ya page unpublished ho gaya ho.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
      >
        Apna page banayein — free
      </Link>
    </div>
  );
}
