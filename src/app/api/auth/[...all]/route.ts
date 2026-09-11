// =============================================================================
// 🛡️ LinkForge — Better Auth Catch-All API Route Handler
// -----------------------------------------------------------------------------
// Dispatches all Better Auth routes (/api/auth/*) including:
// - /api/auth/sign-in/email
// - /api/auth/sign-up/email
// - /api/auth/sign-out
// - /api/auth/get-session
// - /api/auth/verify-email
// =============================================================================
import crypto from "crypto";
import { auth } from "@/lib/auth/better-auth";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

function bridgeRequestCookies(req: Request): Request {
  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.includes("lf_session=") && !cookieHeader.includes("better-auth.session_token=")) {
    const match = cookieHeader.match(/(?:^|;\s*)lf_session=([^;]+)/);
    if (match && match[1]) {
      const token = match[1];
      const secret =
        process.env.BETTER_AUTH_SECRET ||
        process.env.AUTH_SECRET ||
        process.env.SESSION_SECRET ||
        "linkforge-better-auth-secure-secret-entropy-32b";
      const signature = crypto.createHmac("sha256", secret).update(token).digest("base64");
      const signedToken = `${token}.${encodeURIComponent(signature)}`;
      try {
        req.headers.set("cookie", `${cookieHeader}; better-auth.session_token=${signedToken}`);
      } catch {
        const headers = new Headers(req.headers);
        headers.set("cookie", `${cookieHeader}; better-auth.session_token=${signedToken}`);
        return new Request(req.url, {
          method: req.method,
          headers,
          body: req.body,
          // @ts-expect-error duplex option for Node fetch stream
          duplex: "half",
        });
      }
    }
  }
  return req;
}

export const GET = (req: Request) => handlers.GET(bridgeRequestCookies(req));
export const POST = (req: Request) => handlers.POST(bridgeRequestCookies(req));
