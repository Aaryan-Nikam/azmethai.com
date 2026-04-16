import { isBefore, differenceInDays, differenceInHours, addDays, parseISO } from 'date-fns';

export interface PaymentBreachResult {
  breach_type: string;
  severity: 'critical' | 'high' | 'advisory';
  evidence: string;
  contract_clause: string | null;
  payment_term_id: string;
}

export interface PaymentReconciliationResult {
  payment_term_id: string;
  status: 'pending' | 'discount_window' | 'due_soon' | 'overdue' | 'in_penalty' | 'paid' | 'disputed';
  breaches: PaymentBreachResult[];
}

export function reconcilePaymentTerms(
  pt: {
    id: string;
    invoice_id: string;
    vendor_name: string;
    status: string;
    due_date: string;
    early_payment_discount_expiry: string | null;
    early_payment_discount_amount: number | null;
    late_penalty_type: string | null;
    late_penalty_rate: number | null;
    invoice_amount: number;
  },
  today: Date = new Date()
): PaymentReconciliationResult {
  const breaches: PaymentBreachResult[] = [];
  const dueDate = parseISO(pt.due_date);
  
  // Early exit if settled or disputed
  if (pt.status === 'paid' || pt.status === 'disputed') {
    return { payment_term_id: pt.id, status: pt.status as any, breaches };
  }

  // Rule 1: Discount expiring within 48h
  if (pt.early_payment_discount_expiry && pt.early_payment_discount_amount) {
    const expiry = parseISO(pt.early_payment_discount_expiry);
    const hoursLeft = differenceInHours(expiry, today);
    
    if (hoursLeft >= 0 && hoursLeft <= 48) {
      breaches.push({
        breach_type: 'discount_expiring_48h',
        severity: 'high',
        evidence: \`A £\${pt.early_payment_discount_amount.toLocaleString()} early payment discount for \${pt.vendor_name} expires in \${hoursLeft} hours (\${pt.early_payment_discount_expiry}). Process immediately to capture savings.\`,
        contract_clause: 'Early Payment Discount',
        payment_term_id: pt.id
      });
    }
  }

  // Rule 2 & 3: Overdue scenarios
  if (isBefore(dueDate, today)) {
    const daysOverdue = differenceInDays(today, dueDate);
    
    // Rule 3: Penalty Accruing
    if (pt.late_penalty_type && pt.late_penalty_type !== 'none' && pt.late_penalty_rate) {
      let dailyPenalty = 0;
      if (pt.late_penalty_type === 'pct_per_day') {
        dailyPenalty = pt.invoice_amount * (pt.late_penalty_rate / 100);
      } else if (pt.late_penalty_type === 'pct_per_month') {
        dailyPenalty = pt.invoice_amount * (pt.late_penalty_rate / 100) / 30; // Approx daily
      } else if (pt.late_penalty_type === 'fixed_per_day') {
        dailyPenalty = pt.late_penalty_rate;
      }

      const accumulatedTotal = dailyPenalty * daysOverdue;
      const penaltySeverity = daysOverdue > 14 ? 'critical' : 'high';

      breaches.push({
        breach_type: 'penalty_accruing',
        severity: penaltySeverity,
        evidence: \`\${pt.vendor_name} invoice is \${daysOverdue} days overdue. Direct algorithmic penalties are accruing at roughly £\${dailyPenalty.toFixed(2)}/day based on \${pt.late_penalty_type}. Total estimated penalty: £\${accumulatedTotal.toFixed(2)}.\`,
        contract_clause: 'Late Payment Penalty',
        payment_term_id: pt.id
      });
    } else {
      // Rule 2: Overdue without Contractual Penalty
      breaches.push({
        breach_type: 'overdue_no_penalty',
        severity: 'advisory',
        evidence: \`\${pt.vendor_name} invoice is \${daysOverdue} days overdue. While no contractual late penalties apply, this presents an emerging relationship risk.\`,
        contract_clause: null,
        payment_term_id: pt.id
      });
    }
  } else {
    // Not overdue yet - Rule 4: Due within 7 days
    const daysUntilDue = differenceInDays(dueDate, today);
    if (daysUntilDue >= 0 && daysUntilDue <= 7) {
      const severity = daysUntilDue <= 2 ? 'high' : 'advisory';
      breaches.push({
        breach_type: 'due_within_7_days',
        severity,
        evidence: \`\${pt.vendor_name} invoice is due in \${daysUntilDue} days (\${pt.due_date}). Ensure payment execution pipelines are primed to avoid relationship strain or penalties.\`,
        contract_clause: null,
        payment_term_id: pt.id
      });
    }
  }

  let finalStatus: PaymentReconciliationResult['status'] = pt.status as any;
  if (finalStatus !== 'paid' && finalStatus !== 'disputed') {
    if (isBefore(dueDate, today)) {
       finalStatus = (pt.late_penalty_type && pt.late_penalty_type !== 'none') ? 'in_penalty' : 'overdue';
    } else if (pt.early_payment_discount_expiry && !isBefore(parseISO(pt.early_payment_discount_expiry), today)) {
       finalStatus = 'discount_window';
    } else if (differenceInDays(dueDate, today) <= 7) {
       finalStatus = 'due_soon';
    } else {
       finalStatus = 'pending';
    }
  }

  return {
    payment_term_id: pt.id,
    status: finalStatus,
    breaches
  };
}
