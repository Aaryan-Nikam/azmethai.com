// packages/shared-types/src/contract-obligations.ts

export const CONTRACT_OBLIGATIONS_VERSION = '1.0.0';

export interface ContractObligations {
  version: typeof CONTRACT_OBLIGATIONS_VERSION;
  documentId: string;
  tenantId: string;
  extractedAt: string; // ISO timestamp

  // Pricing
  baseMonthlyPrice: number | null;
  currency: string;
  priceEscalationTriggerPct: number | null; // e.g. 3.0 = 3% CPI threshold
  priceEscalationCap: number | null;        // max escalation %
  priceEscalationNoticeRequired: boolean;

  // SLA
  slaUptimeTargetPct: number | null;        // e.g. 99.5
  slaUptimeTiers: SLAUptimeTier[];          // tiered brackets if present
  slaCreditWindowDays: number | null;       // days after incident to claim credit
  slaReportingRequired: boolean;

  // Payment
  paymentTermsDays: number | null;          // e.g. 30 for NET30
  latePenaltyRatePct: number | null;
  autoRenewalClause: boolean;
  noticePeriodDays: number | null;

  // Counterparty
  counterpartyName: string | null;
  contractStartDate: string | null;         // ISO date
  contractEndDate: string | null;           // ISO date
}

export interface SLAUptimeTier {
  minUptimePct: number;   // e.g. 99.0
  maxUptimePct: number;   // e.g. 99.5
  creditPct: number;      // e.g. 10 = 10% of monthly fee
}

// Version guard — used by Function 2 at runtime
export function assertContractObligationsVersion(
  obj: unknown
): asserts obj is ContractObligations {
  if ((obj as ContractObligations).version !== CONTRACT_OBLIGATIONS_VERSION) {
    throw new Error(
      `ContractObligations version mismatch: expected ${CONTRACT_OBLIGATIONS_VERSION}, got ${(obj as ContractObligations).version}`
    );
  }
}
