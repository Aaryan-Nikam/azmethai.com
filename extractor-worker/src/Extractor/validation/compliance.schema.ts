// packages/extractor/src/validation/compliance.schema.ts

import { z } from 'zod';

const CertificationFieldSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]).nullable(),
  confidence: z.number().min(0).max(1),
  source_text: z.string().nullable(),
  source_page: z.number().int().nullable()
});

export const ComplianceExtractionSchema = z.object({
  // SOC2
  soc2_certified: CertificationFieldSchema,
  soc2_type: z.object({
    value: z.enum(['Type I', 'Type II']).nullable(),
    confidence: z.number().min(0).max(1),
    source_text: z.string().nullable(),
    source_page: z.number().int().nullable()
  }),
  soc2_expiry_date: CertificationFieldSchema,
  soc2_auditor: CertificationFieldSchema,
  soc2_report_period_end: CertificationFieldSchema,

  // ISO 27001
  iso27001_certified: CertificationFieldSchema,
  iso27001_expiry_date: CertificationFieldSchema,
  iso27001_certifying_body: CertificationFieldSchema,

  // Cyber insurance
  cyber_insurance_provider: CertificationFieldSchema,
  cyber_insurance_limit_gbp: CertificationFieldSchema,
  cyber_insurance_expiry: CertificationFieldSchema,
  cyber_insurance_policy_ref: CertificationFieldSchema,

  // Contractual liability
  liability_cap_value: CertificationFieldSchema,
  liability_cap_type: z.object({
    value: z.enum(['fixed', 'multiplier_of_fees', 'unlimited', 'not_stated']).nullable(),
    confidence: z.number().min(0).max(1),
    source_text: z.string().nullable(),
    source_page: z.number().int().nullable()
  }),
  liability_multiplier: CertificationFieldSchema,
  indemnity_clause_present: CertificationFieldSchema,

  // GDPR / data
  gdpr_dpa_signed: CertificationFieldSchema,
  data_residency_locations: z.object({
    value: z.array(z.string()).nullable(),
    confidence: z.number().min(0).max(1),
    source_text: z.string().nullable(),
    source_page: z.number().int().nullable()
  }),
  subprocessors_listed: CertificationFieldSchema,

  // Pen testing
  pen_test_conducted: CertificationFieldSchema,
  pen_test_last_date: CertificationFieldSchema,
  pen_test_frequency: CertificationFieldSchema,
  pen_test_provider: CertificationFieldSchema,

  // BCDR
  bcdr_plan_exists: CertificationFieldSchema,
  rto_hours: CertificationFieldSchema,
  rpo_hours: CertificationFieldSchema,

  reasoning: z.string()
});

export type ComplianceExtraction = z.infer<typeof ComplianceExtractionSchema>;
