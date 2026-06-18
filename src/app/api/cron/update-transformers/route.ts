import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { syncTransformerCapacities } from "@/features/transformer/transformer-sync";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const authHeader = request.headers.get("authorization") ?? "";

  if (env.CRON_SECRET) {
    return authHeader === `Bearer ${env.CRON_SECRET}`;
  }

  if (authHeader && env.CAPACITY_SYNC_SECRET) {
    return authHeader === `Bearer ${env.CAPACITY_SYNC_SECRET}`;
  }

  if (userAgent === "vercel-cron/1.0") {
    console.warn("CRON_SECRET is not configured. Allowing Vercel Cron by user-agent fallback.");
    return true;
  }

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
  const section = url.searchParams.get("section");
  const districtParam = url.searchParams.get("district");
  const districtId = districtParam ? Number(districtParam) : null;
  const result = await syncTransformerCapacities({ limit, section, districtId });

  return NextResponse.json({ ...result, source: getInvocationSource(request) });
}
