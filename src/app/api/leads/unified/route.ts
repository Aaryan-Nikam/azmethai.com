/**
 * GET /api/leads/unified
 * Queries the unified_leads VIEW which combines chat_leads (inbound) + outbound_leads.
 * 
 * Query params:
 *   source       - 'inbound' | 'outbound' | 'all' (default: all)
 *   stage        - Lead stage/status filter
 *   channel      - Channel filter
 *   score_min    - Minimum lead score
 *   search       - Full-text search across first_name, company, email
 *   date_from    - ISO date string for created_at cutoff
 *   limit        - Page size (default 50, max 200)
 *   offset       - Pagination offset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const source   = searchParams.get('source')    || 'all';
    const stage    = searchParams.get('stage')      || null;
    const channel  = searchParams.get('channel')    || null;
    const scoreMin = searchParams.get('score_min')  ? Number(searchParams.get('score_min')) : null;
    const search   = searchParams.get('search')     || null;
    const dateFrom = searchParams.get('date_from')  || null;
    const limit    = Math.min(Number(searchParams.get('limit')  || 50), 200);
    const offset   = Number(searchParams.get('offset') || 0);

    const db = createServerClient();
    let query = db
      .from('unified_leads')
      .select('*', { count: 'exact' });

    // ── Filters ──────────────────────────────────────────────────────────────
    if (source !== 'all') {
      query = query.eq('source', source);
    }
    if (stage) {
      query = query.eq('stage', stage);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }
    if (scoreMin !== null) {
      query = query.gte('score', scoreMin);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (search) {
      // Search across name, company, email
      query = query.or(
        `first_name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // ── Pagination & Sort ─────────────────────────────────────────────────────
    query = query
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // ── Summary aggregations ──────────────────────────────────────────────────
    const leads = data || [];
    const summary = {
      total: count || 0,
      inbound: leads.filter(l => l.source === 'inbound').length,
      outbound: leads.filter(l => l.source === 'outbound').length,
      by_stage: leads.reduce((acc: Record<string, number>, l) => {
        acc[l.stage] = (acc[l.stage] || 0) + 1;
        return acc;
      }, {}),
      avg_score: leads.length > 0
        ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length)
        : 0,
    };

    return NextResponse.json({
      leads,
      summary,
      pagination: {
        limit,
        offset,
        total: count || 0,
        has_more: offset + limit < (count || 0),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : ((err as any)?.message ?? JSON.stringify(err));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
