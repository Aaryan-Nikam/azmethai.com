// packages/extractor/src/extraction/confidence-router.ts

export type ConfidenceRoutingDecision =
  | { action: 'auto_accept' }
  | { action: 'human_review'; low_confidence_fields: string[] }
  | { action: 'reject'; reason: string };

export function routeByConfidence(
  fields: Array<{ field_name: string; confidence: number }>,
  jobId: string
): ConfidenceRoutingDecision {
  const lowFields = fields.filter(f => f.confidence < 0.5);
  const reviewFields = fields.filter(
    f => f.confidence >= 0.5 && f.confidence < 0.85
  );
  const criticalFields = ['payment_due_date', 'total_amount_due', 'notice_period_days'];

  // Any critical field below 0.5 = immediate reject
  const criticalLow = lowFields.filter(f => criticalFields.includes(f.field_name));
  if (criticalLow.length > 0) {
    return {
      action: 'reject',
      reason: `Critical fields extracted with low confidence: ${
        criticalLow.map(f => `${f.field_name} (${f.confidence.toFixed(2)})`).join(', ')
      }. Document requires manual entry.`
    };
  }

  // Any non-critical field below 0.5 = human review
  // or any field in the 0.5 to 0.84 range
  if (lowFields.length > 0 || reviewFields.length > 0) {
    return {
      action: 'human_review',
      low_confidence_fields: [...lowFields, ...reviewFields].map(f => f.field_name)
    };
  }

  // All fields at or above 0.85 = auto accept
  return { action: 'auto_accept' };
}
