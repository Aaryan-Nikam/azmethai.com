/**
 * GET /api/health
 * Validates all critical environment variables and tests live Supabase connectivity.
 * Use this to diagnose missing keys or misconfigured services.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function maskKey(key: string | undefined): string {
  if (!key) return '❌ MISSING';
  if (key === 'YOUR_SERVICE_ROLE_KEY_HERE') return '❌ PLACEHOLDER (not set)';
  const first8 = key.slice(0, 8);
  const last4 = key.slice(-4);
  return `✅ ${first8}...${last4} (${key.length} chars)`;
}

function checkKeyRole(key: string | undefined): string {
  if (!key) return 'missing';
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
    return payload.role || 'unknown';
  } catch {
    return key.startsWith('sb_') ? 'publishable' : 'unknown';
  }
}

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  const serviceKeyRole = checkKeyRole(serviceKey);
  const isServiceKeyCorrect = serviceKeyRole === 'service_role';

  // Test live DB connectivity
  let dbStatus = '⏳ untested';
  let dbError: string | null = null;
  let tableChecks: Record<string, string> = {};

  if (serviceKey && serviceKey !== 'YOUR_SERVICE_ROLE_KEY_HERE') {
    try {
      const db = createClient(url, serviceKey, { auth: { persistSession: false } });
      
      // Check critical tables exist and are queryable
      const tables = ['chat_leads', 'outbound_campaigns', 'outbound_leads', 'sales_agents', 'outbound_messages'];
      for (const table of tables) {
        try {
          const { error, count } = await db.from(table).select('*', { count: 'exact', head: true });
          tableChecks[table] = error ? `❌ ${error.message}` : `✅ ${count ?? 0} rows`;
        } catch (e) {
          tableChecks[table] = `❌ ${String(e)}`;
        }
      }
      dbStatus = '✅ connected';
    } catch (e: any) {
      dbStatus = '❌ failed';
      dbError = e.message;
    }
  } else {
    dbStatus = '❌ skipped (service key not set)';
  }

  const report = {
    status: isServiceKeyCorrect && dbStatus.startsWith('✅') ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    supabase: {
      url: url ? `✅ ${url}` : '❌ MISSING',
      service_role_key: maskKey(serviceKey),
      service_role_key_actual_role: serviceKeyRole,
      service_role_key_valid: isServiceKeyCorrect
        ? '✅ has role=service_role'
        : `❌ WRONG — role is "${serviceKeyRole}" (must be "service_role"). Get the correct key from Supabase Dashboard → Project Settings → API → service_role`,
      anon_key: maskKey(anonKey),
      db_connection: dbStatus,
      db_error: dbError,
      tables: tableChecks,
    },
    outbound_engine: {
      app_url: appUrl ? `✅ ${appUrl}` : '❌ MISSING — set NEXT_PUBLIC_APP_URL',
      apify_key: process.env.APIFY_API_KEY ? '✅ set' : '⚠️  not set (required for non-CSV campaigns)',
    },
    ai_models: {
      openai: process.env.OPENAI_API_KEY ? '✅ set' : '❌ MISSING',
      azure_kimi_endpoint: process.env.AZURE_KIMI_ENDPOINT ? '✅ set' : '⚠️  not set',
      azure_kimi_key: process.env.AZURE_KIMI_API_KEY ? '✅ set' : '⚠️  not set',
      azure_openai_endpoint: process.env.AZURE_OPENAI_ENDPOINT ? '✅ set' : '⚠️  not set',
    },
    email: {
      gmail_user: process.env.GMAIL_USER ? `✅ ${process.env.GMAIL_USER}` : '⚠️  not set',
      gmail_app_password: process.env.GMAIL_APP_PASSWORD ? '✅ set' : '⚠️  not set',
    },
  };

  const httpStatus = report.status === 'healthy' ? 200 : 503;
  return NextResponse.json(report, { status: httpStatus });
}
