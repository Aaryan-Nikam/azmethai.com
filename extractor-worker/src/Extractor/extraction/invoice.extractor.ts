import Anthropic from '@anthropic-ai/sdk';
import { Langfuse } from 'langfuse';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { InvoiceExtractionSchema, InvoiceExtraction } from '../validation/invoice.schema.ts';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com'
});

const MODEL = 'claude-sonnet-4-5';
const SYSTEM_PROMPT = `You are a strict, highly accurate financial extraction AI acting for a large enterprise. 
Your job is to read raw OCR text from a vendor invoice and extract structured financial data exactly matching the provided schema.
Pay extremely close attention to the billing periods, any line items that represent credits or discounts (these are vital for SLA reconciliation), and the final total amount.
DO NOT hallucinate data. If a field like billing period is completely missing, return null. Always use the extraction tool to return your result.`;

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: 'extract_vendor_invoice_data',
  description: 'Extracts structured data from a vendor invoice.',
  input_schema: zodToJsonSchema(InvoiceExtractionSchema) as Anthropic.Tool.InputSchema,
};

export async function extractInvoiceData(
  invoiceText: string,
  invoiceId: string,
): Promise<{ result?: InvoiceExtraction; success: boolean; errorMessage?: string }> {
  const trace = langfuse.trace({
    name: 'invoice-extraction',
    metadata: { invoiceId }
  });

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Please analyse the following vendor invoice and extract all data using the extraction tool. Focus carefully on credits and billing periods. \n\nINVOICE TEXT:\n---\n${invoiceText}\n---`,
    },
  ];

  const generation = trace.generation({
    name: 'claude-invoice-extraction',
    model: MODEL,
    input: messages,
  });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: 'tool', name: 'extract_vendor_invoice_data' },
      messages,
      temperature: 0.0, // High determinism for financial data
    });

    generation.end({
      output: response.content,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens
      }
    });

    const toolUse = response.content.find(block => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('Claude returned no tool_use block');
    }

    const rawExtraction = toolUse.input;
    const parsed = InvoiceExtractionSchema.safeParse(rawExtraction);
    
    if (!parsed.success) {
      console.warn('[Invoice Extractor] Validation error:', JSON.stringify(parsed.error.issues));
    }

    trace.update({ metadata: { status: 'success' } });
    await langfuse.flushAsync();

    return {
      result: rawExtraction as InvoiceExtraction,
      success: true
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    trace.update({ metadata: { error: errorMessage, status: 'failed' } });
    await langfuse.flushAsync();
    
    return { success: false, errorMessage };
  }
}
