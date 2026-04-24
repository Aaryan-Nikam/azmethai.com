import { Session } from '../types/mantis';
import { ExpertRegistry } from './expert-registry';
import { OrchestratorAgent } from '../orchestrator/orchestrator-agent';
import { ValidatorAgent } from '../validator/validator-agent';
import { streamingManager } from '../streaming/streaming-manager';

export class AgentLoop {
    private orchestrator: OrchestratorAgent;

    constructor(
        expertRegistry: ExpertRegistry,
        validator: ValidatorAgent
    ) {
        // Initialize the orchestrator with the full execution pipeline
        this.orchestrator = new OrchestratorAgent(expertRegistry, validator);
    }

    /**
     * Start the main loop processing for a user session.
     * This loops over incoming goals from the queue, delegates to orchestrator,
     * and replies to the User.
     */
    async start(session: Session) {
        console.log(`[AgentLoop] Starting main execution loop for session ${session.id}`);

        while (true) {
            try {
                const goalMessage = await session.queue.dequeue();
                if (!goalMessage) {
                    // Queue closed or session ended
                    console.log(`[AgentLoop] Queue empty or closed, exiting loop for session ${session.id}`);
                    break;
                }

                const goal = goalMessage.content || goalMessage; // Handle various payload structures

                console.log(`[AgentLoop] Processing new goal: ${goal}`);
                session.currentGoal = goal;

                streamingManager.streamThinking(session.id, `Processing new goal: ${goal}`);

                // Defer to orchestrator to decompose, use experts, validate commits, and publish answers
                await this.orchestrator.handleSession(session, goal);

                streamingManager.streamThinking(session.id, `Finished processing goal.`);
                console.log(`[AgentLoop] Finished processing goal: ${goal}`);
            } catch (err) {
                console.error(`[AgentLoop] Exception in session loop:`, err);
                await session.sendResponse({ success: false, error: 'Agent Loop error encountered.' });
            }
        }
    }
}
