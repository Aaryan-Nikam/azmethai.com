/**
 * Zod schemas for vendor contract extraction.
 * 
 * Design principle: Every extracted field is a ConfidenceField<T> — it carries
 * the value, a 0.0-1.0 confidence score, and the exact source text the model
 * pulled from. This is the integrity layer of the entire system.
 * 
 * A field with confidence < 0.40 is rejected.
 * A field with confidence 0.40-0.70 routes to human review.
 * A field with confidence > 0.70 is auto-accepted.
 */

import { z } from 'zod';

// ─── Confidence Thresholds ─────────────────────────────────────────────────

export const CONFIDENCE = {
  AUTO_ACCEPT: parseFloat(process.env.CONFIDENCE_AUTO_ACCEPT ?? '0.70'),
  REVIEW_THRESHOLD: parseFloat(process.env.CONFIDENCE_REVIEW_THRESHOLD ?? '0.40'),
} as const;

// ─── Base Confidence Field ─────────────────────────────────────────────────

/** Every field from Claude includes value + confidence + the source text */
const ConfidenceField = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({
    value: valueSchema,
    confidence: z.number().min(0).max(1),
    source_text: z.string().describe('The exact text this was extracted from'),
    reasoning: z.string().optional().describe('Claude\'s chain-of-thought for this field'),
  });

const OptionalConfidenceField = <T extends z.ZodTypeAny>(valueSchema: T) =>
  ConfidenceField(valueSchema).optional();

// ─── SLA Commitment Schema ─────────────────────────────────────────────────

export const SLACommitmentSchema = z.object({
  metric: z.string().describe('What is being measured (e.g., uptime, response time)'),
  target: z.string().describe('The committed level (e.g., 99.9%, 4 hours)'),
  measurement_period: z.string().optional().describe('How it is measured (monthly, quarterly)'),
  credit_mechanism: z.string().optional().describe('What credits are available if breached'),
  credit_percentage: z.number().optional().describe('Credit as % of fees if breached'),
});

// ─── Price Escalation Trigger Schema ──────────────────────────────────────

export const PriceEscalationTriggerSchema = z.object({
  trigger_type: z.enum(['annual', 'cpi', 'index', 'anniversary', 'milestone', 'other']),
  description: z.string(),
  cap_percentage: z.number().optional().describe('Maximum % increase allowed'),
  reference_index: z.string().optional().describe('CPI/RPI index referenced'),
});

// ─── Auto-Renewal Clause Schema ────────────────────────────────────────────

export const AutoRenewalClauseSchema = z.object({
  exists: z.boolean(),
  notice_period_days: z.number().optional().describe('Days notice required to prevent auto-renewal'),
  notice_method: z.string().optional().describe('How notice must be given (written, email, etc.)'),
  notice_recipient: z.string().optional().describe('Who notice must be sent to'),
  renewal_term_months: z.number().optional().describe('How long each renewal extends the contract'),
});

// ─── Termination Rights Schema ─────────────────────────────────────────────

export const TerminationRightsSchema = z.object({
  for_convenience: z.boolean().describe('Can terminate without cause'),
  convenience_notice_days: z.number().optional(),
  for_breach: z.boolean().describe('Can terminate for material breach'),
  breach_cure_period_days: z.number().optional().describe('Days to cure breach before termination'),
  for_insolvency: z.boolean().describe('Can terminate if counterparty becomes insolvent'),
  exit_fees: z.string().optional().describe('Any fees payable on early termination'),
});

// ─── Full Vendor Contract Extraction Schema ────────────────────────────────

export const VendorContractExtractionSchema = z.object({
  // Document identity
  counterparty_name: ConfidenceField(z.string()),
  contract_title: ConfidenceField(z.string()),
  governing_law: ConfidenceField(z.string()).optional(),

  // Critical dates
  effective_date: ConfidenceField(z.string().describe('ISO 8601 date')),
  expiry_date: ConfidenceField(z.string().describe('ISO 8601 date')).optional(),
  initial_term_months: OptionalConfidenceField(z.number()),

  // The most dangerous clauses (missed auto-renewals cost £40-200K)
  auto_renewal: ConfidenceField(AutoRenewalClauseSchema),

  // Financial obligations
  contract_value_gbp: OptionalConfidenceField(z.number().describe('Total contract value in GBP')),
  annual_value_gbp: OptionalConfidenceField(z.number().describe('Annual value in GBP')),
  payment_terms_days: OptionalConfidenceField(z.number()),
  price_escalation_triggers: ConfidenceField(
    z.array(PriceEscalationTriggerSchema)
  ).optional(),

  // SLA commitments (unclaimed credits are routinely £20-80K/year)
  sla_commitments: ConfidenceField(
    z.array(SLACommitmentSchema)
  ).optional(),

  // Termination
  termination_rights: ConfidenceField(TerminationRightsSchema),

  // Data & compliance
  data_processing_agreement: ConfidenceField(z.boolean()),
  liability_cap_gbp: OptionalConfidenceField(z.number()),
  confidentiality_duration_years: OptionalConfidenceField(z.number()),
});

// ─── Extraction Result (what the system persists) ──────────────────────────

export type VendorContractExtraction = z.infer<typeof VendorContractExtractionSchema>;

export interface ExtractionResult {
  extraction: VendorContractExtraction;
  routing: FieldRouting[];
  summary: ExtractionSummary;
}

export interface FieldRouting {
  field: string;
  confidence: number;
  decision: 'auto_accept' | 'human_review' | 'rejected';
  value: unknown;
}

export interface ExtractionSummary {
  total_fields: number;
  auto_accepted: number;
  needs_review: number;
  rejected: number;
  overall_confidence: number;
  document_processable: boolean;  // false if >30% of fields rejected
  critical_auto_renewal_confidence: number;  // surfaced separately — always check this
}
