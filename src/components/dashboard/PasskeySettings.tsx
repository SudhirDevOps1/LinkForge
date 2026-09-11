"use client";

// =============================================================================
// 🔑 PasskeySettings — WebAuthn / FIDO2 Biometric Security Keys Management
// =============================================================================
import { Fingerprint, Key, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Card, Field, Input } from "@/components/ui";
import { authClient } from "@/lib/auth/auth-client";

interface PasskeyItem {
  id: string;
  name?: string | null;
  createdAt: string | Date;
}

export function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  async function loadPasskeys() {
    try {
      setLoading(true);
      const res = await authClient.passkey.listUserPasskeys();
      if (res.data) {
        setPasskeys(res.data as unknown as PasskeyItem[]);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPasskeys();
  }, []);

  async function handleAddPasskey(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await authClient.passkey.addPasskey({
        name: name.trim() || undefined,
      });

      if (res.error) {
        toast.error(res.error.message || "Failed to register passkey.");
        return;
      }

      toast.success("Passkey registered successfully!");
      setName("");
      setShowAdd(false);
      await loadPasskeys();
    } catch (err) {
      toast.error((err as Error).message || "Passkey registration was cancelled.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeletePasskey(id: string) {
    try {
      const res = await authClient.passkey.deletePasskey({ id });
      if (res.error) {
        toast.error(res.error.message || "Failed to delete passkey.");
        return;
      }
      toast.success("Passkey removed.");
      await loadPasskeys();
    } catch {
      toast.error("Failed to delete passkey.");
    }
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-violet-400" />
            Passkeys (Biometric & Security Keys)
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Sign in without a password using Touch ID, Face ID, Windows Hello, or hardware security keys (FIDO2).
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Passkey
        </Button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddPasskey}
          className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4 space-y-3"
        >
          <Field
            label="Passkey Name (optional)"
            hint="e.g. MacBook Touch ID, Work YubiKey, iPhone"
          >
            <Input
              placeholder="e.g. Personal Laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={adding}
            />
          </Field>
          <div className="flex items-center gap-2">
            <Button type="submit" loading={adding}>
              Register Device
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdd(false)}
              disabled={adding}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-4 text-center text-xs text-zinc-500">Loading passkeys...</div>
      ) : passkeys.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-zinc-500">
          No passkeys registered yet. Add a passkey to enable instant biometric login.
        </div>
      ) : (
        <div className="space-y-2">
          {passkeys.map((pk) => (
            <div
              key={pk.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-300"
            >
              <div className="flex items-center gap-2.5">
                <Key className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="font-medium text-white">{pk.name || "Hardware Security Key"}</p>
                  <p className="text-[10px] text-zinc-500">
                    Added on {new Date(pk.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeletePasskey(pk.id)}
                className="h-7 px-2.5 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
