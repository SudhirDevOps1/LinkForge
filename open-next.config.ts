// =============================================================================
// ☁️ OpenNext Cloudflare config — `opennextjs-cloudflare build` ke liye required
// Defaults: R2 incremental cache (auto), direct revalidation queue.
// App mostly dynamic routes (force-dynamic) + static landing use karta hai,
// isliye default cache behavior safe hai.
// =============================================================================
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
