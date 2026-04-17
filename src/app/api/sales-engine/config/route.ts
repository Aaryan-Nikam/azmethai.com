/**
 * GET /api/sales-engine/config
 * Returns the full sales agent configuration from Supabase.
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from('sales_agents')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ agent: data || null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : ((err as any)?.message ?? JSON.stringify(err));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
