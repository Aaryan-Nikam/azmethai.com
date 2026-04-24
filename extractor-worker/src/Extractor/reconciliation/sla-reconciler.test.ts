// packages/extractor/src/reconciliation/sla-reconciler.test.ts

import { describe, it, expect } from 'vitest';
import { reconcile } from './sla-reconciler.ts';
import type { ContractObligations } from '../../shared-types/contract-obligations.ts';
import type { InvoiceExtraction } from '../validation/invoice.schema.ts';

describe('SLA Reconciler', () => {
  const baseContract: ContractObligations = {
    version: '1.0.0',
    documentId: 'doc-1',
    tenantId: 'tenant-1',
    extractedAt: new Date().toISOString(),
    baseMonthlyPrice: 10000,
    currency: 'GBP',
    priceEscalationTriggerPct: null,
    priceEscalationCap: null,
    priceEscalationNoticeRequired: false,
    slaUptimeTargetPct: null,
    slaUptimeTiers: [],
    slaCreditWindowDays: null,
    slaReportingRequired: false,
    paymentTermsDays: 30,
    latePenaltyRatePct: null,
    autoRenewalClause: false,
    noticePeriodDays: null,
    counterpartyName: 'Vendor',
    contractStartDate: '2024-01-01',
    contractEndDate: '2025-01-01'
  };

  const baseInvoice: InvoiceExtraction = {
    invoice_number: 'INV-1',
    invoice_date: '2024-02-01',
    payment_due_date: '2024-03-01',
    payment_terms: 'Net 30',
    vendor_name: 'Vendor',
    line_items: [],
    subtotal: 10000,
    tax_amount: 0,
    total_amount_due: 10000,
    currency: 'GBP',
    sla_credit_claimed: false,
    sla_credit_amount: null,
    late_penalty_applies: false,
    confidence_scores: {},
    source_texts: {}
  };

  it('1. Compliant: matches base price without SLA claims', () => {
    const result = reconcile(baseContract, baseInvoice);
    expect(result.status).toBe('compliant');
    expect(result.discrepancies).toHaveLength(0);
  });

  it('2. Price hike: invoice total exceeds base price', () => {
    const hikedInvoice = { ...baseInvoice, total_amount_due: 10800 };
    const result = reconcile(baseContract, hikedInvoice);
    expect(result.status).toBe('discrepancy_found');
    expect(result.discrepancies).toHaveLength(1);
    expect(result.discrepancies[0].discrepancy_type).toBe('price_escalation_unauthorised');
    expect(result.discrepancies[0].delta).toBe(800);
  });

  it('3. SLA credit missing (warning triggered)', () => {
    const slaContract = { 
      ...baseContract, 
      slaUptimeTiers: [{ minUptimePct: 99.0, maxUptimePct: 99.5, creditPct: 5 }] 
    };
    const result = reconcile(slaContract, baseInvoice);
    // As per V1 logic, without an SLA report it just sets a warning, not a discrepancy yet.
    expect(result.status).toBe('compliant');
    expect(result.warnings[0]).toContain('SLA tiers defined in contract but no credit claimed');
  });

  it('4. Partial credit (warning triggered)', () => {
    // V1 partial credit logic creates a warning pending linked SLA report logic
    const slaContract = { 
      ...baseContract, 
      slaUptimeTiers: [{ minUptimePct: 99.0, maxUptimePct: 99.5, creditPct: 5 }] 
    };
    const partialInvoice = { 
      ...baseInvoice, 
      total_amount_due: 9800, 
      sla_credit_claimed: true, 
      sla_credit_amount: 200 
    };
    const result = reconcile(slaContract, partialInvoice);
    expect(result.status).toBe('compliant');
    expect(result.warnings[0]).toContain('SLA credit claimed but uptime data not verified');
  });

  it('5. Currency mismatch', () => {
    const usdInvoice = { ...baseInvoice, currency: 'USD' };
    const result = reconcile(baseContract, usdInvoice);
    expect(result.status).toBe('error');
    expect(result.warnings[0]).toContain('Currency mismatch');
  });

  it('6. Missing contract link', () => {
    const result = reconcile(null, baseInvoice);
    expect(result.status).toBe('unverifiable');
    expect(result.warnings[0]).toContain('No governing_contract_id linked');
  });
});
