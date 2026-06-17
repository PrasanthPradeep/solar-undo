import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCaptchaChallenge } from "@/integrations/kseb/captcha";
import { KSEB_SESSION_COOKIE } from "@/integrations/kseb/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const challenge = await getCaptchaChallenge();
    const response = NextResponse.json({
      success: true,
      data: {
        captchaUniqueIdHidden: challenge.captchaUniqueIdHidden,
        imageBase64: challenge.imageBase64,
        contentType: challenge.contentType,
      },
    });

    response.cookies.set(KSEB_SESSION_COOKIE, challenge.jsessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load KSEB captcha.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(KSEB_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
