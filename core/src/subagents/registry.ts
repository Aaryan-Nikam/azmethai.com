/**
 * Mantis Subagent Registry
 *
 * Central lookup table where subagents register themselves by name.
 * Expert agents use this to find and call subagents without hard imports.
 */

import type { Subagent } from "./types.js";

const registry = new Map<string, Subagent>();

/** Register a subagent. Throws if a subagent with the same name already exists. */
export function registerSubagent(subagent: Subagent): void {
    if (registry.has(subagent.name)) {
        throw new Error(`Subagent "${subagent.name}" is already registered.`);
    }
    registry.set(subagent.name, subagent);
}

/** Get a subagent by name. Throws if not found. */
export function getSubagent(name: string): Subagent {
    const subagent = registry.get(name);
    if (!subagent) {
        throw new Error(
            `Subagent "${name}" not found. Available: [${Array.from(registry.keys()).join(", ")}]`,
        );
    }
    return subagent;
}

/** List all registered subagent names. */
export function listSubagents(): string[] {
    return Array.from(registry.keys());
}

/** Check if a subagent is registered. */
export function hasSubagent(name: string): boolean {
    return registry.has(name);
}

/** Clear all registered subagents. Useful for tests. */
export function clearRegistry(): void {
    registry.clear();
}
