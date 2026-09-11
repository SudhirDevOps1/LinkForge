// =============================================================================
// 🛡️ LinkForge — Better Auth Client SDK
// -----------------------------------------------------------------------------
// Universal client SDK for Better Auth, providing reactive hooks (useSession)
// and authentication action handlers (signIn, signUp, signOut).
// =============================================================================
"use client";

import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  anonymousClient,
  organizationClient,
  phoneNumberClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
  plugins: [
    passkeyClient(),
    twoFactorClient(),
    phoneNumberClient(),
    adminClient(),
    anonymousClient(),
    organizationClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
