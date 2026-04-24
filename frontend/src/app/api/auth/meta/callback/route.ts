import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state"); // "platform:userId"
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/dashboard?error=oauth_denied", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard?error=missing_params", request.url));
  }

  const [platform, userId, source = "config"] = state.split(":");
  const configuredRedirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  const redirectUri =
    configuredRedirectUri ||
    (appUrl ? `${appUrl}/api/auth/meta/callback` : `${request.nextUrl.origin}/api/auth/meta/callback`);
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.redirect(new URL("/dashboard?error=meta_env_missing", request.url));
  }

  // 1. Exchange code for short-lived token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`
  );
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL("/dashboard?error=token_exchange_failed", request.url));
  }

  // 2. Exchange for long-lived token (60 days)
  const longTokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${tokenData.access_token}`
  );
  const longTokenData = await longTokenRes.json();
  const longLivedToken = longTokenData.access_token || tokenData.access_token;

  // 3. Fetch page/account info
  const meRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedToken}`
  );
  const meData = await meRes.json();
  const page = meData.data?.[0];

  // 4. Upsert to Supabase
  const expires_at = longTokenData.expires_in
    ? new Date(Date.now() + longTokenData.expires_in * 1000).toISOString()
    : null;

  const { error: dbError } = await supabase.from("platform_connections").upsert(
    {
      user_id: userId,
      platform,
      account_name: page?.name || null,
      page_id: page?.id || null,
      access_token: page?.access_token || longLivedToken,
      is_active: true,
      metadata: { expires_at, token_type: platform },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,platform" }
  );

  if (dbError) {
    console.error("DB upsert error:", dbError);
    return NextResponse.redirect(new URL("/dashboard?error=db_save_failed", request.url));
  }

  // 5. Redirect back correctly
  const redirectPath = `/dashboard/agent?connected=${platform}`;
    
  return NextResponse.redirect(
    new URL(redirectPath, request.url)
  );
}
