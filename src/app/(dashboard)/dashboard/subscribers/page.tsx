"use client";

// =============================================================================
// 📬 Dashboard Subscribers — View, Manage & Export Newsletter Subscribers
// =============================================================================
import {
  Check,
  Copy,
  Download,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SubscriberItem {
  id: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadSubscribers() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscribers");
      const data = await res.json();
      if (res.ok) {
        setSubscribers(data.subscribers || []);
      } else {
        toast.error(data.error || "Failed to load subscribers");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscribers();
  }, []);

  async function deleteSubscriber(id: string, email: string) {
    if (!confirm(`Are you sure you want to remove "${email}" from your subscriber list?`)) return;
    try {
      const res = await fetch(`/api/subscribers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        toast.success(`"${email}" deleted`);
      } else {
        toast.error("Failed to delete subscriber");
      }
    } catch {
      toast.error("Network error");
    }
  }

  function copyEmail(email: string, id: string) {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success("Email copied!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Mail className="h-6 w-6 text-violet-400" /> Newsletter Subscribers
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real, MX-verified subscribers gathered directly from your public bio page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSubscribers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <a
            href="/api/subscribers?export=csv"
            download
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Subscribers</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-white tracking-tight">{subscribers.length}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">DNS Verification</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Check className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-emerald-400">100% Real MX Verified</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Disposable emails automatically blocked</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Status</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="mt-3 text-sm font-semibold text-zinc-200">Active on Public Bio</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Auto-captures from your profile footer</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search subscribers by email..."
          className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-400 transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400 text-sm">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            <span>Loading subscribers…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-zinc-500 mb-3">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">
              {searchTerm ? "No matching subscribers found" : "No subscribers yet"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              {searchTerm
                ? "Try modifying your search term."
                : "The newsletter subscription box is active on your public profile footer. When visitors subscribe, they will automatically be verified and listed here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.02] text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Subscriber Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Subscribed Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span>{sub.email}</span>
                        <button
                          type="button"
                          onClick={() => copyEmail(sub.email, sub.id)}
                          className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                          title="Copy Email"
                        >
                          {copiedId === sub.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/25">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Verified
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">
                      {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => deleteSubscriber(sub.id, sub.email)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all cursor-pointer"
                        title="Delete Subscriber"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
