/**
 * Mantis Subagent Types
 *
 * Every subagent in the system follows this contract.
 * Expert agents always receive the same predictable shape,
 * regardless of whether the subagent used an LLM or a raw API call.
 */

/** The result every subagent must return. */
export interface SubagentResult<T = unknown> {
    /** Whether the operation completed successfully. */
    success: boolean;

    /** The structured output data. */
    data: T;

    /** Provenance chain — URLs, API refs, or file paths that ground this data. */
    sources: string[];

    /** Human-readable error message if success=false. */
    error?: string;

    /** Estimated cost of this execution in USD (for credit tracking). */
    costEstimate?: number;

    /** Execution time in milliseconds. */
    durationMs?: number;
}

/** Input passed to a subagent's execute method. */
export interface SubagentInput {
    /** The primary instruction or query for the subagent. */
    goal: string;

    /** Optional parameters specific to each subagent. */
    params?: Record<string, unknown>;

    /** Optional: maximum time in ms before the subagent should abort. */
    timeoutMs?: number;
}

/** The interface every subagent must implement. */
export interface Subagent {
    /** Unique name used for registry lookup (e.g. "websurfer", "perplexity"). */
    name: string;

    /** Human-readable description of what this subagent does. */
    description: string;

    /** Whether this subagent uses an LLM call (affects cost tracking). */
    usesLLM: boolean;

    /** Execute the subagent's task. */
    execute(input: SubagentInput): Promise<SubagentResult>;
}
