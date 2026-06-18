import { NextResponse } from "next/server";

import { getCachedAvailabilityByConsumer } from "@/features/transformer/transformer-cache";

export async function POST(request: Request) {
  const body = await request.json();

  const { consumerNumber, mobile, phone, captchaUniqueIdHidden, code } = body;

  if (consumerNumber && !captchaUniqueIdHidden && !code) {
    const cached = await getCachedAvailabilityByConsumer(String(consumerNumber));
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Transformer mapping not found. Verification is required once for this consumer.",
        stage: "cache-miss",
      },
      { status: 404 }
    );
  }

  const verifyResponse = await fetch(new URL("/api/verify", request.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      consumerNumber,
      phone: phone ?? mobile,
      captchaUniqueIdHidden,
      code,
    }),
  });

  return NextResponse.json(await verifyResponse.json(), { status: verifyResponse.status });
}
