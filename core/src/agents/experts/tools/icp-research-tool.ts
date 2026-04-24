
import { parseHTML } from "linkedom";
import { AgentLLM } from "../../../llm-provider.js";

/**
 * ICP Research Tool
 * 
 * Scrapes a target website and extracts a structured Ideal Customer Profile (ICP).
 * 
 * Output Schema:
 * - Company Summary
 * - Target Audience (Demographics, Job Titles)
 * - Pain Points
 * - Value Proposition
 * - Hooks/Angles
 */

export interface IcpProfile {
    companyName: string;
    summary: string;
    targetAudience: string[];
    painPoints: string[];
    valueProps: string[];
    suggestedAngles: string[];
}

export class IcpResearchTool {
    private llm: AgentLLM;

    constructor(llm: AgentLLM) {
        this.llm = llm;
    }

    async analyze(url: string): Promise<IcpProfile> {
        console.log(`[ICP Tool] Scraping ${url}...`);

        try {
            // 1. Fetch Page Content
            const html = await this.fetchPage(url);
            if (!html) throw new Error("Empty response");

            // 2. Clean & Extract Text
            const textContent = this.extractText(html);
            if (textContent.length < 100) throw new Error("Insufficient content found");

            console.log(`[ICP Tool] Content Extracted (${textContent.length} chars). Analyzing with LLM...`);

            // 3. LLM Extraction
            const profile = await this.extractWithLLM(textContent, url);
            return profile;

        } catch (error) {
            console.error(`[ICP Tool] Error analyzing ${url}:`, error);
            return {
                companyName: "Error",
                summary: `Failed to analyze ${url}: ${error.message}`,
                targetAudience: [],
                painPoints: [],
                valueProps: [],
                suggestedAngles: []
            };
        }
    }

    private async fetchPage(url: string): Promise<string> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } finally {
            clearTimeout(timeout);
        }
    }

    private extractText(html: string): string {
        const { document } = parseHTML(html);

        // Remove noise
        const noise = ["script", "style", "noscript", "iframe", "svg", "link", "meta", "head"];
        noise.forEach(tag => {
            const elements = document.querySelectorAll(tag);
            elements.forEach(el => el.remove());
        });

        // Get text
        let text = document.body?.textContent || "";
        return text.replace(/\s+/g, " ").trim().slice(0, 15000); // Limit to 15k chars for LLM
    }

    private async extractWithLLM(text: string, url: string): Promise<IcpProfile> {
        const prompt = `
You are a Growth Marketing Strategist.
Analyze the following landing page content for "${url}" and extract the Ideal Customer Profile (ICP).

PAGE CONTENT:
${text}

---
Output strictly valid JSON with this schema:
{
    "companyName": "Name of the business",
    "summary": "1-2 sentence summary of what they do",
    "targetAudience": ["Main Persona 1", "Main Persona 2"],
    "painPoints": ["Top problem 1", "Top problem 2"],
    "valueProps": ["Key solution 1", "Key solution 2"],
    "suggestedAngles": ["Ad Hook 1", "Ad hook 2"]
}
`;
        const response = await this.llm(prompt);
        return this.parseJSON(response);
    }

    private parseJSON(response: string): IcpProfile {
        try {
            let clean = response.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(clean);
        } catch (e) {
            console.error("LLM JSON Parse Error:", response);
            return {
                companyName: "Unknown",
                summary: "Failed to parse LLM response",
                targetAudience: [],
                painPoints: [],
                valueProps: [],
                suggestedAngles: []
            };
        }
    }
}
