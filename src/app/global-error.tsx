"use client";

// =============================================================================
// 💥 Global error boundary — root layout crash hone par bhi recovery UI
// (Is file me apna <html>/<body> chahiye hota hai — Next.js requirement)
// =============================================================================
import { Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#050508", color: "#f4f4f5", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>LinkForge — kuch gadbad ho gayi</h1>
          <p style={{ color: "#71717a", fontSize: 14, maxWidth: 380 }}>
            App crash ho gayi hai. Page refresh karein — problem bani rahe to kuch der
            baad try karein.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={() => reset()}
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 12,
                border: 0,
                background: "#8b5cf6",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RefreshCw size={16} /> Try again
            </button>
            <a
              href="/"
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.15)",
                color: "#e4e4e7",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Home size={16} /> Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
