import { isExpertAuthenticated } from './server-expert-auth.js';

/**
 * WebSocket handlers exposed to Expert Interface Dashboard instances, allowing
 * them to authenticate and interact with the review queue.
 */
export const expertWsHandlers = {
    'expert.authenticate': async (payload: any) => {
        const { token } = payload;
        const authenticated = isExpertAuthenticated(token);

        if (!authenticated) {
            throw new Error('Unauthorized: Invalid expert token');
        }

        console.log(`[Expert WS] Authenticated expert successfully.`);
        return { authenticated: true };
    },

    'expert.submitReview': async (payload: any) => {
        const { token, commitId, status, feedback } = payload;

        // Always re-validate token
        if (!isExpertAuthenticated(token)) {
            throw new Error('Unauthorized');
        }

        console.log(`[Expert WS] Received review for commit ${commitId}: ${status}`);

        return {
            success: true,
            commitId,
            status,
            message: 'Review recorded successfully'
        };
    },

    'expert.getQueue': async (payload: any) => {
        const { token } = payload;

        if (!isExpertAuthenticated(token)) {
            throw new Error('Unauthorized');
        }

        console.log(`[Expert WS] Fetching review queue...`);

        return {
            success: true,
            queue: [
                { id: '1', commitId: 'commit_xyz123', type: 'execution', timestamp: Date.now() - 30000 },
                { id: '2', commitId: 'commit_abc987', type: 'research', timestamp: Date.now() - 10000 }
            ]
        };
    }
};
