/**
 * middleware.ts — Supabase Auth session gate
 * Protects all /dashboard/** routes.
 * Uses @supabase/supabase-js cookie pattern (no auth-helpers needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createSupabaseServerClient } from '@supabase/supabase-js';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/agent/:path*',
    '/api/leads/:path*',
    '/api/inbox/:path*',
    '/api/outbound/:path*',
    '/api/analytics',
    '/api/command-center',
  ],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Skip auth check if no Supabase keys configured (dev without auth)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return res;

  // Extract session from cookie
  const sessionCookie = req.cookies.get('sb-session')?.value
    || req.cookies.get(`sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`)?.value;

  // If no session and trying to access dashboard → redirect to login
  if (!sessionCookie && req.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}
