import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const supabase = createServerClient();
  try {
    const { data: approvals, error } = await supabase
      .from('approval_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch approvals:', error)
      return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
    }

    return NextResponse.json(approvals || [])
  } catch (err: any) {
    console.error('Approval API GET Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  try {
    const { id, action, managerEmail } = await req.json()

    if (!id || (action !== 'approved' && action !== 'declined')) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }

    // 1. Update the approval queue row
    const { data: queueRow, error: updateError } = await supabase
      .from('approval_queue')
      .update({
        status: action,
        decided_by: managerEmail || 'Unknown Manager',
        decided_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('session_id, role_id, tenant_id')
      .single()

    if (updateError || !queueRow) {
      console.error('Failed to update approval queue:', updateError)
      return NextResponse.json({ error: 'Failed to update approval queue' }, { status: 500 })
    }

    // 2. If approved, wake the agent up.
    // In production, this would fire a webhook to trigger the MantisOrchestrator to resume.
    // We update the working_memory to indicate it is 'active' again.
    if (action === 'approved') {
      const { error: activeError } = await supabase
        .from('working_memory')
        .update({ status: 'active' })
        .eq('session_id', queueRow.session_id)

      if (activeError) {
        console.error('Failed to wake working memory:', activeError)
      } else {
        // TRIGGER WAKEUP: In a full distributed environment, hit azmeth-adapter here
        // e.g. await fetch('https://core.azmeth.app/webhook/resume', { body: JSON.stringify(queueRow) })
        console.log(`[Webhook Fire] Resuming session ${queueRow.session_id} for role ${queueRow.role_id}`)
      }
    } else {
      // If declined, mark working memory as failed
      await supabase
        .from('working_memory')
        .update({ status: 'failed', current_step: 'Human declined the execution' })
        .eq('session_id', queueRow.session_id)
    }

    return NextResponse.json({ success: true, status: action })

  } catch (err: any) {
    console.error('Approval API Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
