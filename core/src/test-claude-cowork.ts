import { OrchestratorAgent } from './orchestrator/orchestrator-agent';
import { ExpertRegistry } from './agents/expert-registry';
import { ValidatorAgent } from './validator/validator-agent';
import { Session } from './types/mantis';
import { workspaceStore } from './memory/workspace-store';

async function verifyCoworkArchitecture() {
    console.log('\n=========================================================');
    console.log('🦾 Mantis AI Agent - "CLAUDE COWORK" ARCHITECTURE TEST');
    console.log('=========================================================\n');

    // Initialize the core pipeline
    const expertRegistry = new ExpertRegistry();
    const validator = new ValidatorAgent('dummy-key');
    // Mock the validate method to avoid making actual Anthropic API calls during the local test
    validator.validate = async (commit) => {
        console.log(`[Validator Mock] Automatically approving commit ${commit.commitId}`);
        return { valid: true };
    };
    const orchestrator = new OrchestratorAgent(expertRegistry, validator);

    // Mock a collaborative workspace session
    const coworkSession: Session = {
        id: `workspace_${Date.now()}`,
        tenantId: 'tenant_azmeth',
        verifiedContext: {
            publish: async (commit) => console.log(`➡️  [VerifiedContext] Pushed approved commit to memory ledger.`)
        },
        sendResponse: async (res) => console.log(`\n💬 [Agent Chat UI -> User]: ${res.message}\n`)
    } as any;

    const goal = "Draft a Master Services Agreement and flag compliance risks before finalizing.";
    
    // Trigger the Orchestrator loop
    await orchestrator.handleSession(coworkSession, goal);

    console.log(`\n=========================================================`);
    console.log(`📂 FINAL WORKSPACE ARTIFACT STATE FOR SESSION: ${coworkSession.id}`);
    console.log(`=========================================================\n`);
    
    console.log(workspaceStore.formatWorkspaceForPrompt(coworkSession.id));
}

verifyCoworkArchitecture().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
