import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { completeRefreshRun } from "@/features/transformer/transformer-sync";
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
    const runId = url.searchParams.get("runId");
    const status = url.searchParams.get("status") ?? "COMPLETED";
    const failureReason = url.searchParams.get("failureReason");

    if (!runId) {
      return NextResponse.json({ success: false, error: "Missing runId parameter" }, { status: 400 });
    }

    await completeRefreshRun(runId, status, failureReason);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to complete refresh run:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
