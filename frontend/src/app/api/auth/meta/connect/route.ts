import { NextRequest, NextResponse } from "next/server";
import { META_REVIEW_PERMISSIONS } from "@/lib/meta-review";

export const dynamic = 'force-dynamic';

const SCOPES: Record<string, string[]> = {
  meta: [...META_REVIEW_PERMISSIONS],
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
  const platform = request.nextUrl.searchParams.get("platform") as "meta" | "facebook" | "instagram" | null;
  const userId = request.nextUrl.searchParams.get("userId") || "anon";

  if (!platform || !SCOPES[platform]) {
    return NextResponse.json({ error: "Invalid platform. Use meta, facebook or instagram." }, { status: 400 });
  }

  const configuredRedirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  const redirectUri =
    configuredRedirectUri ||
    (appUrl ? `${appUrl}/api/auth/meta/callback` : `${request.nextUrl.origin}/api/auth/meta/callback`);
  const source = request.nextUrl.searchParams.get("source") || "onboarding";
  const state = `${platform}:${userId}:${source}`;
  const scope = SCOPES[platform].join(",");

  const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
  if (!META_APP_ID) {
    return NextResponse.json({ error: "NEXT_PUBLIC_META_APP_ID not configured" }, { status: 500 });
  }

  const oauthUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  oauthUrl.searchParams.set("client_id", META_APP_ID);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("scope", scope);
  oauthUrl.searchParams.set("state", state);
  oauthUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(oauthUrl.toString());
}
