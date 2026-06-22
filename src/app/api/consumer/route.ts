import { NextResponse } from "next/server";

import { getCachedAvailabilityByConsumer, hashMobile } from "@/features/transformer/transformer-cache";

export async function POST(request: Request) {
  const body = await request.json();

  const { consumerNumber, mobile, phone, captchaUniqueIdHidden, code } = body;

  if (consumerNumber && !captchaUniqueIdHidden && !code) {
    const enteredMobile = String(mobile ?? phone ?? "").trim();
    if (!enteredMobile) {
      return NextResponse.json(
        {
          success: false,
          error: "Mobile number is required to check cached records.",
          stage: "cache-miss",
        },
        { status: 400 }
      );
    }

    const mobileHash = hashMobile(enteredMobile);
    const cached = await getCachedAvailabilityByConsumer(String(consumerNumber), mobileHash);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Transformer mapping not found or mobile number mismatch. Verification is required.",
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
