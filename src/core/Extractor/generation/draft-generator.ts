// packages/extractor/src/generation/draft-generator.ts

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface DisputeContext {
  sender_company_name: string;
  sender_address: string;
  date: string;
  invoice_number: string;
  invoice_date: string;
  counterparty_name: string;
  currency: string;
  invoiced_amount: number;
  expected_amount: number;
  delta_amount: number;
  discrepancy_description: string;
  contract_clause_reference: string;
  response_period_days: number;
}

const DISPUTE_LETTER_SYSTEM_PROMPT = `
You are generating a formal dispute letter on behalf of a business. You must:
1. Fill ONLY the slots marked with {{double_braces}}
2. Never modify the surrounding legal text
3. Never add information not provided in the context
4. If you cannot determine a value with certainty, write [REQUIRES MANUAL INPUT]
5. Keep the tone formal and factual. No emotional language.
`;

const DISPUTE_LETTER_TEMPLATE = `
{{sender_company_name}}
{{sender_address}}
{{date}}

Formal Notice of Invoice Dispute
Invoice Reference: {{invoice_number}}

Dear {{counterparty_name}},

We write in respect of invoice {{invoice_number}} dated {{invoice_date}} 
in the amount of {{currency}} {{invoiced_amount}}.

Having reviewed this invoice against our governing agreement, we have 
identified the following discrepancy:

{{discrepancy_description}}

Pursuant to {{contract_clause_reference}}, the correct amount due is 
{{currency}} {{expected_amount}}. We therefore dispute the sum of 
{{currency}} {{delta_amount}}.

We request that you issue a corrected invoice or credit note for 
{{currency}} {{delta_amount}} within {{response_period_days}} days 
of this notice.

Yours faithfully,
[AUTHORISED SIGNATORY — REQUIRES MANUAL COMPLETION]
`;

export async function generateDisputeLetter(
  dispute: DisputeContext
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    temperature: 0.1,
    system: DISPUTE_LETTER_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Fill the slots in this template using ONLY the following data:\n\n${JSON.stringify(dispute, null, 2)}\n\nTemplate:\n${DISPUTE_LETTER_TEMPLATE}`
    }]
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '';
}
