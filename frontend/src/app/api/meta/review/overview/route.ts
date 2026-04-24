import { NextRequest, NextResponse } from "next/server";
import { getMetaReviewOverview } from "@/lib/meta-review";

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

    const overview = await getMetaReviewOverview(userId);
    return NextResponse.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Meta review overview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
