// packages/extractor/src/reconciliation/security-reconciler.test.ts

import { describe, it, expect } from 'vitest';
import { reconcileVendorSecurity } from './security-reconciler.ts';
import { addDays, subDays, format } from 'date-fns';

describe('V2 Vendor Security Reconciler', () => {
  const today = new Date();

  const baseVendor = {
    id: 'v-1',
    name: 'Test Vendor',
    category: 'data_processor',
    risk_tier: 'high'
  };

  const createStatus = (overrides: Partial<Parameters<typeof reconcileVendorSecurity>[1][0]>) => ({
    id: 's-1',
    status_type: 'soc2_type_ii',
    valid_until: null,
    days_until_expiry: null,
    numeric_value: null,
    compliance_threshold: null,
    current_value: null,
    is_compliant: null,
    cert_issuer: null,
    cert_reference: null,
    ...overrides
  });

  it('1. All certs valid, DPA signed, pen test current -> compliant', () => {
    const result = reconcileVendorSecurity(baseVendor, [
      createStatus({ status_type: 'soc2_type_ii', valid_until: format(addDays(today, 100), 'yyyy-MM-dd') }),
      createStatus({ status_type: 'gdpr_dpa', current_value: 'true', is_compliant: true }),
      createStatus({ status_type: 'pen_test', current_value: format(subDays(today, 10), 'yyyy-MM-dd'), compliance_threshold: 'annual' })
    ], today);
    
    expect(result.status).toBe('compliant');
    expect(result.breaches).toHaveLength(0);
  });

  it('2. SOC2 expired 10 days ago -> cert_expired, critical', () => {
    const result = reconcileVendorSecurity(baseVendor, [
      createStatus({ status_type: 'soc2_type_ii', valid_until: format(subDays(today, 10), 'yyyy-MM-dd') })
    ], today);

    expect(result.status).toBe('breach_found');
    expect(result.breaches[0].breach_type).toBe('cert_expired');
    expect(result.breaches[0].severity).toBe('critical');
  });

  it('3. ISO27001 expires in 25 days -> cert_expiry_approaching, high', () => {
    const result = reconcileVendorSecurity(baseVendor, [
      createStatus({ 
        status_type: 'iso27001', 
        valid_until: format(addDays(today, 25), 'yyyy-MM-dd'),
        days_until_expiry: 25 
      })
    ], today);

    expect(result.status).toBe('breach_found');
    expect(result.breaches[0].breach_type).toBe('cert_expiry_approaching');
    expect(result.breaches[0].severity).toBe('high');
  });

  it('4. ISO27001 expires in 45 days -> cert_expiry_approaching, advisory', () => {
    const result = reconcileVendorSecurity(baseVendor, [
      createStatus({ 
        status_type: 'iso27001', 
        valid_until: format(addDays(today, 45), 'yyyy-MM-dd'),
        days_until_expiry: 45 
      })
    ], today);

    expect(result.status).toBe('breach_found');
    expect(result.breaches[0].breach_type).toBe('cert_expiry_approaching');
    expect(result.breaches[0].severity).toBe('advisory');
  });

  it('5. Cyber insurance £500k, threshold £1m -> insurance_expiry_approaching, delta £500k', () => {
    const result = reconcileVendorSecurity(baseVendor, [
      createStatus({ 
        status_type: 'cyber_insurance', 
        numeric_value: 500000,
        compliance_threshold: '1000000'
      })
    ], today);

    expect(result.status).toBe('breach_found');
    expect(result.breaches[0].breach_type).toBe('insurance_expiry_approaching');
    expect(result.breaches[0].severity).toBe('high');
    expect(result.breaches[0].threshold_value! - result.breaches[0].actual_value!).toBe(500000);
  });

  it('6. Data processor, no DPA signed -> dpa_not_signed, critical', () => {
    const result = reconcileVendorSecurity(baseVendor, [
      createStatus({ status_type: 'gdpr_dpa', current_value: 'false', is_compliant: false })
    ], today);

    expect(result.status).toBe('breach_found');
    expect(result.breaches[0].breach_type).toBe('dpa_not_signed');
    expect(result.breaches[0].severity).toBe('critical');
  });

  it('7. Non-data-processor, no DPA -> compliant (rule 5 bypass)', () => {
    const nonProcessorVendor = { ...baseVendor, category: 'saas_software' };
    const result = reconcileVendorSecurity(nonProcessorVendor, [
      createStatus({ status_type: 'gdpr_dpa', current_value: 'false', is_compliant: false })
    ], today);

    expect(result.status).toBe('compliant');
    expect(result.breaches).toHaveLength(0);
  });

  it('8. Pen test 400 days ago, annual frequency -> pen_test_overdue', () => {
    const result = reconcileVendorSecurity(baseVendor, [
      createStatus({ 
        status_type: 'pen_test', 
        current_value: format(subDays(today, 400), 'yyyy-MM-dd'),
        compliance_threshold: 'annual'
      })
    ], today);

    expect(result.status).toBe('breach_found');
    expect(result.breaches[0].breach_type).toBe('pen_test_overdue');
    // Actual actual_value depends on current time but should be > 365
    expect(result.breaches[0].actual_value!).toBeGreaterThan(365);
  });
});
