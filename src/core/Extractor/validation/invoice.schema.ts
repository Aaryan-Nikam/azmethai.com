import { z } from 'zod';

const LineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().nullable(),
  unit_price: z.number().nullable(),
  line_total: z.number(),
  is_sla_credit: z.boolean().default(false),
  is_penalty: z.boolean().default(false)
});

export const InvoiceExtractionSchema = z.object({
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),  // ISO date
  payment_due_date: z.string().nullable(),
  payment_terms: z.string().nullable(),
  vendor_name: z.string().nullable(),
  line_items: z.array(LineItemSchema),
  subtotal: z.number().nullable(),
  tax_amount: z.number().nullable(),
  total_amount_due: z.number(),
  currency: z.string().default('GBP'),
  sla_credit_claimed: z.boolean(),
  sla_credit_amount: z.number().nullable(),
  late_penalty_applies: z.boolean(),
  confidence_scores: z.record(z.number().min(0).max(1)),
  source_texts: z.record(z.string())
});

export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;
