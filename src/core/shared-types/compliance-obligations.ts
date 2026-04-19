// packages/shared-types/src/compliance-obligations.ts

export const COMPLIANCE_OBLIGATIONS_VERSION = '1.0.0';

export interface ComplianceObligations {
  version: typeof COMPLIANCE_OBLIGATIONS_VERSION;
  artifactId: string;
  tenantId: string;
  vendorName: string;
  extractedAt: string; // ISO timestamp
  
  // Security Audits
  soc2ValidUntil: string | null; // ISO Date YYYY-MM-DD
  iso27001ValidUntil: string | null; // ISO Date YYYY-MM-DD
  
  // Insurance Constraints
  insuranceCoverageAmount: number | null;
  insuranceCurrency: string;
  insuranceValidUntil: string | null; // ISO Date
  
  // Privacy
  dpaActive: boolean;
}

export function assertComplianceObligationsVersion(
  obj: unknown
): asserts obj is ComplianceObligations {
  const version = (obj as ComplianceObligations)?.version;
  if (version !== COMPLIANCE_OBLIGATIONS_VERSION) {
    throw new Error(
      `ComplianceObligations version mismatch: expected ${COMPLIANCE_OBLIGATIONS_VERSION}, got ${version}`
    );
  }
}
