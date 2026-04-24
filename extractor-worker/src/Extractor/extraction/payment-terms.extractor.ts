import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { addDays, endOfMonth, parseISO, isValid } from 'date-fns';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PaymentTermsExtractionSchema = z.object({
  payment_terms_raw: z.string(),
  invoice_date: z.string(),
  net_days_extracted: z.number().nullable(),
  is_eom: z.boolean().default(false), // e.g. "NET60 EOM"
  early_payment_discount_pct: z.number().nullable(),
  early_payment_discount_days: z.number().nullable(),
  late_penalty_type: z.enum(['pct_per_day', 'pct_per_month', 'fixed_per_day', 'none']),
  late_penalty_rate: z.number().nullable(),
  confidence_score: z.number().min(0).max(1),
  ambiguous_terms_flag: z.boolean(),
  currency_mismatch_detected: z.boolean().default(false)
});

export type PaymentTermsExtraction = z.infer<typeof PaymentTermsExtractionSchema>;

const SYSTEM_PROMPT = `
You extract absolute payment terms from vendor invoices. Errors cost the enterprise immediate cash flow losses.
Rules:
1. Extract the raw verbatim payment terms exactly as written in the document into 'payment_terms_raw'.
2. If terms state "NET 45", net_days_extracted = 45. If "NET 30 EOM", net_days_extracted = 30 and is_eom = true.
3. If the invoice header currency (e.g. USD) does NOT match line item pricing blocks (e.g. EUR), check 'currency_mismatch_detected' = true immediately.
4. If payment terms are contradictory (e.g., "Due on receipt" but also says "Net 30"), mark ambiguous_terms_flag = true and set confidence_score = 0.2.
`;

export async function extractPaymentTerms(
  documentText: string
): Promise<{ result?: any; success: boolean; errorMessage?: string }> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools: [{
        name: 'extract_payment_terms',
        description: 'Extract exact payment limit bounds from OCR text.',
        input_schema: zodToJsonSchema(PaymentTermsExtractionSchema) as Anthropic.Tool.InputSchema,
      }],
      tool_choice: { type: 'tool', name: 'extract_payment_terms' },
      messages: [{ role: 'user', content: documentText }],
      temperature: 0.0
    });

    const toolUse = response.content.find(b => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') throw new Error('No tool_use block returned.');

    const parsed = PaymentTermsExtractionSchema.parse(toolUse.input);
    
    // Hard Currency Verification abort
    if (parsed.currency_mismatch_detected) {
      throw new Error('EXTRACTION_ABORT: Currency discrepancy detected between header and line items.');
    }

    if (parsed.ambiguous_terms_flag || parsed.confidence_score < 0.3) {
      throw new Error('EXTRACTION_ABORT: Terms ambiguous. Requires human invoice parsing fallback.');
    }

    if (!parsed.net_days_extracted) throw new Error('EXTRACTION_ABORT: Missing core net terms.');
    
    // Deterministic Native Date Arithmetic bypassing the LLM
    const invDate = parseISO(parsed.invoice_date);
    if (!isValid(invDate)) throw new Error('Invalid Invoice Date parsed.');

    let calculatedDueDate = addDays(invDate, parsed.net_days_extracted);
    if (parsed.is_eom) {
      // If EOM, the baseline date is shifted to the end of the invoice month first
      const eomDate = endOfMonth(invDate);
      calculatedDueDate = addDays(eomDate, parsed.net_days_extracted);
    }
    
    let earlyDiscountExpiry = null;
    if (parsed.early_payment_discount_days) {
      earlyDiscountExpiry = parsed.is_eom 
         ? addDays(endOfMonth(invDate), parsed.early_payment_discount_days).toISOString().split('T')[0]
         : addDays(invDate, parsed.early_payment_discount_days).toISOString().split('T')[0];
    }

    return {
      success: true,
      result: {
        payment_terms_raw: parsed.payment_terms_raw,
        net_days: parsed.net_days_extracted,
        invoice_date: parsed.invoice_date,
        due_date: calculatedDueDate.toISOString().split('T')[0],
        early_payment_discount_pct: parsed.early_payment_discount_pct,
        early_payment_discount_days: parsed.early_payment_discount_days,
        early_payment_discount_expiry: earlyDiscountExpiry,
        late_penalty_type: parsed.late_penalty_type,
        late_penalty_rate: parsed.late_penalty_rate,
      }
    };
  } catch (error: any) {
    return { success: false, errorMessage: error.message };
  }
}
