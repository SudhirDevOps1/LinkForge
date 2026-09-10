import { describe, expect, it } from "vitest";
import { calculateDuckDbMetrics } from "@/lib/analytics/duckdb";
import { LocalStorageAdapter } from "@/lib/storage/local-adapter";
import type { AnalyticsEvent } from "@/db/schema";

describe("DuckDB Analytical Engine & SQL Generator", () => {
  it("generates structured analytical results with default empty or mock data", () => {
    const mockEvents: AnalyticsEvent[] = [
      {
        id: 1,
        profileId: "00000000-0000-0000-0000-000000000001",
        linkId: "link-1",
        type: "view",
        referrer: "google.com",
        country: "IN",
        device: "Mobile",
        browser: "Chrome",
        os: "Android",
        ipHash: "hash-ip-1",
        createdAt: new Date(),
      },
      {
        id: 2,
        profileId: "00000000-0000-0000-0000-000000000001",
        linkId: "link-1",
        type: "click",
        referrer: "google.com",
        country: "IN",
        device: "Mobile",
        browser: "Chrome",
        os: "Android",
        ipHash: "hash-ip-1",
        createdAt: new Date(),
      },
    ];

    const result = calculateDuckDbMetrics(mockEvents, [{ id: "link-1", title: "My GitHub", url: "https://github.com" }], 30);

    expect(result).toBeDefined();
    expect(result.summary.days).toBe(30);
    expect(result.summary.views).toBe(1);
    expect(result.summary.clicks).toBe(1);
    expect(result.summary.overallCtr).toBe(100);
    expect(result.heatmap.length).toBe(7 * 24); // 168 hourly cells in a week
    expect(result.funnel.length).toBe(2);
    expect(result.retention).toBeDefined();
    expect(result.retention.totalVisitors).toBe(1);
    expect(result.duckDbQueries.hourlyAggQuery).toContain("read_csv_auto");
    expect(result.duckDbQueries.geoDeviceQuery).toContain("read_csv_auto");
    expect(result.duckDbQueries.retentionCohortQuery).toContain("read_csv_auto");
  });

  it("LocalStorageAdapter supports GZIP contentEncoding metadata", async () => {
    const adapter = new LocalStorageAdapter();
    const testKey = `tests/analytics-${Date.now()}.csv.gz`;
    const dummyGzip = Buffer.from("mock-gzip-binary-payload");

    await adapter.putObject(testKey, dummyGzip, "application/gzip", { contentEncoding: "gzip" });

    const fetched = await adapter.getObject(testKey);
    expect(fetched).not.toBeNull();
    expect(fetched?.contentEncoding).toBe("gzip");
    expect(fetched?.contentType).toBe("application/octet-stream");

    await adapter.deleteObject(testKey);
  });
});
