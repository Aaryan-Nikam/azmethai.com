/**
 * Stub authentication system for Mantis experts.
 * In a production scenario, this would interface with Supabase or another DB
 * to verify JWTs or API keys securely.
 */
export function isExpertAuthenticated(token: string): boolean {
    if (!token) return false;

    // Hardcoded mock token for testing expert review flow
    const validTokens = [
        'expert-secret-token-123',
        'mantis-super-expert-token',
        'growth-expert-token-abc'
    ];

    return validTokens.includes(token);
}
