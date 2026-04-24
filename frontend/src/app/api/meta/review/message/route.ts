import { NextRequest, NextResponse } from "next/server";
import { sendMetaReviewReply } from "@/lib/meta-review";

export const dynamic = "force-dynamic";

function getUserId(request: NextRequest): string | null {
  return request.headers.get("x-user-id") || request.nextUrl.searchParams.get("userId");
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Missing user identifier." }, { status: 400 });
    }

    const body = (await request.json()) as {
      channel?: "facebook" | "instagram";
      recipientId?: string;
      recipientName?: string;
      message?: string;
    };

    if (body.channel !== "facebook" && body.channel !== "instagram") {
      return NextResponse.json({ error: "A valid channel is required." }, { status: 400 });
    }

    const payload = await sendMetaReviewReply({
      userId,
      channel: body.channel,
      recipientId: body.recipientId || "",
      recipientName: body.recipientName || "",
      message: body.message || "",
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
