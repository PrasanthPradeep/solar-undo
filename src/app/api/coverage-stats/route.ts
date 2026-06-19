import { NextResponse } from "next/server";

import { getCoverageStats } from "@/features/transformer/transformer-cache";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  const stats = await getCoverageStats();

  if (!stats) {
    return NextResponse.json({
      districtsIndexed: 0,
      sectionsIndexed: 0,
      transformersIndexed: 0,
      available: false,
    });
  }

  return NextResponse.json({
    ...stats,
    available: true,
  });
}
