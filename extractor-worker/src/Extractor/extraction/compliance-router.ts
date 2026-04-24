// packages/extractor/src/extraction/compliance-router.ts

import type { ComplianceExtraction } from '../validation/compliance.schema.ts';

export type ComplianceRoutingDecision =
  | { action: 'auto_accept' }
  | { action: 'human_review'; low_confidence_fields: string[] }
  | { action: 'reject'; reason: string };

type ConfidenceField = { confidence: number };

function hasNumericConfidence(value: unknown): value is ConfidenceField {
  return (
    typeof value === 'object' &&
    value !== null &&
    'confidence' in value &&
    typeof (value as ConfidenceField).confidence === 'number'
  );
}

export function routeComplianceByConfidence(
  extraction: ComplianceExtraction
): ComplianceRoutingDecision {
  const fields = Object.entries(extraction).flatMap(([field_name, value]) => {
    if (!hasNumericConfidence(value)) {
      return [];
    }

    return [{ field_name, confidence: value.confidence }];
  });

  const lowFields = fields.filter(f => f.confidence < 0.5);
  const reviewFields = fields.filter(
    f => f.confidence >= 0.5 && f.confidence < 0.85
  );
  
  // Expiry dates and limits are highly critical for avoiding security exposure
  const criticalFields = ['soc2_expiry_date', 'cyber_insurance_limit_gbp', 'iso27001_expiry_date'];

  // Reject strictly on Critical field failures
  const criticalLow = lowFields.filter(f => criticalFields.includes(f.field_name));
  if (criticalLow.length > 0) {
    return {
      action: 'reject',
      reason: `Critical compliance matrices extracted beneath verifiable certainty thresholds: ${
        criticalLow.map(f => `${f.field_name} (${f.confidence.toFixed(2)})`).join(', ')
      }. Cannot derive zero-trust bounds automatically. Human parsing required.`
    };
  }

  // Trigger Human check on marginally low bounds
  if (lowFields.length > 0 || reviewFields.length > 0) {
    return {
      action: 'human_review',
      low_confidence_fields: [...lowFields, ...reviewFields].map(f => f.field_name)
    };
  }

  // Pure LLM deterministic certainty
  return { action: 'auto_accept' };
}
