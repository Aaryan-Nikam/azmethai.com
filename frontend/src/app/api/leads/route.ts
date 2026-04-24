import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, ChatLead, LeadStatus } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export type UnifiedLead = {
  lead_id: string; // The ID
  system: 'inbound' | 'outbound';
  channel: string;
  sender_name: string;
  company_name: string;
  role_title: string;
  status: 'new' | 'contacted' | 'qualified' | 'meeting_set' | 'disqualified';
  latest_score: number;
  last_seen: string;
  starred: boolean;
  
  // Extra inbound
  last_intent?: string;
  agent_name?: string;
  
  // Extra outbound
  stage?: string;
  campaign_id?: string;
  source?: string;
};

export async function GET() {
  try {
    const db = createServerClient();
    
    // Fetch Inbound (chat_leads)
    const chatReq = db.from('chat_leads').select('*').order('last_seen', { ascending: false });
    
    // Fetch Outbound (outbound_leads)
    const outReq = db.from('outbound_leads').select('*').order('created_at', { ascending: false });

    // Execute parallel
    const [chatRes, outRes] = await Promise.all([chatReq, outReq]);

    if (chatRes.error) throw chatRes.error;
    if (outRes.error) throw outRes.error;

    // Standardize inbound
    const inbound: UnifiedLead[] = (chatRes.data || []).map((c: any) => ({
      lead_id: c.lead_id,
      system: 'inbound',
      channel: c.channel || 'web',
      sender_name: c.sender_name || 'Anonymous',
      company_name: c.company_name || 'Unknown',
      role_title: c.role_title || 'Visitor',
      status: c.status || 'new',
      latest_score: c.latest_score || 0,
      last_seen: c.last_seen || new Date().toISOString(),
      starred: !!c.starred,
      last_intent: c.last_intent,
      agent_name: c.agent_name
    }));

    // Standardize outbound
    const outbound: UnifiedLead[] = (outRes.data || []).map((o: any) => {
      // Map qualification_status to status
      let status: 'new' | 'contacted' | 'qualified' | 'meeting_set' | 'disqualified' = 'new';
      if (o.qualification_status === 'rejected') status = 'disqualified';
      else if (o.qualification_status === 'qualified') status = 'qualified';
      
      // If messages are sent, we can mark contacted. But we don't have that here easily.
      // Easiest is to infer from 'stage'.
      if (o.stage === 'sent' || o.stage === 'replied') status = 'contacted';

      return {
        lead_id: o.id,
        system: 'outbound',
        channel: 'email', // default, could pull from campaign
        sender_name: `${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email || 'Unknown',
        company_name: o.company || 'Unknown',
        role_title: o.title || 'Target',
        status,
        latest_score: o.qualification_score || 0,
        last_seen: o.created_at,
        starred: false,
        stage: o.stage,
        campaign_id: o.campaign_id,
        source: o.source
      };
    });

    // Merge & Sort by recency
    const allLeads = [...inbound, ...outbound].sort((a, b) => 
      new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
    );

    return NextResponse.json({ leads: allLeads });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = createServerClient();
    const body = await req.json();
    const { lead_id, system, ...updates } = body as { lead_id: string; system?: string; stage?: string } & Partial<ChatLead>;

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id required' }, { status: 400 });
    }

    if (system === 'outbound') {
       // Outbound updates
       const patch: Record<string, unknown> = {};
       if (updates.status === 'qualified') patch.qualification_status = 'qualified';
       if (updates.status === 'disqualified') patch.qualification_status = 'rejected';
       if (updates.starred !== undefined) patch.starred = updates.starred;
       if (typeof updates.stage === 'string' && updates.stage.trim()) patch.stage = updates.stage.trim();
       
       if (Object.keys(patch).length > 0) {
         const { error } = await db.from('outbound_leads').update(patch).eq('id', lead_id);
         if (error) throw error;
       }
       return NextResponse.json({ ok: true });
    }

    // Default to chat_leads
    const allowed: (keyof ChatLead)[] = ['status', 'starred', 'paused', 'agent_name', 'company_name', 'role_title'];
    const patch: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in updates) patch[k] = (updates as Record<string, unknown>)[k];
    }

    const { error } = await db.from('chat_leads').update(patch).eq('lead_id', lead_id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = createServerClient();
    const body = await req.json() as {
      source?: 'inbound' | 'outbound';
      full_name?: string;
      email?: string;
      company_name?: string | null;
      role_title?: string | null;
      channel?: string;
      campaign_id?: string | null;
    };

    const source = body.source || 'inbound';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const [firstName, ...restName] = fullName.split(/\s+/).filter(Boolean);
    const lastName = restName.join(' ') || null;
    const now = new Date().toISOString();

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    if (source === 'outbound') {
      const { data, error } = await db.from('outbound_leads').insert({
        campaign_id: body.campaign_id || null,
        first_name: firstName || null,
        last_name: lastName,
        email,
        company: body.company_name || null,
        title: body.role_title || null,
        source: 'manual',
        raw_data: {
          created_from: 'leads_dashboard_manual',
          channel: body.channel || 'email',
        },
        stage: 'scraped',
        qualification_status: 'pending',
      }).select('id').single();

      if (error) throw error;
      return NextResponse.json({ ok: true, source: 'outbound', lead_id: data?.id });
    }

    const channel = typeof body.channel === 'string' && body.channel.trim()
      ? body.channel.trim().toLowerCase()
      : 'email';

    const leadId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { error } = await db.from('chat_leads').insert({
      lead_id: leadId,
      channel,
      sender_name: fullName || email,
      sender_contact: email,
      latest_score: 0,
      last_intent: null,
      paused: false,
      last_seen: now,
      status: 'new',
      agent_name: 'Azmeth Agent',
      starred: false,
      company_name: body.company_name || null,
      role_title: body.role_title || null,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, source: 'inbound', lead_id: leadId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
