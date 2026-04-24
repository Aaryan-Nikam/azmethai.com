/**
 * profile-loader.ts
 *
 * Defines the EmployeeProfile schema and mock storage.
 * This engine allows Mantis to dynamically assume different "Employee" roles
 * (e.g. Legal Assistant vs Financial Analyst), strictly loading only the tools
 * and system prompts appropriate for their industry.
 */

export interface EmployeeProfile {
  id: string; // e.g., 'legal_assistant'
  displayName: string; // e.g., 'Legal Researcher'
  description: string;
  systemPrompt: string; // The core persona and constraints for the LLM
  validatorPrompt?: string; // The decentralized validation rules to self-correct its own work
  allowedTools: string[]; // Strict list of tools this profile can use (e.g., ['browser', 'web_search'])
  riskLevel: 'low' | 'medium' | 'high'; // Defines the strictness of the policy engine
}

const predefinedProfiles: Record<string, EmployeeProfile> = {
  general_employee: {
    id: 'general_employee',
    displayName: 'General Office Assistant',
    description: 'A standard virtual employee with mixed responsibilities.',
    systemPrompt: `You are a capable General Office Assistant.
Your primary role is to help coordinate tasks, search for information, and draft basic materials.
Always ask for clarification if a task seems to exceed your administrative purview.`,
    validatorPrompt: `Review the proposed response. Ensure it is polite, concise, and does not promise any unauthorized actions on behalf of the company.`,
    allowedTools: ['browser', 'web_search'], // safe tools only
    riskLevel: 'low'
  },
  legal_researcher: {
    id: 'legal_researcher',
    displayName: 'Legal Researcher',
    description: 'Expert in extracting and summarizing complex legal precedents from the web.',
    systemPrompt: `You are a meticulous Legal Researcher.
Your primary role is to fetch, read, and summarize legal documents and literature.
Rules:
- You must ALWAYS cite your sources clearly.
- You must NEVER provide binding legal advice or draft final legal instruments without human review.
- Act only as a researcher and assistant, not an attorney.`,
    validatorPrompt: `CRITICAL LEGAL REVIEW: 
1. Check if the response contains binding legal advice. If it does, REJECT it immediately and rewrite it to be purely informational.
2. Check if all factual claims have citations. If they do not, REJECT it and demand citations.`,
    allowedTools: ['web_search', 'browser'], // safe reading tools
    riskLevel: 'medium',
  },
  business_analyst: {
    id: 'business_analyst',
    displayName: 'Business Analyst',
    description: 'Expert in processing data and running analytics commands.',
    systemPrompt: `You are an analytical Business Analyst.
Your role involves fetching external metrics and writing small data crunching scripts.
Double check your calculations before returning results.`,
    validatorPrompt: `Review the proposed output for mathematical inconsistencies. Ensure all numbers sum correctly. If script output was used, verify the script result directly answers the user's prompt without hallucinating extra trends.`,
    allowedTools: ['bash', 'web_search', 'browser'], // Given bash access, making it higher risk
    riskLevel: 'high',
  }
};

/**
 * Loads an employee profile by ID.
 * Future enhancement: Load these dynamically from Supabase.
 */
export function loadEmployeeProfile(profileId: string): EmployeeProfile | null {
  return predefinedProfiles[profileId] || null;
}

/**
 * Lists all available employee profiles for display in the UI/Tool Builder.
 */
export function getAllEmployeeProfiles(): EmployeeProfile[] {
  return Object.values(predefinedProfiles);
}
