// packages/extractor/src/worker/calendar-engine.ts

import { subDays } from 'date-fns';

export function calculateNoticeDates(obligation: {
  due_date: string;
  notice_period_days: number | null;
  obligation_type: string;
}): {
  notice_date: Date;
  alert_dates: Date[];
} {
  const dueDate = new Date(obligation.due_date);
  const noticePeriodDays = obligation.notice_period_days ?? 14; // Default 14 days if not specified

  // notice_date is when the client must ACT — before this date
  const noticeDate = subDays(dueDate, noticePeriodDays);

  // Alert schedule fires BEFORE the notice_date, not before the due_date
  // Only schedules dates that haven't passed relative to execution state
  const alertDates = [14, 7, 3, 1]
    .map(daysBeforeNotice => subDays(noticeDate, daysBeforeNotice))
    .filter(alertDate => alertDate > new Date()); 

  return { notice_date: noticeDate, alert_dates: alertDates };
}
