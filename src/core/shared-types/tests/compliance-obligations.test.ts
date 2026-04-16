// packages/shared-types/src/tests/compliance-obligations.test.ts

import { describe, it, expect } from 'vitest';
import { 
  ComplianceObligations, 
  COMPLIANCE_OBLIGATIONS_VERSION, 
  assertComplianceObligationsVersion 
} from '../compliance-obligations.ts';

describe('assertComplianceObligationsVersion', () => {
  it('passes silently when version matches exactly', () => {
    const validPayload: ComplianceObligations = {
      version: COMPLIANCE_OBLIGATIONS_VERSION,
      artifactId: 'art-123',
      tenantId: 'tenant-123',
      vendorName: 'AWS',
      extractedAt: new Date().toISOString(),
      soc2ValidUntil: '2025-12-31',
      iso27001ValidUntil: null,
      insuranceCoverageAmount: 5000000,
      insuranceCurrency: 'USD',
      insuranceValidUntil: '2026-01-01',
      dpaActive: true
    };

    expect(() => assertComplianceObligationsVersion(validPayload)).not.toThrow();
  });

  it('throws loudly when version mismatches', () => {
    const invalidPayload = {
      version: '0.9.0', // Mismatch
      artifactId: 'art-123',
    };

    expect(() => assertComplianceObligationsVersion(invalidPayload)).toThrow(
      /ComplianceObligations version mismatch: expected 1\.0\.0, got 0\.9\.0/
    );
  });

  it('throws loudly when version is missing entirely', () => {
    const missingPayload = {
      artifactId: 'art-123',
    };

    expect(() => assertComplianceObligationsVersion(missingPayload)).toThrow(
      /ComplianceObligations version mismatch: expected 1\.0\.0, got undefined/
    );
  });
});
