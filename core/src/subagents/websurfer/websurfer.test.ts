import { describe, it, expect, vi } from "vitest";
import { createWebsurfer, buildExtractionPrompt } from "./websurfer.js";
import type { ExtractionFn } from "./websurfer.js";

// ─── Mock extraction function (no LLM, zero cost) ───────────────────

const mockExtraction: ExtractionFn = async (prompt: string) => {
    // Simulate LLM returning structured JSON
    if (prompt.includes("company")) {
        return JSON.stringify({
            companyName: "Acme Corp",
            industry: "B2B SaaS",
            employeeCount: 150,
            pricing: "$49/month",
        });
    }
    return JSON.stringify({ note: "No relevant data found" });
};

// ─── Tests ───────────────────────────────────────────────────────────

describe("Websurfer Subagent", () => {
    const websurfer = createWebsurfer(mockExtraction);

    it("has correct metadata", () => {
        expect(websurfer.name).toBe("websurfer");
        expect(websurfer.usesLLM).toBe(true);
        expect(websurfer.description).toContain("URL");
    });

    it("fails gracefully when url param is missing", async () => {
        const result = await websurfer.execute({
            goal: "Find company info",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Missing required param: url");
        expect(result.sources).toEqual([]);
    });

    it("fails gracefully on network error", async () => {
        const result = await websurfer.execute({
            goal: "Find company info",
            params: { url: "http://localhost:99999/nonexistent" },
            timeoutMs: 2000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.sources).toEqual(["http://localhost:99999/nonexistent"]);
        expect(result.durationMs).toBeDefined();
        expect(typeof result.durationMs).toBe("number");
    });

    it("returns result with correct SubagentResult shape", async () => {
        // Even on failure, the shape must be consistent
        const result = await websurfer.execute({
            goal: "test",
            params: { url: "http://localhost:99999/bad" },
            timeoutMs: 2000,
        });

        // Verify shape
        expect(result).toHaveProperty("success");
        expect(result).toHaveProperty("data");
        expect(result).toHaveProperty("sources");
        expect(Array.isArray(result.sources)).toBe(true);
    });
});

describe("buildExtractionPrompt", () => {
    it("includes the goal, URL, and page text", () => {
        const prompt = buildExtractionPrompt(
            "Extract company info",
            "Acme Corp is a B2B SaaS company with 150 employees.",
            "https://acme.com/about",
        );

        expect(prompt).toContain("Extract company info");
        expect(prompt).toContain("https://acme.com/about");
        expect(prompt).toContain("Acme Corp");
        expect(prompt).toContain("JSON");
    });

    it("instructs the LLM not to hallucinate", () => {
        const prompt = buildExtractionPrompt("test", "content", "url");
        expect(prompt).toContain("Do NOT invent");
        expect(prompt).toContain("null");
    });
});
