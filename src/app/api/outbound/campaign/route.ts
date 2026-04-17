/**
 * POST /api/outbound/campaign
 * Creates a new Outbound Campaign and automatically kicks off the scraper job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOutboundClient } from '@/lib/outbound';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = createOutboundClient();
    const config = body.config || {};
    const csvContent = config.csv_content;
    const isCsvSource = config.scrape_source === 'csv';
    
    // Dynamically derive the base URL from the incoming request (fixes Render deployment failures)
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    
    // Clean massive string out of config
    if (config.csv_content) delete config.csv_content;

    // 1. Insert campaign
    const campaignId = crypto.randomUUID();
    const { data: campaign, error: campErr } = await db
      .from('outbound_campaigns')
      .insert({
        id: campaignId,
        name: body.name || `Campaign - ${new Date().toLocaleDateString()}`,
        status: isCsvSource ? 'running' : 'draft',
        config,
        icp: body.icp || {},
      })
      .select()
      .single();

    if (campErr) throw campErr;

    // 2. Handle Data Source
    if (isCsvSource && csvContent) {
      // Parse CSV
      const lines = csvContent.split(/\r?\n/).filter((x: string) => x.trim().length > 0);
      if (lines.length > 1) {
        const headers = lines[0].split(',').map((s: string) => s.toLowerCase().replace(/[^a-z0-9_]/ig, ''));
        const leadsToInsert = lines.slice(1).map((line: string) => {
          const vals = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
          const item: Record<string, string | null> = {};
          headers.forEach((h: string, idx: number) => { item[h] = vals[idx] || null; });

          return {
            campaign_id: campaignId,
            first_name: item.firstname || item.first_name || item.name?.split(' ')[0] || null,
            last_name: item.lastname || item.last_name || item.name?.split(' ').slice(1).join(' ') || null,
            email: item.email || item.emailaddress || null,
            company: item.company || item.organization || item.company_name || null,
            title: item.title || item.jobtitle || item.position || null,
            linkedin_url: item.linkedin || item.linkedin_url || item.profile || null,
            website: item.website || item.domain || null,
            source: 'csv',
            raw_data: item,
            stage: 'scraped',
            qualification_status: 'pending'
          };
        });

        // Insert mapping to outbound_leads
        const chunkSize = 100;
        for (let i = 0; i < leadsToInsert.length; i += chunkSize) {
           const { error: batchErr } = await db.from('outbound_leads').insert(leadsToInsert.slice(i, i + chunkSize));
           if (batchErr) throw batchErr;
        }

        // Await the fetch so that Next.js does not severe the edge connection before the internal API fires.
        await fetch(`${baseUrl}/api/outbound/campaign/${campaignId}/run`, { method: 'POST' }).catch(() => {});
      }
    } else {
      // Trigger Apify scraper
      const scrapePayload = {
        campaign_id: campaignId,
        source: config.scrape_source || 'crunchbase',
        crunchbase_urls: config.crunchbase_urls || [],
        max_items: config.crunchbase_max_items || 100,
      };

      const scraperRes = await fetch(`${baseUrl}/api/outbound/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapePayload)
      });

      if (!scraperRes.ok) {
        console.warn('Scraper failed to start:', await scraperRes.text());
      }
    }

    return NextResponse.json({ ok: true, campaign_id: campaignId });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
