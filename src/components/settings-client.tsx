"use client";

// =============================================================================
// ⚙️ SettingsClient — profile, avatar, data (export/import), webhooks, API keys
// =============================================================================
import {
  AlertTriangle,
  Camera,
  Copy,
  Database,
  Download,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  Megaphone,
  Plug,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Webhook,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, Field, Input, Select, Switch, Tabs, Textarea } from "@/components/ui";

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secretPreview: string;
  createdAt: string;
}

interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revoked: boolean;
  createdAt: string;
}

interface AnnouncementShape {
  text: string;
  emoji?: string;
  url?: string;
  expiresAt?: string;
}

interface ProfileShape {
  slug: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  customDomain: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  analyticsEnabled: boolean;
  isPublished: boolean;
  // 🔒 Privacy
  hasPassword: boolean; // server sends true/false, never the hash
  noIndex: boolean;
  hidePublicStats: boolean;
  announcement: AnnouncementShape | null;
}

async function api<T = Record<string, unknown>>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}

export function SettingsClient({
  profile,
  userEmail,
  webhooks: initialHooks,
  apiKeys: initialKeys,
}: {
  profile: ProfileShape;
  userEmail: string;
  webhooks: WebhookRow[];
  apiKeys: ApiKeyRow[];
}) {
  const [tab, setTab] = useState("general");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">{userEmail}</p>
      </div>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "general", label: "General", icon: <UserRound className="h-4 w-4" /> },
          { id: "privacy", label: "Privacy", icon: <Shield className="h-4 w-4" /> },
          { id: "avatar", label: "Avatar", icon: <Camera className="h-4 w-4" /> },
          { id: "data", label: "Data", icon: <Database className="h-4 w-4" /> },
          { id: "webhooks", label: "Webhooks", icon: <Webhook className="h-4 w-4" /> },
          { id: "keys", label: "API Keys", icon: <KeyRound className="h-4 w-4" /> },
        ]}
      />
      {tab === "general" ? <GeneralTab profile={profile} /> : null}
      {tab === "privacy" ? <PrivacyTab profile={profile} /> : null}
      {tab === "avatar" ? <AvatarTab profile={profile} /> : null}
      {tab === "data" ? <DataTab /> : null}
      {tab === "webhooks" ? <WebhooksTab initialHooks={initialHooks} /> : null}
      {tab === "keys" ? <ApiKeysTab initialKeys={initialKeys} /> : null}
    </div>
  );
}

// ---- General ---------------------------------------------------------------------
function GeneralTab({ profile }: { profile: ProfileShape }) {
  const [form, setForm] = useState({
    slug: profile.slug,
    displayName: profile.displayName,
    bio: profile.bio,
    customDomain: profile.customDomain ?? "",
    seoTitle: profile.seoTitle ?? "",
    seoDescription: profile.seoDescription ?? "",
    analyticsEnabled: profile.analyticsEnabled,
    isPublished: profile.isPublished,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api("/api/profile", { method: "PATCH", body: JSON.stringify(form) });
      toast.success("Profile save ho gayi");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-5">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name">
            <Input
              maxLength={80}
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </Field>
          <Field label="Slug" hint="Aapka public URL: /your-slug">
            <Input
              maxLength={39}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
            />
          </Field>
        </div>
        <Field label="Bio" hint={`${form.bio.length}/300`}>
          <Textarea
            maxLength={300}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-3 text-sm text-zinc-300">
            <Switch
              checked={form.isPublished}
              onCheckedChange={(v) => setForm({ ...form, isPublished: v })}
              aria-label="published"
            />
            Page published
          </label>
          <label className="flex items-center gap-3 text-sm text-zinc-300">
            <Switch
              checked={form.analyticsEnabled}
              onCheckedChange={(v) => setForm({ ...form, analyticsEnabled: v })}
              aria-label="analytics"
            />
            Analytics enabled
          </label>
        </div>
        <Button onClick={save} loading={saving}>
          Save profile
        </Button>
      </Card>

      <Card className="space-y-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Globe className="h-5 w-5 text-violet-300" /> Custom domain
        </h2>
        <Field
          label="Your domain"
          hint="Apne DNS me CNAME record banao: bio → aapka LinkForge deployment domain. Fir yahan domain save karo."
        >
          <Input
            placeholder="bio.example.com"
            value={form.customDomain}
            onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
          />
        </Field>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs leading-relaxed text-zinc-400">
          <p className="text-zinc-300"># DNS setup</p>
          <p>TYPE&nbsp;&nbsp;NAME&nbsp;&nbsp;VALUE</p>
          <p>CNAME&nbsp;&nbsp;bio&nbsp;&nbsp;&nbsp;your-app.vercel.app</p>
          <p className="mt-2 text-zinc-500"># Vercel/Netlify dashboard me bhi domain add karna hoga</p>
        </div>
        <Button onClick={save} loading={saving} variant="secondary">
          Save domain
        </Button>
      </Card>

      <Card className="space-y-5">
        <h2 className="font-display text-lg font-semibold">SEO</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Meta title" hint="Blank = display name use hoga">
            <Input
              maxLength={120}
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
            />
          </Field>
          <Field label="Meta description">
            <Input
              maxLength={300}
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
            />
          </Field>
        </div>
        <Button onClick={save} loading={saving} variant="secondary">
          Save SEO
        </Button>
      </Card>

      <SecurityCard />
      <Card className="p-6 border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Brand & Appearance Studio
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Customize your profile typography (8 Google Fonts), card styles, atmosphere effects, and button shapes with real-time live phone preview.
            </p>
          </div>
          <a
            href="/dashboard/appearance"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-violet-500/25"
          >
            Open Appearance Studio
          </a>
        </div>
      </Card>
      <DangerZone />
    </div>
  );
}

// ---- Privacy Tab -----------------------------------------------------------------
function PrivacyTab({ profile }: { profile: ProfileShape }) {
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [privacyForm, setPrivacyForm] = useState({
    noIndex: profile.noIndex,
    hidePublicStats: profile.hidePublicStats,
  });
  const [ann, setAnn] = useState<AnnouncementShape>(
    profile.announcement ?? { text: "", emoji: "", url: "", expiresAt: "" },
  );
  const [saving, setSaving] = useState(false);

  async function savePrivacy() {
    setSaving(true);
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          ...privacyForm,
          ...(newPassword ? { profilePassword: newPassword } : {}),
        }),
      });
      toast.success("Privacy settings save ho gayi");
      setNewPassword("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removePassword() {
    setSaving(true);
    try {
      await api("/api/profile", { method: "PATCH", body: JSON.stringify({ profilePassword: "" }) });
      toast.success("Password hata diya gaya");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveAnnouncement() {
    setSaving(true);
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          announcement: ann.text.trim()
            ? {
                text: ann.text.trim(),
                emoji: ann.emoji?.trim() || undefined,
                url: ann.url?.trim() || undefined,
                expiresAt: ann.expiresAt || undefined,
              }
            : null,
        }),
      });
      toast.success("Announcement save ho gaya");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 🔒 Password Protection */}
      <Card className="space-y-5">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Shield className="h-5 w-5 text-violet-300" /> Profile Password
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Visitors ko apna profile dekhne se pehle password daalna hoga.
          </p>
        </div>
        {profile.hasPassword && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">Password abhi set hai. Visitors ko unlock karna hoga.</p>
            <Button variant="ghost" onClick={removePassword} loading={saving} className="ml-auto shrink-0">
              Remove
            </Button>
          </div>
        )}
        <Field label={profile.hasPassword ? "Change password" : "Set password"} hint="Min 4 characters">
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Naya password daalein"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </Field>
        <Button onClick={savePrivacy} loading={saving} disabled={!newPassword}>
          {profile.hasPassword ? "Update password" : "Set password"}
        </Button>
      </Card>

      {/* 🔍 SEO & Visibility */}
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Visibility & Analytics</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
            <Switch
              checked={privacyForm.noIndex}
              onCheckedChange={(v) => setPrivacyForm({ ...privacyForm, noIndex: v })}
              aria-label="noindex"
            />
            <div>
              <span className="font-medium">Search engines se chhupao</span>
              <p className="text-xs text-zinc-500">Google/Bing ko profile index nahi karne dega (noindex)</p>
            </div>
          </label>
          <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
            <Switch
              checked={privacyForm.hidePublicStats}
              onCheckedChange={(v) => setPrivacyForm({ ...privacyForm, hidePublicStats: v })}
              aria-label="hidePublicStats"
            />
            <div>
              <span className="font-medium">View count public page par chhupao</span>
              <p className="text-xs text-zinc-500">Visitors ko views/clicks nahi dikhengi</p>
            </div>
          </label>
        </div>
        <Button onClick={savePrivacy} loading={saving} variant="secondary">
          Save visibility settings
        </Button>
      </Card>

      {/* 📢 Announcement Banner */}
      <Card className="space-y-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Megaphone className="h-5 w-5 text-violet-300" /> Announcement Banner
        </h2>
        <p className="text-sm text-zinc-400">
          Profile ke top par ek highlighted message dikhaein (sale, event, news).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emoji (optional)">
            <Input
              maxLength={4}
              placeholder="🎉"
              value={ann.emoji ?? ""}
              onChange={(e) => setAnn({ ...ann, emoji: e.target.value })}
            />
          </Field>
          <Field label="Link URL (optional)">
            <Input
              placeholder="https://..."
              value={ann.url ?? ""}
              onChange={(e) => setAnn({ ...ann, url: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Announcement text" hint="Max 160 characters">
          <Textarea
            maxLength={160}
            placeholder="🚀 New collection launch! Click here"
            value={ann.text}
            onChange={(e) => setAnn({ ...ann, text: e.target.value })}
          />
        </Field>
        <Field label="Expires at (optional)" hint="Is date ke baad banner auto-hide ho jayega">
          <Input
            type="datetime-local"
            value={ann.expiresAt ?? ""}
            onChange={(e) => setAnn({ ...ann, expiresAt: e.target.value })}
          />
        </Field>
        <div className="flex gap-2">
          <Button onClick={saveAnnouncement} loading={saving}>
            Save announcement
          </Button>
          {profile.announcement && (
            <Button
              variant="ghost"
              onClick={() => {
                setAnn({ text: "", emoji: "", url: "", expiresAt: "" });
                saveAnnouncement();
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function SecurityCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function updatePassword() {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Naya password kam se kam 8 characters ka hona chahiye");
      return;
    }
    setSaving(true);
    try {
      await api("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success("Password kamyabi se badal gaya");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-display text-lg font-semibold">Change Password</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current password">
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label="New password" hint="Min 8 chars with letter & number">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
      </div>
      <Button
        variant="secondary"
        onClick={updatePassword}
        loading={saving}
        disabled={!newPassword}
      >
        Update Password
      </Button>
    </Card>
  );
}

function DangerZone() {
  const [busy, setBusy] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function signOutEverywhere() {
    setBusy(true);
    try {
      await api("/api/auth/logout-all", { method: "POST" });
      window.location.href = "/login";
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirmText.trim() !== "DELETE") {
      toast.error("Confirm karne ke liye DELETE type karein");
      return;
    }
    setDeleting(true);
    try {
      await api("/api/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmText: "DELETE" }),
      });
      toast.success("Aapka account aur sabhi data permanently delete ho gaya.");
      window.location.href = "/signup";
    } catch (err) {
      toast.error((err as Error).message);
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-amber-500/20">
        <h2 className="font-display text-lg font-semibold text-amber-300">Sessions</h2>
        <p className="mt-1.5 text-sm text-zinc-500">
          Saare devices aur browsers se active sessions turant terminate karein.
        </p>
        <Button variant="secondary" className="mt-4" onClick={signOutEverywhere} loading={busy}>
          <LogOut className="h-4 w-4" /> Sign out everywhere
        </Button>
      </Card>

      <Card className="border-red-500/30 bg-red-950/10">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-red-500/10 p-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold text-red-300">
              Permanently Delete Account
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Aapka account, username/slug, sabhi links, analytics data aur Backblaze B2 / local
              storage me uploaded sabhi documents/files permanently delete ho jayenge. Yeh action
              irreversible hai.
            </p>

            {!deleteConfirmOpen ? (
              <Button
                variant="danger"
                className="mt-4"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Delete My Account
              </Button>
            ) : (
              <div className="mt-4 space-y-3 rounded-2xl border border-red-500/30 bg-black/40 p-4">
                <p className="text-xs font-medium text-red-300">
                  Confirm karne ke liye neeche box me{" "}
                  <span className="font-mono font-bold text-white">DELETE</span> type karein:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="max-w-xs border-red-500/40 text-red-100 placeholder:text-zinc-600 focus:border-red-400"
                    autoFocus
                  />
                  <Button
                    variant="danger"
                    disabled={deleteConfirmText !== "DELETE"}
                    loading={deleting}
                    onClick={deleteAccount}
                  >
                    Confirm Permanent Delete
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={deleting}
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setDeleteConfirmText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---- Avatar -----------------------------------------------------------------------
function AvatarTab({ profile }: { profile: ProfileShape }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState(profile.avatarUrl ?? "");
  const [busy, setBusy] = useState(false);

  async function upload(file: globalThis.File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string; provider?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      toast.success(`Avatar upload ho gaya (storage: ${data.provider})`);
      window.location.reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveUrl() {
    setBusy(true);
    try {
      await api("/api/profile", { method: "PATCH", body: JSON.stringify({ avatarUrl: url }) });
      toast.success("Avatar save ho gaya");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-5">
        <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-violet-400/50 bg-white/5">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-violet-300">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold">Profile avatar</h2>
          <p className="text-sm text-zinc-500">JPG/PNG/WebP/GIF · max 2 MB</p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <div className="flex flex-wrap gap-2.5">
        <Button onClick={() => fileRef.current?.click()} loading={busy}>
          <Upload className="h-4 w-4" /> Upload image
        </Button>
        <Button variant="ghost" onClick={() => setUrlMode(!urlMode)}>
          {urlMode ? "Hide URL mode" : "Use image URL instead"}
        </Button>
      </div>
      {urlMode ? (
        <div className="flex gap-2.5">
          <Input placeholder="https://.../avatar.png" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button variant="secondary" onClick={saveUrl} loading={busy}>
            Save
          </Button>
        </div>
      ) : null}
      <p className="text-xs text-zinc-600">
        Storage provider: <code className="rounded bg-white/5 px-1.5 py-0.5">STORAGE_PROVIDER</code> env se decide
        hota hai (local / B2 / R2 / S3 / MinIO / Vercel Blob)
      </p>
    </Card>
  );
}

// ---- Data (export / import) ---------------------------------------------------------
function DataTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function importJson(file: globalThis.File) {
    setBusy(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as unknown;
      const data = await api<{ linksImported: number }>("/api/profile/import", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success(`${data.linksImported} links import ho gaye`);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error(`Import failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-6">
      <h2 className="font-display text-lg font-semibold">Export / Import</h2>
      <p className="text-sm leading-relaxed text-zinc-500">
        Aapka data aapka hai — profile aur saare links JSON me download karein ya
        restore karein. Kisi bhi LinkForge instance (ya LinkTree migration) ke
        liye portable format.
      </p>
      <div className="flex flex-wrap gap-2.5">
        <a href="/api/profile/export" download>
          <Button variant="secondary">
            <Download className="h-4 w-4" /> Export JSON
          </Button>
        </a>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importJson(f);
          }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} loading={busy}>
          <Upload className="h-4 w-4" /> Import JSON
        </Button>
      </div>
      <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-200">
        Import karne par existing links replace ho jate hain — pehle export karke
        backup le lena recommended hai.
      </p>
    </Card>
  );
}

// ---- Webhooks ------------------------------------------------------------------------
function WebhooksTab({ initialHooks }: { initialHooks: WebhookRow[] }) {
  const [hooks, setHooks] = useState(initialHooks);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState("click");
  const [busy, setBusy] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    try {
      const data = await api<{ webhook: { id: string; url: string; secret: string; events: string; isActive: boolean } }>(
        "/api/webhooks",
        { method: "POST", body: JSON.stringify({ url, events: [events] }) },
      );
      setHooks((prev) => [
        {
          id: data.webhook.id,
          url: data.webhook.url,
          events: [events],
          isActive: true,
          secretPreview: `${data.webhook.secret.slice(0, 6)}…`,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewSecret(data.webhook.secret);
      setUrl("");
      toast.success("Webhook add ho gaya");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    setHooks((prev) => prev.map((h) => (h.id === id ? { ...h, isActive } : h)));
    try {
      await api(`/api/webhooks/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function remove(id: string) {
    setHooks((prev) => prev.filter((h) => h.id !== id));
    try {
      await api(`/api/webhooks/${id}`, { method: "DELETE" });
      toast.success("Webhook delete ho gaya");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function test(id: string) {
    try {
      await api("/api/webhooks/test", { method: "POST", body: JSON.stringify({ id }) });
      toast.success("Test event bhej diya — receiver logs check karein");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Add webhook</h2>
        <p className="text-sm text-zinc-500">
          Link click ya page view hone par signed POST request aapke endpoint par jayega.
          Signature header: <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">X-LinkForge-Signature</code> (HMAC-SHA256).
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Input placeholder="https://api.example.com/hooks/linkforge" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Select value={events} onChange={(e) => setEvents(e.target.value)} className="sm:w-44">
            <option value="click">On click</option>
            <option value="view">On view</option>
          </Select>
          <Button onClick={add} loading={busy} disabled={!url.trim()} className="sm:w-32">
            <Plug className="h-4 w-4" /> Add
          </Button>
        </div>
        {newSecret ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Signing secret — sirf ab dikhega, copy kar lein
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-emerald-100">
                {newSecret}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(newSecret);
                  toast.success("Secret copy ho gaya");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="space-y-2.5">
        {hooks.map((hook) => (
          <Card key={hook.id} className="flex flex-wrap items-center gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{hook.url}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {hook.events.map((e) => (
                  <Badge key={e} tone="violet">{e}</Badge>
                ))}
                <span className="font-mono text-[10px] text-zinc-600">secret: {hook.secretPreview}</span>
              </div>
            </div>
            <Switch checked={hook.isActive} onCheckedChange={(v) => toggle(hook.id, v)} aria-label="toggle webhook" />
            <Button variant="outline" size="sm" onClick={() => test(hook.id)}>
              Test
            </Button>
            <Button variant="danger" size="icon" onClick={() => remove(hook.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
        {hooks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-600">
            Koi webhook nahi — pehla webhook upar add karein
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ---- API keys ---------------------------------------------------------------------------
function ApiKeysTab({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    try {
      const data = await api<{ key: ApiKeyRow; rawKey: string }>("/api/keys", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setKeys((prev) => [{ ...data.key, lastUsedAt: null, revoked: false }, ...prev]);
      setNewKey(data.rawKey);
      setName("");
      toast.success("API key ban gayi");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked: true } : k)));
    try {
      await api(`/api/keys/${id}`, { method: "DELETE" });
      toast.success("Key revoke ho gayi");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Create API key</h2>
        <p className="text-sm text-zinc-500">
          Third-party apps ke liye REST API: <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">GET /api/v1/profile</code>,{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">GET/POST /api/v1/links</code> —{" "}
          header: <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">Authorization: Bearer lfk_...</code>
        </p>
        <div className="flex gap-2.5">
          <Input placeholder="Key name (e.g. mobile app)" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={create} loading={busy} disabled={!name.trim()} className="shrink-0">
            <KeyRound className="h-4 w-4" /> Create
          </Button>
        </div>
        {newKey ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              API key — sirf ab dikhegi, turant copy karein
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-emerald-100">
                {newKey}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(newKey);
                  toast.success("Key copy ho gayi");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="space-y-2.5">
        {keys.map((key) => (
          <Card key={key.id} className="flex flex-wrap items-center gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{key.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <code className="font-mono text-[11px] text-zinc-500">{key.prefix}…</code>
                {key.revoked ? <Badge tone="amber">revoked</Badge> : <Badge tone="green">active</Badge>}
                <span className="text-[10px] text-zinc-600">
                  {key.lastUsedAt ? `last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : "never used"}
                </span>
              </div>
            </div>
            {!key.revoked ? (
              <Button variant="danger" size="sm" onClick={() => revoke(key.id)}>
                Revoke
              </Button>
            ) : null}
          </Card>
        ))}
        {keys.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-600">
            Koi API key nahi — pehli key banayein
          </p>
        ) : null}
      </div>
      <p className="flex items-center gap-2 text-xs text-zinc-600">
        <Loader2 className="h-3 w-3" /> Keys SHA-256 hashed store hoti hain — raw key kabhi recover nahi ho sakti.
      </p>
    </div>
  );
}
