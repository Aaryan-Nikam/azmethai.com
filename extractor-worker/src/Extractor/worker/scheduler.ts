/**
 * Daily Deadline Scanner
 * 
 * BullMQ Worker that scans the ae_obligations table daily.
 * Identifies obligations that have hit specific notice deadline thresholds:
 * 90 days, 60 days, 30 days, 7 days.
 * 
 * Crucially, relies on the `days_to_notice_deadline` logic, NOT the `due_date`,
 * so we notify based on when action must be taken.
 */

import { Worker, Job } from 'bullmq';
import { redisConnection, schedulerQueue, notificationQueue } from './queue.ts';
import { supabase } from '../lib/supabase.ts';

export const schedulerWorker = new Worker(
  'daily-deadline-scanner',
  async (job: Job) => {
    console.log('[Scheduler] Running daily deadline scanner...');

    // In PostgreSQL, days_to_notice_deadline is computed. 
    // Wait, generated days_to_notice_deadline was dropped because CURRENT_DATE is not immutable.
    // Instead, we compute the difference dynamically in the query.

    const { data: obligations, error } = await supabase
      .from('ae_obligations')
      .select('id, org_id, counterparty_name, notice_deadline, document_id, ae_documents(original_filename)')
      .eq('status', 'active')
      .not('notice_deadline', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch obligations for scanner: ${error.message}`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let enqueued = 0;

    for (const obs of obligations) {
      if (!obs.notice_deadline) continue;

      const deadline = new Date(obs.notice_deadline);
      deadline.setHours(0, 0, 0, 0);

      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let deadlineType: '90_day' | '60_day' | '30_day' | '7_day' | null = null;
      if (diffDays === 90) deadlineType = '90_day';
      else if (diffDays === 60) deadlineType = '60_day';
      else if (diffDays === 30) deadlineType = '30_day';
      else if (diffDays === 7) deadlineType = '7_day';

      if (deadlineType) {
        // Fetch org members (admins and reviewers) to send emails to
        const { data: members } = await supabase
          .from('ae_org_members')
          .select('user_id, role, auth.users!inner(email)')
          .eq('org_id', obs.org_id)
          .in('role', ['admin', 'reviewer']);

        // Since auth.users is not directly accessible usually via RPC or standard selects if secure,
        // Assuming we resolve emails through our users or members table in production, but for now we format the payload.
        // For the POC, we'll route to a dummy email or extract it if accessible.
        
        await notificationQueue.add('send-notice', {
          obligationId: obs.id,
          orgId: obs.org_id,
          contractName: (obs.ae_documents as any)?.original_filename || 'Vendor Contract',
          counterpartyName: obs.counterparty_name || 'Vendor',
          deadlineType,
          noticeDeadline: obs.notice_deadline,
          emailTo: ['compliance@yourdomain.com'] // Stub: in true production, map to org emails
        });

        enqueued++;
      }
    }

    console.log(`[Scheduler] Scanner finished. Enqueued ${enqueued} deadline notifications.`);
    return { success: true, processed: obligations.length, enqueued };
  },
  { connection: redisConnection }
);

// Helper to start the repeatable daily job
export async function startDailyScanner() {
  await schedulerQueue.add(
    'daily-scan',
    {},
    {
      repeat: {
        pattern: '0 7 * * *', // Every day at 07:00 AM
      },
      jobId: 'daily-deadline-scanner-job'
    }
  );
  console.log('[Scheduler] Registered daily timeline queue at 07:00');
}
