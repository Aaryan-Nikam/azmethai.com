// packages/extractor/src/extraction/compliance.extractor.ts

import Anthropic from '@anthropic-ai/sdk';
import { Langfuse } from 'langfuse';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ComplianceExtractionSchema, ComplianceExtraction } from '../validation/compliance.schema.ts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com'
});

const MODEL = 'claude-sonnet-4-5';
export const COMPLIANCE_PROMPT_VERSION = 'compliance-v2.0.0';

const SYSTEM_PROMPT = `
You are a vendor compliance document extractor for an enterprise risk monitoring system. Your extractions are used to detect security failures and contractual liability gaps. Errors have direct financial and regulatory consequences.

Before calling the extraction tool, you MUST reason through:
1. What type of document is this (SOC2 report, ISO certificate, insurance certificate, DPA, security questionnaire, contract clause, pen test summary)?
2. What certification period does this cover and is it still valid today?
3. Are there any conflicting statements in the document about the same field?
4. Are any fields definitively absent (explicitly not offered) vs. simply not mentioned?

Confidence rules:
- 1.0: The exact value is stated explicitly, unambiguously, with no interpretation required
- 0.7–0.9: The value is clearly implied but requires one step of inference
- 0.4–0.6: The document contains relevant language but the value is genuinely ambiguous
- 0.1–0.3: You are inferring from context alone
- 0.0 + null: The field is absent from this document

For dates: always extract in ISO 8601 format (YYYY-MM-DD). If only month and year are given, use the last day of that month as the expiry date — this is the conservative interpretation for compliance purposes.

For monetary values: always extract as a number in GBP. If the document uses USD or EUR, note this in source_text and set confidence to 0.6 — the reviewer must apply the exchange rate.
`;

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: 'extract_vendor_compliance_status',
  description: 'Extracts comprehensive compliance data bridging SOC2 limits, DPA signatures, and Cyber limits natively to the enterprise verification layer.',
  input_schema: zodToJsonSchema(ComplianceExtractionSchema) as Anthropic.Tool.InputSchema,
};

export async function extractComplianceData(
  documentText: string,
  artifactId: string,
): Promise<{ result?: ComplianceExtraction; success: boolean; errorMessage?: string }> {
  const trace = langfuse.trace({
    name: 'vendor-compliance-extraction',
    metadata: { artifactId, version: COMPLIANCE_PROMPT_VERSION }
  });

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: \`Extract vendor compliance bounds deterministically from this document block.\\n\\n---\\n\${documentText}\\n---\`,
    },
  ];

  const generation = trace.generation({
    name: 'claude-compliance-v2',
    model: MODEL,
    input: messages,
  });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: 'tool', name: 'extract_vendor_compliance_status' },
      messages,
      temperature: 0.0, 
    });

    generation.end({
      output: response.content,
      usage: { input: response.usage.input_tokens, output: response.usage.output_tokens }
    });

    const toolUse = response.content.find(block => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Claude returned no tool_use block');

    const result = ComplianceExtractionSchema.safeParse(toolUse.input);
    if (!result.success) {
      console.warn('[Compliance Extractor] Structure Error:', result.error.issues);
      throw new Error('LLM output severely violated structured Zod boundaries');
    }

    trace.update({ metadata: { status: 'success' } });
    await langfuse.flushAsync();

    return { result: result.data, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    trace.update({ metadata: { error: errorMessage, status: 'failed' } });
    await langfuse.flushAsync();
    return { success: false, errorMessage };
  }
}
