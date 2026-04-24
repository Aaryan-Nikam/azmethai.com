import { NextRequest, NextResponse } from "next/server";
import {
  getMetaReviewWhatsAppHistory,
  sendMetaReviewWhatsAppMessage,
} from "@/lib/meta-review";

export const dynamic = "force-dynamic";

function getUserId(request: NextRequest): string | null {
  return request.headers.get("x-user-id") || request.nextUrl.searchParams.get("userId");
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Missing user identifier." }, { status: 400 });
    }

    const phone = request.nextUrl.searchParams.get("phone") || "";
    const payload = await getMetaReviewWhatsAppHistory(userId, phone);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load WhatsApp history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Missing user identifier." }, { status: 400 });
    }

    const body = (await request.json()) as {
      phone?: string;
      message?: string;
    };

    const payload = await sendMetaReviewWhatsAppMessage({
      userId,
      phone: body.phone || "",
      message: body.message || "",
    });
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send WhatsApp message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
