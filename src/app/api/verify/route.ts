import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  enrichWithHistory,
  findTransformer,
  getCachedAvailabilityByConsumer,
  logSearch,
  saveConsumerMapping,
} from "@/features/transformer/transformer-cache";
import { getSolarAvailability, SolarAvailabilityStageError } from "@/integrations/kseb/solar-availability";
import { KSEB_SESSION_COOKIE } from "@/integrations/kseb/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const consumerNumber = String(body.consumerNumber ?? "");
    const phone = String(body.phone ?? body.mobile ?? "");
    const captchaUniqueIdHidden = String(body.captchaUniqueIdHidden ?? body.captchaId ?? "");
    const code = String(body.code ?? body.captchaCode ?? body.captcha ?? "");
    const jsessionId = cookieStore.get(KSEB_SESSION_COOKIE)?.value;

    if (!consumerNumber || !phone || !captchaUniqueIdHidden || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "consumerNumber, phone, captchaUniqueIdHidden, and code are required.",
        },
        { status: 400 }
      );
    }

    const cached = await getCachedAvailabilityByConsumer(consumerNumber);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    if (!jsessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "KSEB captcha session is missing or expired. Refresh the captcha and try again.",
        },
        { status: 400 }
      );
    }

    const data = await getSolarAvailability({
      consumerNumber,
      phone,
      captchaUniqueIdHidden,
      code,
      jsessionId,
    });
    await saveConsumerMapping(data, phone);
    const enriched = await enrichWithHistory(data);
    const transformer = await findTransformer(data.officeCode, data.transformerName);
    await logSearch(consumerNumber, transformer?.id);

    // Pass through all fields including new: feederName, dtrCapacity, status
    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "KSEB verification failed.";
    const stage = error instanceof SolarAvailabilityStageError ? error.stage : "unknown";
    return NextResponse.json({ success: false, error: message, stage }, { status: 502 });
  }
}
