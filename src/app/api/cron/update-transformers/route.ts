import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { syncTransformerCapacities } from "@/features/transformer/transformer-sync";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const authHeader = request.headers.get("authorization") ?? "";

  if (userAgent === "vercel-cron/1.0") {
    return true;
  }

  const acceptedSecrets = [env.CRON_SECRET, env.CAPACITY_SYNC_SECRET].filter(Boolean);
  if (acceptedSecrets.some((secret) => authHeader === `Bearer ${secret}`)) return true;

  if (env.NODE_ENV !== "production" && !env.CAPACITY_SYNC_SECRET) return true;

  return false;
}

function getInvocationSource(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (userAgent === "vercel-cron/1.0") return "vercel-cron";
  return "manual";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: "Supabase cache is not configured." },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "0");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const section = url.searchParams.get("section");
  const districtParam = url.searchParams.get("district");
  const districtId = districtParam ? Number(districtParam) : null;
  const discover = url.searchParams.get("discover") === "true";
  const concurrency = url.searchParams.get("concurrency")
    ? Number(url.searchParams.get("concurrency"))
    : undefined;

  const result = await syncTransformerCapacities({
    limit,
    offset,
    section,
    districtId,
    discover,
    concurrency,
  });

  return NextResponse.json({
    ...result,
    source: getInvocationSource(request),
    districtId,
    discover,
    mode: discover ? "discovery" : "refresh",
  });
}
