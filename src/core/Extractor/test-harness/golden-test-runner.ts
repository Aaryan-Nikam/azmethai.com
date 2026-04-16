// packages/extractor/src/test-harness/golden-test-runner.ts
import { Langfuse } from 'langfuse';

interface GoldenDocument {
  path: string;
  doc_type: 'vendor_contract' | 'invoice';
  expected: Record<string, unknown>; // Verified ground truth values
  tolerance?: Record<string, number>; // Per-field tolerance for numeric values
}

interface FieldResult {
  field: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
}

// Mock function representing the extraction call - in a real environment this connects to actual LLM call
async function runExtraction(path: string, doc_type: string): Promise<Record<string, { value: unknown } | unknown>> {
  // Mock logic - should be wired to the correct file extraction module.
  return {};
}

function isMatch(field: string, actualValue: unknown, expectedValue: unknown, tolerance?: Record<string, number>): boolean {
  if (actualValue === expectedValue) return true;
  if (typeof actualValue === 'number' && typeof expectedValue === 'number') {
    const tol = tolerance?.[field] ?? 0;
    return Math.abs(actualValue - expectedValue) <= tol;
  }
  return false;
}

export async function runGoldenTests(documents: GoldenDocument[]): Promise<void> {
  const results: FieldResult[] = [];

  for (const doc of documents) {
    const extraction = await runExtraction(doc.path, doc.doc_type);
    for (const [field, expectedValue] of Object.entries(doc.expected)) {
      const actualValue = (extraction[field] as any)?.value ?? extraction[field];
      const passed = isMatch(field, actualValue, expectedValue, doc.tolerance);
      results.push({ field, passed, expected: expectedValue, actual: actualValue });
    }
  }

  if (results.length === 0) {
    console.log(`Golden Test Runner: No fields evaluated.`);
    return;
  }

  const langfuse = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com'
  });

  const overall = results.filter(r => r.passed).length / results.length;
  const criticalFields = results.filter(r =>
    ['payment_due_date', 'total_amount_due', 'notice_period_days'].includes(r.field)
  );
  
  const criticalAccuracy =
    criticalFields.length > 0 
      ? criticalFields.filter(r => r.passed).length / criticalFields.length 
      : 1.0;

  console.log(`Overall accuracy: ${(overall * 100).toFixed(1)}%`);
  console.log(`Critical field accuracy: ${(criticalAccuracy * 100).toFixed(1)}%`);

  await langfuse.score({
    name: "golden_test_deployment_accuracy",
    value: overall, 
    comment: "Pre-deployment pipeline regression evaluation"
  });

  await langfuse.score({
    name: "golden_test_critical_field_accuracy",
    value: criticalAccuracy, 
    comment: "Pre-deployment strict evaluation of financial obligations"
  });

  await langfuse.flushAsync();

  if (overall < 0.90) {
    throw new Error(`DEPLOYMENT BLOCKED: Overall accuracy ${(overall * 100).toFixed(1)}% < 90% threshold`);
  }
  if (criticalAccuracy < 0.95) {
    throw new Error(`DEPLOYMENT BLOCKED: Critical field accuracy ${(criticalAccuracy * 100).toFixed(1)}% < 95% threshold`);
  }
}

