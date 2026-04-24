import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const type = payload?.type; 
    
    // Generic abstraction to support Resend / SendGrid / Postmark
    // Check if it's a bounce or spam complaint
    const isBounce = type === 'email.bounced' || type === 'bounce';
    const isComplaint = type === 'email.complained' || type === 'spam_report';
    const isDelivered = type === 'email.delivered' || type === 'delivered';

    if (!isBounce && !isComplaint && !isDelivered) {
      // Ignored event
      return NextResponse.json({ received: true });
    }

    // Extract email from typical provider payload structures
    let emailAddress = '';
    if (payload.data?.to?.[0]) {
      emailAddress = payload.data.to[0]; // Resend format
    } else if (payload.email) {
      emailAddress = payload.email; // Sendgrid format
    }

    if (!emailAddress) {
       return NextResponse.json({ error: 'No email address found in payload' }, { status: 400 });
    }

    const supabase = createServerClient();

    if (isBounce || isComplaint) {
      // Mark lead as automatically disqualified due to bounce/spam
      const { error } = await supabase
        .from('outbound_leads')
        .update({ qualification_status: 'rejected', stage: 'bounced' })
        .eq('email', emailAddress);

      if (error) {
        console.error('Failed to update bounced lead:', error);
      }
    }

    return NextResponse.json({ success: true, email: emailAddress, status: isBounce ? 'bounced' : (isComplaint ? 'complaint' : 'delivered') });

  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
