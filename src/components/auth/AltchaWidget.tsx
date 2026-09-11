"use client";

// =============================================================================
// 🛡️ ALTCHA Proof-of-Work Verification Widget (Client Component)
// -----------------------------------------------------------------------------
// Privacy-first, zero-cookie, zero-tracking CAPTCHA alternative.
// Solves cryptographic SHA-256 proof-of-work in-browser using Web Crypto API.
// =============================================================================
import { CheckCircle2, Loader2, RefreshCw, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export interface AltchaWidgetProps {
  onVerify: (payloadBase64: string) => void;
  onExpire?: () => void;
  autoSolve?: boolean;
  className?: string;
}

interface AltchaChallenge {
  algorithm: "SHA-256";
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

type WidgetStatus = "idle" | "fetching" | "solving" | "verified" | "error";

// Helper: Convert string to ArrayBuffer for Web Crypto
const encoder = new TextEncoder();

// Helper: Convert ArrayBuffer to hex string
function bufToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export function AltchaWidget({
  onVerify,
  onExpire,
  autoSolve = false,
  className = "",
}: AltchaWidgetProps) {
  const [status, setStatus] = useState<WidgetStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isCancelledRef = useRef(false);

  // Fetch challenge from server and solve in browser
  async function runVerification() {
    if (status === "solving" || status === "fetching" || status === "verified") return;

    isCancelledRef.current = false;
    setStatus("fetching");
    setErrorMessage(null);
    setProgress(0);

    try {
      const res = await fetch("/api/auth/altcha", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Unable to fetch security challenge. Please check your connection.");
      }

      const challengeData = (await res.json()) as AltchaChallenge;
      if (!challengeData?.challenge || !challengeData?.salt) {
        throw new Error("Malformed security challenge received.");
      }

      setStatus("solving");

      // Solve Proof-of-Work in background chunk batches to avoid UI freezing
      const targetChallenge = challengeData.challenge.toLowerCase();
      const salt = challengeData.salt;
      const maxNumber = challengeData.maxnumber || 50_000;
      const batchSize = 1000;
      let solutionNumber: number | null = null;

      for (let start = 1; start <= maxNumber; start += batchSize) {
        if (isCancelledRef.current) return;

        const end = Math.min(start + batchSize - 1, maxNumber);
        for (let n = start; n <= end; n++) {
          const inputData = encoder.encode(`${salt}${n}`);
          const hashBuffer = await window.crypto.subtle.digest("SHA-256", inputData);
          const hashHex = bufToHex(hashBuffer);

          if (hashHex === targetChallenge) {
            solutionNumber = n;
            break;
          }
        }

        if (solutionNumber !== null) break;

        // Update progress percentage
        setProgress(Math.round((end / maxNumber) * 100));

        // Yield execution to browser render loop
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (solutionNumber === null) {
        throw new Error("Could not find a valid proof-of-work solution.");
      }

      // Encode payload to base64 JSON
      const payloadObj = {
        algorithm: challengeData.algorithm,
        challenge: challengeData.challenge,
        number: solutionNumber,
        salt: challengeData.salt,
        signature: challengeData.signature,
      };

      const base64Payload = btoa(JSON.stringify(payloadObj));
      setStatus("verified");
      setProgress(100);
      onVerify(base64Payload);
    } catch (err) {
      console.error("[altcha-widget] error:", err);
      setStatus("error");
      setErrorMessage((err as Error).message || "Security verification failed");
    }
  }

  // Handle autoSolve on mount if requested
  useEffect(() => {
    if (autoSolve) {
      const t = setTimeout(() => {
        runVerification();
      }, 400);
      return () => {
        clearTimeout(t);
        isCancelledRef.current = true;
      };
    }
  }, [autoSolve]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-md transition-all ${
        status === "verified"
          ? "border-emerald-500/30 bg-emerald-950/10"
          : status === "error"
            ? "border-rose-500/30 bg-rose-950/10"
            : "hover:border-zinc-700/80"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Checkbox / Action Area */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={runVerification}
            disabled={status === "fetching" || status === "solving" || status === "verified"}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
              status === "verified"
                ? "border-emerald-500 bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                : status === "solving" || status === "fetching"
                  ? "border-violet-500 bg-violet-500/10 text-violet-400"
                  : status === "error"
                    ? "border-rose-500/80 bg-rose-500/10 text-rose-400"
                    : "border-zinc-700 bg-zinc-800/60 hover:border-zinc-500 hover:bg-zinc-800"
            }`}
            aria-label="Verify security protection"
          >
            {status === "verified" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : status === "solving" || status === "fetching" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : status === "error" ? (
              <RefreshCw className="h-3.5 w-3.5" />
            ) : (
              <div className="h-2 w-2 rounded-sm bg-transparent" />
            )}
          </button>

          <div className="text-left">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
              {status === "verified" ? (
                <span className="text-emerald-400">Verified Human</span>
              ) : status === "solving" ? (
                <span className="text-violet-300">
                  Verifying proof-of-work... {progress > 0 ? `${progress}%` : ""}
                </span>
              ) : status === "fetching" ? (
                <span className="text-zinc-400">Loading security challenge...</span>
              ) : status === "error" ? (
                <span className="text-rose-400">Verification failed. Click to retry.</span>
              ) : (
                <span
                  onClick={runVerification}
                  className="cursor-pointer hover:text-white"
                >
                  I'm not a robot
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500">
              {status === "verified"
                ? "Cryptographic proof validated"
                : "Proof-of-work bot defense"}
            </p>
          </div>
        </div>

        {/* Brand / Shield Badge */}
        <div className="flex items-center gap-1.5 text-zinc-500">
          {status === "verified" ? (
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          ) : status === "error" ? (
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          ) : (
            <Shield className="h-4 w-4 text-zinc-400" />
          )}
          <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
            ALTCHA
          </span>
        </div>
      </div>

      {/* Solving Progress Bar */}
      {status === "solving" && (
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-150"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
      )}

      {errorMessage && status === "error" && (
        <p className="mt-2 text-[11px] text-rose-400">{errorMessage}</p>
      )}
    </div>
  );
}
