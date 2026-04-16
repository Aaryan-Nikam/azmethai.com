// packages/extractor/src/generation/compliance-generator.ts

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ComplianceNoticeContext {
  sender_company_name: string;
  sender_address: string;
  date: string;
  vendor_name: string;
  contract_reference: string;
  breach_type: string;
  required_value: string;
  actual_value: string;
  response_period_days: number;
}

const COMPLIANCE_NOTICE_SYSTEM_PROMPT = `
You are generating a formal demand letter on behalf of an enterprise legal department. You must:
1. Fill ONLY the slots marked with {{double_braces}}
2. Never modify the surrounding legal text
3. Never add info not provided in the context
4. Keep the tone formal, factual, and strictly bound to the parameters.
`;

const SECURITY_DEFICIT_TEMPLATE = `
{{sender_company_name}}
{{sender_address}}
{{date}}

Formal Notice of Contractual Security Breach
Contract Reference: {{contract_reference}}

Dear {{vendor_name}},

We act in respect of our governing agreement reference {{contract_reference}}.

During our automated third-party risk analysis, we have identified a critical deficit in your required compliance boundaries. Specifically, we have logged a {{breach_type}}.

Pursuant to the contract, the required standard is:
{{required_value}}

Your last verified submission indicated:
{{actual_value}}

You are required to submit updated certificated evidence closing this deficit within {{response_period_days}} days of this notice. Failure to do so may result in the suspension of data processing activities or contractual termination.

Yours faithfully,
[AUTHORISED SIGNATORY — REQUIRES MANUAL COMPLETION]
`;

export async function generateComplianceNotice(
  context: ComplianceNoticeContext
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    temperature: 0.05, // Ultra-low temperature guaranteeing strict interpolation adherence
    system: COMPLIANCE_NOTICE_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: \`Fill the slots in this template using ONLY the following data:\\n\\n\${JSON.stringify(context, null, 2)}\\n\\nTemplate:\\n\${SECURITY_DEFICIT_TEMPLATE}\`
    }]
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '';
}
