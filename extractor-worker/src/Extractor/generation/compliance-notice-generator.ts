// packages/extractor/src/generation/compliance-notice-generator.ts

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface ComplianceNoticeContext {
  sender_company_name: string;
  sender_address: string;
  date: string;
  vendor_contact_name: string;
  vendor_name: string;
  contract_date: string;
  contract_clause_reference: string;
  breach_reference: string;
  breach_description: string;
  required_action: string;
  due_date: string;
  consequence_statement: string; // Exclusively reviewer-selected
}

const REMEDIATION_REQUEST_TEMPLATE = `
{{sender_company_name}}
{{sender_address}}
{{date}}

Vendor Compliance Remediation Request
Ref: {{breach_reference}}

Dear {{vendor_contact_name}},

We write regarding {{vendor_name}}'s compliance obligations under our governing agreement dated {{contract_date}}.

We have identified the following compliance deficiency:

{{breach_description}}

Pursuant to {{contract_clause_reference}}, you are required to:

{{required_action}}

Please provide evidence of remediation no later than {{due_date}}. Failure to remediate by this date {{consequence_statement}}.

Yours faithfully,
[AUTHORISED SIGNATORY — REQUIRES MANUAL COMPLETION]
[Title]
[Date signed]
`;

const SLOT_FILL_SYSTEM_PROMPT = `
You are generating a formal vendor compliance notice. Fill ONLY the slots marked {{like_this}}.
Do not modify any surrounding text. Do not add information not provided.
If a slot value is not provided, write [REQUIRES MANUAL INPUT] in that slot.
The signatory block is hardcoded — never generate a name or signature.
`;

export async function generateBatchedComplianceNotice(
  vendorId: string,
  tenantId: string,
  reviewerSelectedConsequence: string
): Promise<{ draftContent: string; breachIds: string[] }> {
  // Pull all strictly "approved" breaches for this specific vendor
  const { data: approvedBreaches, error } = await supabase
    .from('ae_compliance_breaches')
    .select('id, evidence, contract_clause, due_date')
    .eq('vendor_id', vendorId)
    .eq('tenant_id', tenantId)
    .eq('status', 'approved');

  if (error || !approvedBreaches || approvedBreaches.length === 0) {
    throw new Error('No approved breaches found to batch.');
  }

  const { data: vendorData } = await supabase
    .from('ae_vendors')
    .select('vendor_name')
    .eq('id', vendorId)
    .single();

  const formattedDescriptions = approvedBreaches.map(b => b.evidence).join('\\n\\n');

  // We conservatively grab the most urgent due date for the batched notice 
  const urgentDueDate = approvedBreaches.sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )[0].due_date;

  const context: Partial<ComplianceNoticeContext> = {
    sender_company_name: '[ENTERPRISE CLIENT NAME]',
    sender_address: '[ENTERPRISE ADDRESS]',
    date: new Date().toISOString().split('T')[0],
    vendor_contact_name: '[VENDOR CONTACT NAME]',
    vendor_name: vendorData?.vendor_name || 'Vendor',
    contract_date: '[CONTRACT DATE]',
    contract_clause_reference: approvedBreaches.map(b => b.contract_clause || 'general compliance covenants').join(', '),
    breach_reference: `AUTH-B-${approvedBreaches[0].id.substring(0, 8).toUpperCase()}`,
    breach_description: formattedDescriptions,
    required_action: 'Please submit updated compliance verifications, updated policy bounds, or a remediation timeline on company letterhead.',
    due_date: urgentDueDate,
    consequence_statement: reviewerSelectedConsequence // Injected blindly from the UI radio button logic 
  };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    temperature: 0.0, // Hard 0 forcing zero generative deviation from slots
    system: SLOT_FILL_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Format the context into the template.\\n\\nContext:\\n${JSON.stringify(context, null, 2)}\\n\\nTemplate:\\n${REMEDIATION_REQUEST_TEMPLATE}`
    }]
  });

  const draftContent = response.content[0].type === 'text' ? response.content[0].text : '';

  // Return the draft and the specific IDs so the handler can bulk-update them to 'notice_drafted'
  return {
    draftContent,
    breachIds: approvedBreaches.map(b => b.id)
  };
}
