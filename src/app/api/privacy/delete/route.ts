import { NextResponse } from "next/server";

import { hashMobile } from "@/features/transformer/transformer-cache";
import { isSupabaseConfigured, supabaseRest } from "@/integrations/supabase/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: "Supabase cache is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const consumerNumber = String(body.consumerNumber ?? "").trim();
    const mobileNumber = String(body.mobileNumber ?? body.mobile ?? body.phone ?? "").trim();

    if (!consumerNumber || !mobileNumber) {
      return NextResponse.json(
        { success: false, error: "Consumer number and mobile number are required." },
        { status: 400 }
      );
    }

    const mobileHash = hashMobile(mobileNumber);

    // Call DELETE on PostgREST matching consumer_no and mobile_hash
    await supabaseRest(
      `consumer_transformers?consumer_no=eq.${encodeURIComponent(
        consumerNumber
      )}&mobile_hash=eq.${encodeURIComponent(mobileHash)}`,
      {
        method: "DELETE",
      }
    );

    return NextResponse.json({
      success: true,
      message: "Your details have been successfully deleted from the capacity cache.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete mapping.";
    console.error("Delete data endpoint error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
