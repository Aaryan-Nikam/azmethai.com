// packages/extractor/src/reconciliation/security-reconciler.ts

import { isBefore, addDays, differenceInDays, parseISO } from 'date-fns';

export interface SecurityBreachResult {
  breach_type: string;
  severity: 'critical' | 'high' | 'advisory';
  evidence: string;
  contract_clause: string | null;
  threshold_value: number | null;
  actual_value: number | null;
  due_date: string; // ISO date
  security_status_id: string;
}

export interface SecurityReconciliationResult {
  vendor_id: string;
  status: 'compliant' | 'breach_found' | 'unverifiable';
  breaches: SecurityBreachResult[];
  warnings: string[];
}

export function reconcileVendorSecurity(
  vendor: { id: string; name: string; category: string; risk_tier: string },
  statuses: Array<{
    id: string;
    status_type: string;
    valid_until: string | null;
    days_until_expiry: number | null;
    numeric_value: number | null;
    compliance_threshold: string | null;
    current_value: string | null;
    is_compliant: boolean | null;
    cert_issuer: string | null;
    cert_reference: string | null;
  }>,
  today: Date = new Date()
): SecurityReconciliationResult {
  const breaches: SecurityBreachResult[] = [];
  const warnings: string[] = [];
  const certTypes = ['soc2_type_i', 'soc2_type_ii', 'iso27001', 'iso9001', 'cyber_insurance', 'pen_test'];

  for (const status of statuses) {
    const expiryDate = status.valid_until ? parseISO(status.valid_until) : null;

    // Rule 1: Certificate expired
    if (certTypes.includes(status.status_type) && expiryDate && isBefore(expiryDate, today)) {
      const isCriticalCert = ['soc2_type_i', 'soc2_type_ii', 'cyber_insurance'].includes(status.status_type);
      breaches.push({
        breach_type: status.status_type === 'cyber_insurance' ? 'insurance_lapsed' : 'cert_expired',
        severity: isCriticalCert ? 'critical' : 'high',
        evidence: \`\${vendor.name} \${status.status_type.replace(/_/g, ' ').toUpperCase()} expired on \${
          status.valid_until
        }. Issued by \${
          status.cert_issuer ?? 'unknown issuer'
        }. Vendor is operating without a valid certification. Immediate remediation request required.\`,
        contract_clause: null,
        threshold_value: null,
        actual_value: null,
        due_date: addDays(today, 7).toISOString().split('T')[0],
        security_status_id: status.id
      });
      continue; // Don't also fire expiry_approaching for an already-expired cert
    }

    // Rule 2: Certificate expiry approaching
    if (
      certTypes.includes(status.status_type) &&
      expiryDate &&
      status.days_until_expiry !== null &&
      status.days_until_expiry <= 60 &&
      status.days_until_expiry > 0
    ) {
      const severity = status.days_until_expiry <= 30 ? 'high' : 'advisory';
      breaches.push({
        breach_type: 'cert_expiry_approaching',
        severity,
        evidence: \`\${vendor.name} \${status.status_type.replace(/_/g, ' ').toUpperCase()} expires on \${
          status.valid_until
        } (\${status.days_until_expiry} days). Request renewal evidence from vendor before expiry.\`,
        contract_clause: null,
        threshold_value: null,
        actual_value: status.days_until_expiry,
        due_date: addDays(expiryDate, -14).toISOString().split('T')[0],
        security_status_id: status.id
      });
    }

    // Rule 3b: Cyber insurance below minimum
    if (
      status.status_type === 'cyber_insurance' &&
      status.numeric_value !== null &&
      status.compliance_threshold !== null
    ) {
      const threshold = parseFloat(status.compliance_threshold);
      if (status.numeric_value < threshold) {
        breaches.push({
          breach_type: 'insurance_expiry_approaching',
          severity: 'high',
          evidence: \`\${vendor.name} cyber insurance limit is £\${
            status.numeric_value.toLocaleString()
          }, below the required minimum of £\${
            threshold.toLocaleString()
          }. Shortfall: £\${(threshold - status.numeric_value).toLocaleString()}.\`,
          contract_clause: status.compliance_threshold,
          threshold_value: threshold,
          actual_value: status.numeric_value,
          due_date: addDays(today, 30).toISOString().split('T')[0],
          security_status_id: status.id
        });
      }
    }

    // Rule 4: Liability cap below minimum
    if (status.status_type === 'liability_cap') {
      if (status.is_compliant === null) {
        warnings.push(
          \`\${vendor.name} liability cap is defined as a fee multiplier. \` +
          'Link the governing contract with annual fee data to enable automatic verification.'
        );
      } else if (status.is_compliant === false && status.numeric_value !== null && status.compliance_threshold !== null) {
        const threshold = parseFloat(status.compliance_threshold);
        breaches.push({
          breach_type: 'liability_cap_below_minimum',
          severity: 'high',
          evidence: \`\${vendor.name} contractual liability cap is £\${
            status.numeric_value.toLocaleString()
          }, below the required minimum of £\${threshold.toLocaleString()}. \` +
          \`Client is underprotected by £\${(threshold - status.numeric_value).toLocaleString()}.\`,
          contract_clause: status.compliance_threshold,
          threshold_value: threshold,
          actual_value: status.numeric_value,
          due_date: addDays(today, 30).toISOString().split('T')[0],
          security_status_id: status.id
        });
      }
    }

    // Rule 5: GDPR DPA not signed
    if (
      status.status_type === 'gdpr_dpa' &&
      ['data_processor', 'payment_processor'].includes(vendor.category)
    ) {
      const dpaSigned = status.current_value === 'true' || status.is_compliant === true;
      if (!dpaSigned) {
        breaches.push({
          breach_type: 'dpa_not_signed',
          severity: 'critical',
          evidence: \`No Data Processing Agreement has been executed with \${
            vendor.name
          }. This vendor processes personal data on behalf of the client. \` +
          'Operating without a DPA violates GDPR Article 28 and creates direct ICO enforcement exposure.',
          contract_clause: 'GDPR Article 28',
          threshold_value: null,
          actual_value: null,
          due_date: addDays(today, 14).toISOString().split('T')[0],
          security_status_id: status.id
        });
      }
    }

    // Rule 6: Penetration test overdue
    if (status.status_type === 'pen_test' && status.current_value) {
      const lastTestDate = parseISO(status.current_value);
      const freqMap: Record<string, number> = {
        annual: 365, 'bi-annual': 183, quarterly: 91
      };
      const freqDays = freqMap[status.compliance_threshold ?? 'annual'] ?? 365;
      const nextDueDate = addDays(lastTestDate, freqDays);

      if (isBefore(nextDueDate, today)) {
        const daysOverdue = differenceInDays(today, nextDueDate);
        const isHighRisk = ['critical', 'high'].includes(vendor.risk_tier);
        breaches.push({
          breach_type: 'pen_test_overdue',
          severity: isHighRisk ? 'high' : 'advisory',
          evidence: \`\${vendor.name} last penetration test was on \${
            status.current_value
          } (\${daysOverdue} days ago). Based on \${status.compliance_threshold ?? 'annual'} frequency, \` +
          \`a new test was due by \${nextDueDate.toISOString().split('T')[0]}. Request updated results.\`,
          contract_clause: null,
          threshold_value: freqDays,
          actual_value: differenceInDays(today, lastTestDate), // Fix: use days since last test as actual_value per spec
          due_date: addDays(today, 30).toISOString().split('T')[0],
          security_status_id: status.id
        });
      }
    }
  }

  return {
    vendor_id: vendor.id,
    status: breaches.length > 0 ? 'breach_found' : 'compliant',
    breaches,
    warnings
  };
}
