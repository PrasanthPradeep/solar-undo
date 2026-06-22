import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { isSupabaseConfigured, supabaseRest } from "@/integrations/supabase/client";

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

  try {
    const now = new Date().toISOString();
    // Delete expired mappings where expires_at < now
    await supabaseRest(`consumer_transformers?expires_at=lt.${encodeURIComponent(now)}`, {
      method: "DELETE",
    });

    return NextResponse.json({
      success: true,
      message: "Expired consumer mappings cleaned up successfully.",
      timestamp: now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run cleanup.";
    console.error("Cleanup expired cron error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
