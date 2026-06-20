import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { startRefreshRun } from "@/features/transformer/transformer-sync";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";

  const acceptedSecrets = [env.CRON_SECRET, env.CAPACITY_SYNC_SECRET].filter(Boolean);
  if (acceptedSecrets.some((secret) => authHeader === `Bearer ${secret}`)) return true;

  if (env.NODE_ENV !== "production" && !env.CAPACITY_SYNC_SECRET) return true;

  return false;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: "Supabase cache is not configured." },
      { status: 500 }
    );
  }

  try {
    const url = new URL(request.url);
    const discover = url.searchParams.get("discover") === "true";
    const districtParam = url.searchParams.get("district");
    const districtId = districtParam ? Number(districtParam) : null;
    const runType = discover ? "DISCOVERY" : "REFRESH";
    const triggeredBy = url.searchParams.get("triggeredBy") || "api";

    const result = await startRefreshRun({ discover, districtId, runType, triggeredBy });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Failed to start refresh run:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
