import { NextRequest, NextResponse } from "next/server";
import { selectMetaReviewPage } from "@/lib/meta-review";

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

    const { pageId } = (await request.json()) as { pageId?: string };
    if (!pageId) {
      return NextResponse.json({ error: "A pageId is required." }, { status: 400 });
    }

    const overview = await selectMetaReviewPage(userId, pageId);
    return NextResponse.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to select Facebook Page.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
