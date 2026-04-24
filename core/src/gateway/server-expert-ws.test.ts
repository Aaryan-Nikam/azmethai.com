import { describe, it, expect } from 'vitest';
import { expertWsHandlers } from '../../src/gateway/server-expert-ws';

describe('Expert WebSocket Handlers', () => {
    it('successfully authenticates with a valid token', async () => {
        const payload = { token: 'expert-secret-token-123' };
        const result = await expertWsHandlers['expert.authenticate'](payload);
        expect(result.authenticated).toBe(true);
    });

    it('throws error for invalid token on authenticate', async () => {
        const payload = { token: 'invalid-token' };
        await expect(expertWsHandlers['expert.authenticate'](payload)).rejects.toThrow('Unauthorized');
    });

    it('submits a review for a commit', async () => {
        const payload = { token: 'mantis-super-expert-token', commitId: 'commit_test1', status: 'approved' };
        const result = await expertWsHandlers['expert.submitReview'](payload);

        expect(result.success).toBe(true);
        expect(result.commitId).toBe('commit_test1');
        expect(result.status).toBe('approved');
    });

    it('fetches the expert review queue', async () => {
        const payload = { token: 'growth-expert-token-abc' };
        const result = await expertWsHandlers['expert.getQueue'](payload);

        expect(result.success).toBe(true);
        expect(result.queue).toBeDefined();
        expect(result.queue.length).toBeGreaterThan(0);
    });
});
