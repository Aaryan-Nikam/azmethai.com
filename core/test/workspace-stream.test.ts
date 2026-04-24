import { describe, it, expect, vi } from 'vitest';
import { streamingManager } from '../src/streaming/streaming-manager';

describe('Streaming Manager', () => {
    it('registers and unregisters connections cleanly', () => {
        const mockWs = { send: vi.fn(), readyState: 1 } as any;

        streamingManager.registerConnection('conn-1', 'session-1', mockWs);
        streamingManager.streamThinking('session-1', 'Test reasoning');

        expect(mockWs.send).toHaveBeenCalled();
        const payload = JSON.parse(mockWs.send.mock.calls[0][0]);
        expect(payload.type).toBe('thinking');
        expect(payload.data.thought).toBe('Test reasoning');

        streamingManager.unregisterConnection('conn-1', 'session-1');
        streamingManager.streamThinking('session-1', 'Test reasoning 2');
        expect(mockWs.send).toHaveBeenCalledTimes(1); // Should not have been called a second time
    });
});
