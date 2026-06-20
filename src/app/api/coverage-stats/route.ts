import { NextResponse } from "next/server";

import { getCoverageStats } from "@/features/transformer/transformer-cache";

export const dynamic = "force-dynamic";

// Server-side in-memory cache
interface CachedStats {
  districtsIndexed: number;
  sectionsIndexed: number;
  transformersIndexed: number;
}

let cachedStats: CachedStats | null = null;
let lastFetched = 0;
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bypass = url.searchParams.get("bypass") === "true";
  const now = Date.now();

  // Serve from in-memory cache if valid and not bypassed
  if (cachedStats && !bypass && (now - lastFetched < CACHE_TTL)) {
    return NextResponse.json({ ...cachedStats, lastFetched, available: true });
  }

  // Fetch fresh stats from the DB
  const stats = await getCoverageStats();

  if (!stats) {
    // If DB is unavailable, return cached stats as fallback, or defaults
    return NextResponse.json(
      cachedStats
        ? { ...cachedStats, lastFetched, available: true }
        : { districtsIndexed: 14, sectionsIndexed: 774, transformersIndexed: 96790, lastFetched: now, available: false }
    );
  }

  // Update in-memory cache
  cachedStats = stats;
  lastFetched = now;

  return NextResponse.json({
    ...stats,
    lastFetched,
    available: true,
  });
}
