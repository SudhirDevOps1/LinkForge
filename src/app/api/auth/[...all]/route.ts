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
import { auth } from "@/lib/auth/better-auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
