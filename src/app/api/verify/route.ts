import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const { consumerNumber, mobile, captchaToken } = body;

  console.log("Verify:", consumerNumber, mobile, captchaToken);

  // TODO: Integrate real KSEB captcha/OTP verification
  return NextResponse.json({
    success: true,
    verified: true,
  });
}
