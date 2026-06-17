import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const { consumerNumber, mobile, phone, captchaUniqueIdHidden, code } = body;
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
