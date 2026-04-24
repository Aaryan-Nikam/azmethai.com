export class ErrorHandler {

    /**
     * Executes a function with automatic retries for known transient errors.
     * @param operation The function to execute
     * @param maxRetries Maximum number of retries
     * @param delayMs Delay between retries
     * @param silent If true, errors are swallowed after retries exhaust, otherwise rethrown.
     */
    static async withRetry<T>(
        operation: () => Promise<T>,
        maxRetries = 3,
        delayMs = 1000,
        silent = false
    ): Promise<T | null> {
        let lastError: any;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (err: any) {
                lastError = err;

                // Check if it's a known transient error (rate limit, timeout, network glitch)
                const isTransient =
                    err.status === 429 || // Rate limit
                    err.status === 503 || // Service unavailable
                    err.message?.includes('timeout') ||
                    err.message?.includes('network') ||
                    err.message?.includes('socket');

                if (!isTransient) {
                    console.error('[ErrorHandler] Non-transient error, aborting retries:', err.message);
                    if (silent) return null;
                    throw err; // Fast fail on auth errors, bad requests, etc.
                }

                console.warn(`[ErrorHandler] Transient error caught (attempt ${i + 1}/${maxRetries}). Retrying in ${delayMs}ms...`);
                await new Promise(res => setTimeout(res, delayMs));

                // Exponential backoff
                delayMs *= 2;
            }
        }

        console.error('[ErrorHandler] Max retries exhausted for operation.', lastError);
        if (silent) return null;
        throw lastError;
    }
}
