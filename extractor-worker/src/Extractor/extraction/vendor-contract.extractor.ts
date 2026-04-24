import Anthropic from '@anthropic-ai/sdk';
import { Langfuse } from 'langfuse';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  CONFIDENCE,
  VendorContractExtractionSchema,
  type VendorContractExtraction,
  type ExtractionResult,
  type FieldRouting,
} from '../validation/vendor-contract.schema.ts';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
});

const MODEL = 'claude-sonnet-4-5';
export const PROMPT_VERSION = 'contract-v1.0.0';

export const SYSTEM_PROMPT = `You are a contract obligation extractor for a compliance monitoring system. Your extractions have financial and legal consequences — missed deadlines cost clients money and create legal exposure.

Before calling the extraction tool, you MUST reason through the document:
1. Identify the document type (vendor contract, SLA agreement, MSA, etc.)
2. Note the document structure and where key clauses appear
3. Flag any ambiguous language where the meaning is unclear
4. Note any fields that are explicitly absent vs. fields you cannot find

For every field:
- Set confidence to 1.0 only when the value is stated explicitly and unambiguously
- Set confidence to 0.7-0.9 when the value is inferable but requires interpretation
- Set confidence to 0.4-0.6 when the clause is present but genuinely ambiguous
- Set confidence to 0.1-0.3 when you are guessing based on context
- Set confidence to 0.0 and field_value to null when the field is absent from the document

For source_text: copy the EXACT verbatim text from the document that supports each field value. Do not paraphrase. If you cannot point to specific text, your confidence is too high.`;

export const extractContractObligationsTool: Anthropic.Tool = {
  name: 'extract_contract_obligations',
  description: 'Extract all payment obligations, SLA commitments, and renewal terms from the contract',
  input_schema: zodToJsonSchema(VendorContractExtractionSchema) as Anthropic.Tool.InputSchema,
};

export interface VendorExtractionLog {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
}

function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  // Conservative estimate; adjust once pricing model is finalized.
  const inputCost = inputTokens * 0.000003;
  const outputCost = outputTokens * 0.000015;
  return inputCost + outputCost;
}

function toRoutingDecision(confidence: number): FieldRouting['decision'] {
  if (confidence >= CONFIDENCE.AUTO_ACCEPT) return 'auto_accept';
  if (confidence >= CONFIDENCE.REVIEW_THRESHOLD) return 'human_review';
  return 'rejected';
}

function buildRouting(extraction: VendorContractExtraction): FieldRouting[] {
  const routes: FieldRouting[] = [];

  for (const [field, value] of Object.entries(extraction)) {
    if (typeof value !== 'object' || value === null) {
      continue;
    }

    const confidence = (value as { confidence?: unknown }).confidence;
    if (typeof confidence !== 'number') {
      continue;
    }

    routes.push({
      field,
      confidence,
      decision: toRoutingDecision(confidence),
      value: (value as { value?: unknown }).value,
    });
  }

  return routes;
}

function buildSummary(
  extraction: VendorContractExtraction,
  routing: FieldRouting[]
): ExtractionResult['summary'] {
  const totalFields = routing.length;
  const autoAccepted = routing.filter((r) => r.decision === 'auto_accept').length;
  const needsReview = routing.filter((r) => r.decision === 'human_review').length;
  const rejected = routing.filter((r) => r.decision === 'rejected').length;
  const overallConfidence = totalFields
    ? routing.reduce((sum, r) => sum + r.confidence, 0) / totalFields
    : 0;
  const criticalAutoRenewalConfidence = extraction.auto_renewal?.confidence ?? 0;

  return {
    total_fields: totalFields,
    auto_accepted: autoAccepted,
    needs_review: needsReview,
    rejected,
    overall_confidence: overallConfidence,
    document_processable: totalFields === 0 ? false : rejected / totalFields <= 0.3,
    critical_auto_renewal_confidence: criticalAutoRenewalConfidence,
  };
}

export async function extractVendorContract(
  contractText: string,
  artifactId: string
): Promise<{ result?: ExtractionResult; log: VendorExtractionLog }> {
  const startedAt = Date.now();
  const trace = langfuse.trace({
    name: 'contract-extraction',
    metadata: { artifactId, version: PROMPT_VERSION },
  });

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Extract all contract obligations from the following document text using the extraction tool.\n\n---\n${contractText}\n---`,
    },
  ];

  const generation = trace.generation({
    name: 'claude-contract-extraction',
    model: MODEL,
    input: messages,
  });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [extractContractObligationsTool],
      tool_choice: { type: 'tool', name: 'extract_contract_obligations' },
      messages,
      temperature: 0.0,
    });

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    generation.end({
      output: response.content,
      usage: { input: inputTokens, output: outputTokens },
    });

    const toolUse = response.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('Claude returned no tool_use block for contract extraction');
    }

    const parsed = VendorContractExtractionSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      throw new Error(`Contract extraction schema validation failed: ${parsed.error.message}`);
    }

    const extraction = parsed.data;
    const routing = buildRouting(extraction);
    const summary = buildSummary(extraction, routing);

    const log: VendorExtractionLog = {
      model: MODEL,
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimateCostUsd(inputTokens, outputTokens),
      durationMs: Date.now() - startedAt,
      success: true,
    };

    trace.update({ metadata: { status: 'success' } });
    await langfuse.flushAsync();

    return {
      result: {
        extraction,
        routing,
        summary,
      },
      log,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    const log: VendorExtractionLog = {
      model: MODEL,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      durationMs: Date.now() - startedAt,
      success: false,
      errorMessage,
    };

    trace.update({ metadata: { status: 'failed', error: errorMessage } });
    await langfuse.flushAsync();

    return { log };
  }
}
