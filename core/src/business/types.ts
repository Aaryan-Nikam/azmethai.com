export interface RoleIdentity {
  id: string
  tenant_id: string
  role: string
  department: string
  company_name: string
  company_domain: string
  reports_to: string
  permissions: Permission[]
  blocked_actions: BlockedAction[]
  escalation_path: EscalationTier[]
  system_persona: string
  created_at: Date
  updated_at: Date
}

export interface EscalationTier {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  notify: string[]
  auto_execute_after_ms?: number   // undefined = block until explicit approval
  requires_reason: boolean
}

export interface Permission {
  resource: string
  actions: ('read' | 'write' | 'delete' | 'share' | 'execute')[]
  conditions?: string
}

export interface BlockedAction {
  pattern: string
  reason: string
}

export interface EpisodicMemory {
  id: string
  role_id: string
  tenant_id: string
  session_id: string
  summary: string
  key_decisions: string[]
  tasks_completed: string[]
  tasks_pending: string[]
  entities_involved: string[]
  embedding?: number[]
  importance_score: number
  created_at: Date
  compressed_at?: Date
}

export interface SemanticMemory {
  id: string
  role_id: string
  tenant_id: string
  subject: string
  predicate: string
  object: string
  confidence: number
  embedding?: number[]
  source: 'sop_ingest' | 'episode_extract' | 'explicit_input'
  last_verified_at: Date
}

export interface ProceduralMemory {
  id: string
  role_id: string
  tenant_id: string
  title: string
  steps: string[]
  conditions?: string
  domain_tags: string[]
  embedding?: number[]
  priority: number
  version: number
}

export interface WorkingMemory {
  id: string
  role_id: string
  tenant_id: string
  session_id: string
  task_description?: string
  current_step?: string
  steps_completed: string[]
  steps_remaining: string[]
  artifacts: Record<string, any>
  pending_approvals: string[]
  checkpoint_at: Date
  status: 'active' | 'awaiting_approval' | 'completed' | 'failed'
}

export interface AssembledContext {
  system_prompt: string
  working_memory: WorkingMemory | null
  retrieved_memories: (EpisodicMemory | SemanticMemory)[]
  procedures: ProceduralMemory[]
  token_estimate: number
}

export interface TurnInput {
  roleId: string
  tenantId: string
  sessionId: string
  message: string
  channelMeta: Record<string, any>
}

export interface TurnOutput {
  reply: string
  artifacts: Record<string, any>
  approval_required: PendingApproval | null
  session_status: string
}

export interface AgentLoopResult {
  reply: string
  artifacts: Record<string, any>
  pendingApproval: PendingApproval | null
  status: 'completed' | 'awaiting_approval'
}

export interface PendingApproval {
  approval_id: string
  tool: string
  input: any
  reason: string
}

export interface RiskClassification {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reason: string
  auto_execute_after_ms?: number
  governance_result?: GovernanceResult
}

export interface DataMaskingResult {
  masked: boolean
  data: any
  tokens?: string[]
  policy?: string
  appliedRules?: string[]
  error?: string
}

export interface GovernanceResult {
  approved: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reason: string
  requiredApprovals: string[]
  maskingRequired: boolean
  policyId?: string
  policyName?: string
  auditLog?: any
}
