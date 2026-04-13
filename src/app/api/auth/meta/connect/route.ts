import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID!;

const SCOPES: Record<string, string[]> = {
  facebook: [
    "pages_manage_metadata",
    "pages_read_engagement",
    "pages_messaging",
    "pages_show_list",
  ],
  instagram: [
    "instagram_basic",
    "instagram_manage_messages",
    "pages_show_list",
    "pages_read_engagement",
  ],
};

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get("platform") as "facebook" | "instagram" | null;
  const userId = request.nextUrl.searchParams.get("userId") || "anon";

  if (!platform || !SCOPES[platform]) {
    return NextResponse.json({ error: "Invalid platform. Use facebook or instagram." }, { status: 400 });
  }

  const redirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI || "https://azmethai.com/api/auth/meta/callback";
  const source = request.nextUrl.searchParams.get("source") || "onboarding";
  const state = `${platform}:${userId}:${source}`;
  const scope = SCOPES[platform].join(",");

  const oauthUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  oauthUrl.searchParams.set("client_id", META_APP_ID);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("scope", scope);
  oauthUrl.searchParams.set("state", state);
  oauthUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(oauthUrl.toString());
}
