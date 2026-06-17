import { NextResponse } from "next/server";

import { fetchResCapacityByOfficeCode, findTransformerMatch } from "@/integrations/kseb/res-capacity";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transformerName = searchParams.get("transformer");
    const officeCode = searchParams.get("officeCode");

    if (!transformerName || !officeCode) {
      return NextResponse.json(
        { success: false, error: "officeCode and transformer are required." },
        { status: 400 }
      );
    }

    const rows = await fetchResCapacityByOfficeCode(officeCode);
    const data = findTransformerMatch(transformerName, rows);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "KSEB RES capacity lookup failed.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
