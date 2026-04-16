import Anthropic from '@anthropic-ai/sdk';
import { Langfuse } from 'langfuse';

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
  input_schema: {
    type: 'object',
    properties: {
      reasoning: {
        type: 'string',
        description: 'Your chain-of-thought analysis before extracting. Required.'
      },
      base_monthly_price: {
        type: 'object',
        properties: {
          value: { type: 'number' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          source_text: { type: 'string' },
          source_page: { type: 'integer' }
        },
        required: ['value', 'confidence', 'source_text']
      },
      price_escalation_trigger_pct: {
        type: 'object',
        properties: {
          value: { type: 'number' },
          confidence: { type: 'number' },
          source_text: { type: 'string' },
          source_page: { type: 'integer' }
        }
      },
      sla_uptime_target_pct: {
        type: 'object',
        properties: {
          value: { type: 'number' },
          confidence: { type: 'number' },
          source_text: { type: 'string' },
          source_page: { type: 'integer' }
        }
      },
      sla_uptime_tiers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            min_uptime_pct: { type: 'number' },
            max_uptime_pct: { type: 'number' },
            credit_pct: { type: 'number' },
            confidence: { type: 'number' },
            source_text: { type: 'string' }
          }
        }
      },
      sla_credit_window_days: {
        type: 'object',
        properties: {
          value: { type: 'integer' },
          confidence: { type: 'number' },
          source_text: { type: 'string' },
          source_page: { type: 'integer' }
        }
      },
      payment_terms_days: {
        type: 'object',
        properties: {
          value: { type: 'integer' },
          confidence: { type: 'number' },
          source_text: { type: 'string' },
          source_page: { type: 'integer' }
        }
      },
      notice_period_days: {
        type: 'object',
        properties: {
          value: { type: 'integer' },
          confidence: { type: 'number' },
          source_text: { type: 'string' },
          source_page: { type: 'integer' }
        }
      },
      auto_renewal_clause: {
        type: 'object',
        properties: {
          value: { type: 'boolean' },
          confidence: { type: 'number' },
          source_text: { type: 'string' },
          source_page: { type: 'integer' }
        }
      },
      contract_end_date: {
        type: 'object',
        properties: {
          value: { type: 'string', description: 'ISO date YYYY-MM-DD' },
          confidence: { type: 'number' },
          source_text: { type: 'string' },
          source_page: { type: 'integer' }
        }
      },
      counterparty_name: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          confidence: { type: 'number' },
          source_text: { type: 'string' },
          source_page: { type: 'integer' }
        }
      }
    },
    required: ['reasoning']
  }
};
