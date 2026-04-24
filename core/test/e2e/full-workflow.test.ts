import { describe, it, expect } from 'vitest';
import { taskRouter } from '../../src/routing/task-router';

describe('Fast Path E2E Workflow', () => {
    it('categorizes a simple task appropriately', async () => {
        // Since we dummy out the anthropic key in tests, it falls back to string length check
        const result = await taskRouter.route('short string');
        expect(result).toBe('simple');
    });

    it('categorizes a complex task appropriately', async () => {
        const longString = new Array(100).fill('word').join(' ');
        const result = await taskRouter.route(longString);
        expect(result).toBe('complex');
    });
});
