import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { upsertHistory, upsertTransformer } from "@/features/transformer/transformer-cache";
import { fetchResCapacityByOfficeCode } from "@/integrations/kseb/res-capacity";
import { getOfficeList } from "@/integrations/kseb/office-map";
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
  const section = url.searchParams.get("section");
  const offices = section
    ? (await getOfficeList()).filter((office) => office.officeCode === section)
    : await getOfficeList();
  const selectedOffices = limit > 0 ? offices.slice(0, limit) : offices;

  let transformers = 0;
  const failures: Array<{ sectionCode: string; sectionName: string; error: string }> = [];

  for (const office of selectedOffices) {
    try {
      const rows = await fetchResCapacityByOfficeCode(office.officeCode);
      for (const row of rows) {
        const saved = await upsertTransformer(row, office.officeCode, office.sectionName);
        const transformer = saved[0];
        if (transformer) {
          await upsertHistory(transformer.id, row.balanceAvailable);
          transformers += 1;
        }
      }
    } catch (error) {
      failures.push({
        sectionCode: office.officeCode,
        sectionName: office.sectionName,
        error: error instanceof Error ? error.message : "Unknown sync error",
      });
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    sections: selectedOffices.length,
    transformers,
    failures,
  });
}
