/**
 * intent-classifier.ts
 * Classifies incoming messages into 8 intent types using GPT-4o-mini.
 * Includes context_window (last 3 messages) for accuracy.
 * Target: < 400ms. Simple in-memory dedup cache.
 */

export const INTENT_TYPES = [
  'PRICING_INQUIRY',
  'DEMO_REQUEST',
  'DISCOVERY_CALL',
  'OBJECTION',
  'CLOSING',
  'SUPPORT',
  'COLD_RESPONSE',
  'UNKNOWN',
] as const;

export type IntentType = typeof INTENT_TYPES[number];

export interface ClassificationResult {
  intent: IntentType;
  confidence: number;
  reasoning?: string;
}

// Simple in-process cache (survives within the same Node.js process warm instance)
const cache = new Map<string, ClassificationResult>();

const CLASSIFIER_PROMPT = `You are an intent classifier for a B2B sales AI system.
Classify the message into EXACTLY ONE of these intent types:

- PRICING_INQUIRY: Asking about pricing, cost, packages, plans
- DEMO_REQUEST: Wants to see the product, schedule a demo, see a walkthrough
- DISCOVERY_CALL: Wants to talk, learn more, explore fit, general interest
- OBJECTION: Pushback, "too expensive", "not right now", "already have a solution", "not interested"
- CLOSING: Ready to buy, asking about next steps, contracts, onboarding
- SUPPORT: Has a problem, bug report, needs help with existing product
- COLD_RESPONSE: First reply to an outbound message, generic acknowledgment, "who are you", "how did you get my contact"
- UNKNOWN: Cannot be classified confidently into any above category

Respond with ONLY valid JSON: { "intent": "INTENT_TYPE", "confidence": 0.0-1.0 }`;

export async function classifyIntent(
  message: string,
  contextWindow: string[] = []
): Promise<ClassificationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { intent: 'UNKNOWN', confidence: 0 };
  }

  // Cache key includes message + last 2 context messages
  const cacheKey = [message, ...contextWindow.slice(-2)].join('|||');
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // Build user content with context
  const contextText = contextWindow.length > 0
    ? `Previous messages:\n${contextWindow.slice(-3).map((m, i) => `[${i + 1}] ${m}`).join('\n')}\n\nCurrent message: ${message}`
    : message;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: CLASSIFIER_PROMPT },
          { role: 'user', content: contextText },
        ],
        max_tokens: 60,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      return { intent: 'UNKNOWN', confidence: 0 };
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    // Validate intent type
    const intent = INTENT_TYPES.includes(parsed.intent) ? parsed.intent : 'UNKNOWN';
    const result: ClassificationResult = {
      intent,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
    };

    // Cache for this process lifetime (cap at 10k entries)
    if (cache.size > 10000) cache.clear();
    cache.set(cacheKey, result);

    return result;
  } catch {
    return { intent: 'UNKNOWN', confidence: 0 };
  }
}
