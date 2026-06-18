import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { syncTransformerCapacities } from "@/features/transformer/transformer-sync";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  const secret = env.CRON_SECRET || env.CAPACITY_SYNC_SECRET;
  if (!secret) return env.NODE_ENV !== "production";

  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${secret}`;
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
  const result = await syncTransformerCapacities({ limit, section });

  return NextResponse.json(result);
}
