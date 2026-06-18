import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { syncTransformerCapacities } from "@/features/transformer/transformer-sync";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  if (!env.CAPACITY_SYNC_SECRET) return env.NODE_ENV !== "production";
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${env.CAPACITY_SYNC_SECRET}`;
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

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "0");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const section = url.searchParams.get("section");
  const districtParam = url.searchParams.get("district");
  const districtId = districtParam ? Number(districtParam) : null;
  const discover = url.searchParams.get("discover") === "true";
  const result = await syncTransformerCapacities({ limit, offset, section, districtId, discover });

  return NextResponse.json({ ...result, districtId, discover });
}
