import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const { consumerNumber, mobile } = body;

  console.log(consumerNumber);
  console.log(mobile);

  return NextResponse.json({
    success: true,
    consumer: {
      consumerNumber,
      consumerName: "User solar Undo",
      section: "Pallimukku",
      tariff: "LT-1",
      transformer: "PUTHEN NADA",
      availableSolarCapacity: 12.5,
    },
  });
}