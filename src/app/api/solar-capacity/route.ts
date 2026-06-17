import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transformerName = searchParams.get("transformer");

  // TODO: Integrate real solar capacity data from KSEB
  return NextResponse.json({
    success: true,
    transformer: transformerName,
    availableSolarCapacity: 12.5,
  });
}
