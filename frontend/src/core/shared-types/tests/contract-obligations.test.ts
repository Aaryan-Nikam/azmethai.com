// packages/shared-types/src/tests/contract-obligations.test.ts

import { describe, it, expect } from 'vitest';
import { 
  ContractObligations, 
  CONTRACT_OBLIGATIONS_VERSION, 
  assertContractObligationsVersion 
} from '../contract-obligations.ts';

describe('assertContractObligationsVersion', () => {
  it('passes silently when version matches exactly', () => {
    const validPayload: ContractObligations = {
      version: CONTRACT_OBLIGATIONS_VERSION,
      documentId: 'doc-123',
      tenantId: 'tenant-123',
      extractedAt: new Date().toISOString(),
      baseMonthlyPrice: 1000,
      currency: 'GBP',
      priceEscalationTriggerPct: 3.0,
      priceEscalationCap: null,
      priceEscalationNoticeRequired: true,
      slaUptimeTargetPct: 99.9,
      slaUptimeTiers: [],
      slaCreditWindowDays: 30,
      slaReportingRequired: true,
      paymentTermsDays: 30,
      latePenaltyRatePct: 4.0,
      autoRenewalClause: false,
      noticePeriodDays: 90,
      counterpartyName: 'Acme Corp',
      contractStartDate: '2024-01-01',
      contractEndDate: '2025-01-01'
    };

    expect(() => assertContractObligationsVersion(validPayload)).not.toThrow();
  });

  it('throws loudly when version mismatches', () => {
    const invalidPayload = {
      version: '0.9.0', // Mismatch
      documentId: 'doc-123',
      // ...other fields don't matter as version fails first
    };

    expect(() => assertContractObligationsVersion(invalidPayload)).toThrow(
      /ContractObligations version mismatch: expected 1\.0\.0, got 0\.9\.0/
    );
  });

  it('throws loudly when version is missing entirely', () => {
    const missingPayload = {
      documentId: 'doc-123',
    };

    expect(() => assertContractObligationsVersion(missingPayload)).toThrow(
      /ContractObligations version mismatch: expected 1\.0\.0, got undefined/
    );
  });
});
