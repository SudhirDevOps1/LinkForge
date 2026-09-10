// =============================================================================
// 🌐 Edge Proxy (Next.js 16+ convention) — Edge-runtime compatible
// -----------------------------------------------------------------------------
// 1. Custom Domains: APP_DOMAIN ke alawa kisi bhi pointed domain par aayi
//    request ko /_domain par rewrite karta hai (DB lookup page me hota hai).
// 2. /dashboard guard: session cookie presence check (full validation
//    dashboard layout me DB ke saath hoti hai — edge me DB nahi chalate).
// =============================================================================
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "lf_session";
const APP_DOMAIN = process.env.APP_DOMAIN ?? ""; // e.g. linkforge.app

function isAppHost(host: string): boolean {
  if (!host) return true;
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) return true;
  if (!APP_DOMAIN) return true; // single-domain mode (preview/dev)
  if (host === APP_DOMAIN || host.endsWith(`.${APP_DOMAIN}`)) return true;
  // Platform preview domains allowed
  if (
    host.endsWith(".vercel.app") ||
    host.endsWith(".netlify.app") ||
    host.endsWith(".pages.dev") ||
    host.endsWith(".onrender.com") ||
    host.endsWith(".up.railway.app")
  ) {
    return true;
  }
  return false;
}

export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();

  // --- Custom domain routing ------------------------------------------------
  if (!isAppHost(host)) {
    const url = req.nextUrl.clone();
    url.pathname = "/_domain";
    url.search = "";
    return NextResponse.rewrite(url);
  }

  // --- Dashboard auth gate (cookie presence only) ----------------------------
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Keep middleware export alias for older bundler compatibility
export const middleware = proxy;

export const config = {
  // Static assets, files aur infra paths skip
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/files|uploads).*)"],
};
