// packages/extractor/src/reconciliation/sla-reconciler.ts

import type { ContractObligations } from '../../shared-types/contract-obligations.ts';
import type { InvoiceExtraction } from '../validation/invoice.schema.ts';

export interface ReconciliationResult {
  status: 'compliant' | 'discrepancy_found' | 'unverifiable' | 'error';
  discrepancies: Discrepancy[];
  warnings: string[];
}

export interface Discrepancy {
  discrepancy_type:
    | 'price_escalation_unauthorised'
    | 'sla_credit_missing'
    | 'sla_credit_partial'
    | 'incorrect_line_item'
    | 'currency_mismatch';
  expected_amount: number;
  invoiced_amount: number;
  delta: number;
  evidence: string;
  contract_clause: string;
}

export interface InvoiceDispute {
  type: Discrepancy['discrepancy_type'];
  description: string;
  amount: number;
}

export interface InvoiceReconciliationReport {
  isValid: boolean;
  disputes: InvoiceDispute[];
  warnings: string[];
}

export function reconcile(
  contract: ContractObligations | null,
  invoice: InvoiceExtraction
): ReconciliationResult {
  const discrepancies: Discrepancy[] = [];
  const warnings: string[] = [];

  // Edge Case: Missing contract link
  if (!contract) {
    return {
      status: 'unverifiable',
      discrepancies: [],
      warnings: ['No governing_contract_id linked to this invoice. Cannot perform mathematically sound reconciliation.']
    };
  }

  // Rule 4: Currency check first — abort if mismatch
  if (contract.currency !== invoice.currency) {
    return {
      status: 'error',
      discrepancies: [],
      warnings: [`Currency mismatch: contract is ${contract.currency}, invoice is ${invoice.currency}.`]
    };
  }

  // Rule 1: Price escalation
  if (
    contract.baseMonthlyPrice !== null &&
    invoice.total_amount_due > contract.baseMonthlyPrice
  ) {
    const delta = invoice.total_amount_due - contract.baseMonthlyPrice;
    discrepancies.push({
      discrepancy_type: 'price_escalation_unauthorised',
      expected_amount: contract.baseMonthlyPrice,
      invoiced_amount: invoice.total_amount_due,
      delta: delta,
      evidence: `Invoice total ${invoice.currency} ${invoice.total_amount_due} exceeds contract base price ${contract.currency} ${contract.baseMonthlyPrice} by ${delta}. Escalation trigger: ${contract.priceEscalationTriggerPct ?? 'not defined'}% CPI. Manual CPI verification required.`,
      contract_clause: `Base price: ${contract.baseMonthlyPrice} ${contract.currency}. Escalation trigger: CPI >= ${contract.priceEscalationTriggerPct ?? 'None'}%.`
    });
  }

  // Rules 2 & 3: SLA credit verification
  if (contract.slaUptimeTiers.length > 0) {
    if (invoice.sla_credit_claimed && invoice.sla_credit_amount !== null) {
      // Partial credit check - for now, issue warning as we don't hold the SLA Report uptime in this struct natively yet
      warnings.push('SLA credit claimed but uptime data not verified. Link an SLA report to enable automatic verification.');
      
      // If we *did* know the tier, we'd calculate exactly and push discrepancy for partials.
      // e.g. delta mathematical test.
    } else if (!invoice.sla_credit_claimed) {
      warnings.push('SLA tiers defined in contract but no credit claimed. Upload the SLA report for this period to verify.');
    }
  }

  return {
    status: discrepancies.length > 0 ? 'discrepancy_found' : 'compliant',
    discrepancies,
    warnings
  };
}

export async function runReconciliation(
  invoice: InvoiceExtraction,
  obligationId: string
): Promise<InvoiceReconciliationReport> {
  // Until contract lookup is wired through obligationId, keep behavior explicit.
  const result = reconcile(null, invoice);

  return {
    isValid: result.status === 'compliant' || result.status === 'unverifiable',
    disputes: result.discrepancies.map((d) => ({
      type: d.discrepancy_type,
      description: d.evidence,
      amount: d.delta,
    })),
    warnings: result.warnings,
  };
}
