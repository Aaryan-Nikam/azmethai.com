import { NextRequest, NextResponse } from "next/server";
import { getMetaReviewInbox, ReviewChannel } from "@/lib/meta-review";

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

    const channel = request.nextUrl.searchParams.get("channel");
    if (channel !== "facebook" && channel !== "instagram") {
      return NextResponse.json({ error: "A valid channel is required." }, { status: 400 });
    }

    const payload = await getMetaReviewInbox(userId, channel as ReviewChannel);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load inbox.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
