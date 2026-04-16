import { isBefore, differenceInDays, parseISO } from 'date-fns';

export interface CredentialBreachResult {
  breach_type: string;
  severity: 'critical' | 'high' | 'advisory';
  evidence: string;
  notify_targets: ('employee' | 'manager' | 'hr_lead')[];
  credential_id: string;
}

export interface CredentialReconciliationResult {
  credential_id: string;
  employee_id: string;
  status: 'active' | 'expiring_soon' | 'renewal_in_progress' | 'expired' | 'suspended' | 'exempted';
  breaches: CredentialBreachResult[];
}

export function reconcileEmployeeCredential(
  cred: {
    id: string;
    employee_id: string;
    employee_name: string;
    credential_name: string;
    expiry_date: string;
    status: string;
    consequence_of_lapse: string;
    typical_lead_days: number;
  },
  today: Date = new Date()
): CredentialReconciliationResult {
  const breaches: CredentialBreachResult[] = [];
  const expiryDate = parseISO(cred.expiry_date);
  
  if (cred.status === 'exempted' || cred.status === 'suspended') {
    return { credential_id: cred.id, employee_id: cred.employee_id, status: cred.status as any, breaches };
  }

  // Rule 1: Expired and not exempted
  if (isBefore(expiryDate, today) || cred.status === 'expired') {
    breaches.push({
      breach_type: 'credential_expired',
      severity: 'critical',
      evidence: \`\${cred.employee_name}'s \${cred.credential_name} expired on \${cred.expiry_date}. CONSEQUECE: \${cred.consequence_of_lapse}. Immediate suspension of relevant duties required.\`,
      notify_targets: ['employee', 'manager', 'hr_lead'],
      credential_id: cred.id
    });
  } 
  // Rule 3: Renewal in progress but expiry <= 7 days
  else if (cred.status === 'renewal_in_progress' && differenceInDays(expiryDate, today) <= 7) {
    breaches.push({
      breach_type: 'renewal_danger_zone',
      severity: 'high',
      evidence: \`\${cred.employee_name}'s \${cred.credential_name} expires in \${differenceInDays(expiryDate, today)} days. Although renewal is marked in progress, the deadline is critically close. Escalate processing to avoid regulatory lapse.\`,
      notify_targets: ['manager', 'hr_lead'], // explicitly skipping employee to prevent false comfort
      credential_id: cred.id
    });
  }
  // Rule 2: Within typical_lead_days, renewal not confirmed
  else if (cred.status !== 'renewal_in_progress' && differenceInDays(expiryDate, today) <= cred.typical_lead_days) {
    const daysUntilExpiry = differenceInDays(expiryDate, today);
    
    let severity: 'critical' | 'high' | 'advisory' = 'advisory';
    let notify: ('employee' | 'manager' | 'hr_lead')[] = ['employee'];

    if (daysUntilExpiry <= 7) {
      severity = 'critical';
      notify = ['employee', 'manager', 'hr_lead'];
    } else if (daysUntilExpiry <= 30) {
      severity = 'high';
      notify = ['employee'];
    }

    breaches.push({
      breach_type: 'renewal_uncofirmed',
      severity,
      evidence: \`\${cred.employee_name}'s \${cred.credential_name} expires in \${daysUntilExpiry} days. Required lead time is \${cred.typical_lead_days} days. Renewal has not been initiated.\`,
      notify_targets: notify,
      credential_id: cred.id
    });
  }

  // Determine updated status
  let finalStatus: CredentialReconciliationResult['status'] = cred.status as any;
  if (isBefore(expiryDate, today)) {
    finalStatus = 'expired';
  } else if (cred.status !== 'renewal_in_progress' && differenceInDays(expiryDate, today) <= cred.typical_lead_days) {
    finalStatus = 'expiring_soon';
  }

  return {
    credential_id: cred.id,
    employee_id: cred.employee_id,
    status: finalStatus,
    breaches
  };
}
