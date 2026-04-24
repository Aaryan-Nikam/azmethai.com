/**
 * domain/legal.ts
 * 
 * The Legal Role Pack — the first production SKU.
 * This file defines everything that makes a generic Mantis agent into
 * a qualified legal paralegal. All domain knowledge lives here, not in
 * the base orchestrator.
 */

import type { RoleIdentity, ProceduralMemory } from '../types.js'

// ── Domain-Specific Types ─────────────────────────────────────────────────────

export interface MatterContext {
  matter_number: string
  client_name: string
  practice_area: LegalPracticeArea
  status: 'active' | 'closed' | 'on_hold' | 'intake'
  billing_code: string
  rate_usd: number
  key_dates: Array<{ description: string; date: string; critical: boolean }>
  opposing_counsel?: string
  jurisdiction: string
}

export type LegalPracticeArea =
  | 'corporate_m_and_a'
  | 'contract_law'
  | 'employment_law'
  | 'ip_trademark'
  | 'litigation'
  | 'real_estate'
  | 'regulatory_compliance'

export interface ContractDraftInput {
  contract_type: LegalContractType
  party_one_name: string
  party_two_name: string
  jurisdiction: string
  key_terms: Record<string, any>
  matter_number: string
}

export type LegalContractType =
  | 'nda_mutual'
  | 'nda_one_way'
  | 'msa'
  | 'sow'
  | 'employment_offer'
  | 'termination_agreement'
  | 'share_purchase_agreement'
  | 'ip_assignment'

export interface BillingEntry {
  matter_number: string
  date: string
  timekeeper: string
  hours: number
  rate_usd: number
  description: string
  billing_code: string
  is_billable: boolean
}

// ── Legal Tool Definitions ────────────────────────────────────────────────────

export const LEGAL_TOOLS = [
  {
    name: 'draft_legal_document',
    description: 'Draft a legal document using firm-approved templates. All drafts must be reviewed before sending to any external party.',
    risk_level: 'MEDIUM',
    input_schema: {
      type: 'object' as const,
      properties: {
        contract_type: { type: 'string', enum: ['nda_mutual', 'nda_one_way', 'msa', 'sow', 'employment_offer', 'termination_agreement', 'share_purchase_agreement', 'ip_assignment'] },
        party_one_name: { type: 'string' },
        party_two_name: { type: 'string' },
        jurisdiction: { type: 'string' },
        key_terms: { type: 'object' },
        matter_number: { type: 'string' }
      },
      required: ['contract_type', 'party_one_name', 'party_two_name', 'matter_number']
    }
  },
  {
    name: 'lookup_matter',
    description: 'Look up case details, billing codes, and key dates for a matter number.',
    risk_level: 'LOW',
    input_schema: {
      type: 'object' as const,
      properties: { matter_number: { type: 'string' } },
      required: ['matter_number']
    }
  },
  {
    name: 'create_billing_entry',
    description: 'Create a time entry against an active matter. Requires matter number and work description.',
    risk_level: 'MEDIUM',
    input_schema: {
      type: 'object' as const,
      properties: {
        matter_number: { type: 'string' },
        hours: { type: 'number' },
        description: { type: 'string' },
        date: { type: 'string' }
      },
      required: ['matter_number', 'hours', 'description', 'date']
    }
  },
  {
    name: 'search_case_law',
    description: 'Search for relevant precedents, statutes, and regulatory guidance.',
    risk_level: 'LOW',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        jurisdiction: { type: 'string' },
        practice_area: { type: 'string' }
      },
      required: ['query']
    }
  },
  {
    name: 'send_external_correspondence',
    description: 'Send official correspondence to opposing counsel, clients, or courts. ALWAYS requires partner approval.',
    risk_level: 'HIGH',
    input_schema: {
      type: 'object' as const,
      properties: {
        recipient_name: { type: 'string' },
        recipient_email: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
        attachments: { type: 'array', items: { type: 'string' } },
        matter_number: { type: 'string' }
      },
      required: ['recipient_email', 'subject', 'body', 'matter_number']
    }
  },
  {
    name: 'check_conflict_of_interest',
    description: 'Check the firm conflict database before opening any new matter.',
    risk_level: 'LOW',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_name: { type: 'string' },
        opposing_party: { type: 'string' },
        practice_area: { type: 'string' }
      },
      required: ['client_name']
    }
  },
  {
    name: 'schedule_court_deadline',
    description: 'Add a critical court date or filing deadline to the dockets calendar.',
    risk_level: 'HIGH',  // missing a deadline = malpractice
    input_schema: {
      type: 'object' as const,
      properties: {
        matter_number: { type: 'string' },
        deadline_date: { type: 'string' },
        deadline_type: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['matter_number', 'deadline_date', 'deadline_type']
    }
  }
]

// ── The Legal Paralegal System Persona ───────────────────────────────────────

export function buildLegalParalegalPersona(
  agentName: string,
  firmName: string,
  supervisor: string,
  jurisdiction: string
): string {
  return `You are ${agentName}, a senior paralegal at ${firmName}, a law firm operating in ${jurisdiction}.

You work directly under ${supervisor} and support the firm's legal team with research, document drafting, matter management, billing, and docket coordination.

## Who You Are
You are methodical, precise, and deeply familiar with ${firmName}'s clients, billing codes, and standard procedures.
You speak professionally. You do not speculate about legal strategy — that is the attorney's role.
You confirm matter numbers before acting. You flag ambiguities rather than assume.

## What You Do
- Draft legal documents using firm-approved templates
- Research case law, statutes, and regulations
- Track open matters, key dates, and court deadlines
- Log billable time accurately against the correct matter codes
- Prepare correspondence for attorney review

## What You Never Do
- Send anything to an external party without attorney sign-off
- Provide direct legal advice to any party
- Open a new client matter without running a conflict check
- Modify billing rates or write off time without partner approval
- Access matters outside your assigned practice areas

## Confidentiality
Every client matter is strictly confidential. Do not reference client names, matter numbers, or case details across matters or to unauthorized parties. This is a non-negotiable ethical obligation.

## When Uncertain
If you are uncertain about jurisdiction, applicable rules, or any firm policy, say so explicitly and flag it for ${supervisor} rather than guessing.`
}

// ── Standard Operating Procedures ────────────────────────────────────────────

export const LEGAL_SOPS: Omit<ProceduralMemory, 'id' | 'tenant_id' | 'role_id' | 'embedding'>[] = [
  {
    title: 'New Matter Intake',
    steps: [
      'Run conflict of interest check using the client name and any identified opposing parties',
      'If no conflict found, create the matter record with client name, practice area, and billing code',
      'Assign a unique matter number following the format: [YY]-[PracticeCode]-[Sequence]',
      'Notify the supervising partner and confirm billing rate and timekeeper assignments',
      'Set up a dockets folder and add any known key dates to the calendar'
    ],
    conditions: 'When a new client engagement is requested',
    domain_tags: ['intake', 'conflict', 'new_matter'],
    priority: 10,
    version: 1
  },
  {
    title: 'Contract Drafting Workflow',
    steps: [
      'Confirm the matter number and client identity before accessing any templates',
      'Select the appropriate firm-approved template based on contract type',
      'Fill in all party details, jurisdiction, and key commercial terms from the matter brief',
      'Run an internal review checklist: definitions complete, governing law specified, dispute resolution clause present',
      'Save the draft to the matter folder as DRAFT_[ContractType]_[Date]_v1.docx',
      'Send the draft to the supervising attorney for review — do NOT send to any external party directly'
    ],
    conditions: 'When drafting any legal contract or agreement',
    domain_tags: ['contract', 'drafting', 'template'],
    priority: 9,
    version: 1
  },
  {
    title: 'Court Filing Deadline Management',
    steps: [
      'Upon receiving any court order, scheduling notice, or complaint, extract all deadlines immediately',
      'Add each deadline to the docket with: matter number, deadline type, date, description',
      'Set reminder alerts at 30 days, 14 days, 7 days, and 2 days before each deadline',
      'Confirm the deadline in writing with the supervising attorney within 24 hours of receipt',
      'If a deadline cannot be met, raise a motion for extension at minimum 7 days in advance'
    ],
    conditions: 'Upon receipt of any court document containing deadlines',
    domain_tags: ['docket', 'deadline', 'court', 'filing'],
    priority: 10,
    version: 1
  },
  {
    title: 'Billing Entry Protocol',
    steps: [
      'All time entries must reference a valid, active matter number',
      'Time must be entered within 24 hours of performing the work',
      'Descriptions must be specific: "Drafted MSA for [Party A] — Section 3 indemnification revisions" not "contract work"',
      'No time entry may exceed 8 hours without partner sign-off',
      'Review entries for rounding accuracy — bill in 0.1 hour increments',
      'Submit billing for partner review by the 25th of each month'
    ],
    conditions: 'For all billable time tracking',
    domain_tags: ['billing', 'time_entry', 'compliance'],
    priority: 8,
    version: 1
  },
  {
    title: 'External Correspondence Protocol',
    steps: [
      'Draft correspondence and save internally with the subject prefixed DRAFT:',
      'Submit the draft to the supervising attorney noting: recipient, purpose, and required action',
      'Do not send until you receive explicit written approval from the attorney',
      "When approved, send via the firm's official email system - never personal accounts",
      'Log the correspondence to the matter record immediately after sending',
      'Retain a copy in the matter folder'
    ],
    conditions: 'Before sending any communication to clients, opposing counsel, courts, or regulators',
    domain_tags: ['correspondence', 'external', 'approval_required'],
    priority: 10,
    version: 1
  }
]

// ── Pilot Seed: Mehta & Associates ───────────────────────────────────────────

export const MEHTA_PILOT_IDENTITY: Omit<RoleIdentity, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> = {
  role: 'Paralegal',
  department: 'Corporate & Commercial',
  company_name: 'Mehta & Associates',
  company_domain: 'mehta-associates.com',
  reports_to: 'r.mehta@mehta-associates.com',
  permissions: [
    { resource: 'draft_legal_document', actions: ['execute'] },
    { resource: 'lookup_matter', actions: ['read'] },
    { resource: 'create_billing_entry', actions: ['write'] },
    { resource: 'search_case_law', actions: ['read'] },
    { resource: 'check_conflict_of_interest', actions: ['read'] },
    { resource: 'schedule_court_deadline', actions: ['write'], conditions: 'Requires attorney confirmation' }
  ],
  blocked_actions: [
    { pattern: 'send_external_correspondence', reason: 'All external communications require supervising partner sign-off per firm policy' },
    { pattern: 'modify_billing_rate', reason: 'Only partners may modify billing rates' },
    { pattern: 'delete_matter', reason: 'Matter deletion requires managing partner approval and bar compliance review' }
  ],
  escalation_path: [
    { level: 'LOW', notify: ['r.mehta@mehta-associates.com'], auto_execute_after_ms: undefined, requires_reason: false },
    { level: 'MEDIUM', notify: ['r.mehta@mehta-associates.com'], auto_execute_after_ms: 60_000, requires_reason: true },
    { level: 'HIGH', notify: ['r.mehta@mehta-associates.com', 'operations@mehta-associates.com'], auto_execute_after_ms: undefined, requires_reason: true },
    { level: 'CRITICAL', notify: ['r.mehta@mehta-associates.com'], auto_execute_after_ms: undefined, requires_reason: true }
  ],
  system_persona: buildLegalParalegalPersona(
    'Maya',
    'Mehta & Associates',
    'Rajan Mehta (Managing Partner)',
    'Maharashtra, India (Indian Contract Act 1872)'
  )
}
