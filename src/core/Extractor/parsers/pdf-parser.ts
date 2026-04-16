/**
 * Stage 1 & 2 PDF Parser
 * 
 * Stage 1 (free): pdf-parse for digitally-native PDFs.
 *   Measures text quality by checking character density, word recognition,
 *   and garbled-text detection. If quality > STAGE1_QUALITY_THRESHOLD, 
 *   we stop here. No API cost.
 * 
 * Stage 2 (paid, fallback): LLMWhisperer API for scanned/complex PDFs.
 *   Only invoked when Stage 1 quality is below threshold.
 *   Layout-preserving extraction optimised for LLM consumption.
 * 
 * Production validation: 4,700-PDF case study achieved 98% accuracy
 * using exactly this two-stage routing pattern.
 */

import { readFile } from 'fs/promises';
import { createHash } from 'crypto';
import { createRequire } from 'module';

// pdf-parse is a CJS module — use createRequire for reliable ESM/CJS interop
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer, options?: object) => Promise<{
  text: string;
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: string;
}>;

export interface ParseResult {
  text: string;
  pageCount: number;
  stage: 1 | 2;
  qualityScore: number;
  charCount: number;
  wordCount: number;
  documentHash: string;
}

export interface ParseFailure {
  error: string;
  stage: 1 | 2;
  documentHash: string;
}

const STAGE1_QUALITY_THRESHOLD = parseFloat(
  process.env.STAGE1_QUALITY_THRESHOLD ?? '0.65'
);

// ─── Stage 1: Deterministic PDF Extraction ─────────────────────────────────

export async function parseStage1(filePath: string): Promise<{
  result?: ParseResult;
  failure?: ParseFailure;
  needsEscalation: boolean;
}> {
  const buffer = await readFile(filePath);
  const documentHash = createHash('sha256').update(buffer).digest('hex');

  try {
    const parsed = await pdfParse(buffer);
    const rawText = parsed.text;
    const qualityScore = measureTextQuality(rawText);

    const result: ParseResult = {
      text: cleanText(rawText),
      pageCount: parsed.numpages,
      stage: 1,
      qualityScore,
      charCount: rawText.length,
      wordCount: rawText.trim().split(/\s+/).length,
      documentHash,
    };

    if (qualityScore < STAGE1_QUALITY_THRESHOLD) {
      console.log(`[Parser] Stage 1 quality score: ${qualityScore.toFixed(2)} — below threshold ${STAGE1_QUALITY_THRESHOLD}. Escalating to Stage 2.`);
      return { result, needsEscalation: true };
    }

    console.log(`[Parser] Stage 1 success. Quality: ${qualityScore.toFixed(2)}, Pages: ${parsed.numpages}, Words: ${result.wordCount}`);
    return { result, needsEscalation: false };

  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.log(`[Parser] Stage 1 failed: ${error}. Escalating to Stage 2.`);
    return {
      failure: { error, stage: 1, documentHash },
      needsEscalation: true,
    };
  }
}

// ─── Stage 2: LLMWhisperer Fallback ────────────────────────────────────────
// Only called when Stage 1 quality fails. Layout-preserving for scanned PDFs.

export async function parseStage2(filePath: string, documentHash: string): Promise<{
  result?: ParseResult;
  failure?: ParseFailure;
}> {
  const apiKey = process.env.LLMWHISPERER_API_KEY;
  if (!apiKey) {
    console.warn('[Parser] No LLMWHISPERER_API_KEY configured. Falling back to Stage 1 text despite low quality.');
    return {
      failure: {
        error: 'LLMWhisperer API key not configured',
        stage: 2,
        documentHash,
      },
    };
  }

  try {
    const buffer = await readFile(filePath);
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('file', blob, 'document.pdf');

    // LLMWhisperer: purpose-built for LLM consumption
    // Output is layout-preserving text with table structure intact
    const response = await fetch('https://llmwhisperer-api.us-central.unstract.com/api/v2/whisper', {
      method: 'POST',
      headers: {
        'unstract-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`LLMWhisperer API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { extraction: { result_text: string } };
    const text = data.extraction.result_text;

    const result: ParseResult = {
      text: cleanText(text),
      pageCount: 0, // LLMWhisperer doesn't always return page count
      stage: 2,
      qualityScore: measureTextQuality(text),
      charCount: text.length,
      wordCount: text.trim().split(/\s+/).length,
      documentHash,
    };

    console.log(`[Parser] Stage 2 (LLMWhisperer) success. Words: ${result.wordCount}, Quality: ${result.qualityScore.toFixed(2)}`);
    return { result };

  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[Parser] Stage 2 failed: ${error}`);
    return {
      failure: { error, stage: 2, documentHash },
    };
  }
}

// ─── Full Two-Stage Parse Function ─────────────────────────────────────────

export async function parseDocument(filePath: string): Promise<ParseResult> {
  const { result: stage1Result, failure: stage1Failure, needsEscalation } = await parseStage1(filePath);

  if (!needsEscalation && stage1Result) {
    return stage1Result;
  }

  const documentHash = stage1Result?.documentHash ?? 
    createHash('sha256').update(filePath).digest('hex');

  const { result: stage2Result, failure: stage2Failure } = await parseStage2(filePath, documentHash);

  if (stage2Result) {
    return stage2Result;
  }

  // Both stages failed. If Stage 1 returned low-quality text, use it — better than nothing.
  if (stage1Result) {
    console.warn('[Parser] Both stages attempted. Using Stage 1 result despite low quality score.');
    return stage1Result;
  }

  throw new Error(
    `Document parsing failed at all stages. Stage 1: ${stage1Failure?.error}. Stage 2: ${stage2Failure?.error}`
  );
}

// ─── Text Quality Measurement ──────────────────────────────────────────────
// Heuristic scoring to detect garbled OCR, empty PDFs, or encoding issues.
// Score 0.0 (completely garbled) to 1.0 (clean native text).

function measureTextQuality(text: string): number {
  if (!text || text.trim().length < 50) return 0.0;

  const scores: number[] = [];

  // 1. Average word length (garbled text has very long "words")
  const words = text.trim().split(/\s+/);
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const wordLengthScore = avgWordLength > 2 && avgWordLength < 15 ? 1.0 : 
    avgWordLength > 15 ? Math.max(0, 1 - (avgWordLength - 15) / 20) : 0.3;
  scores.push(wordLengthScore);

  // 2. Ratio of printable ASCII characters (garbled PDFs have lots of special chars)
  const printableCount = (text.match(/[\x20-\x7E]/g) ?? []).length;
  const printableRatio = printableCount / text.length;
  scores.push(printableRatio);

  // 3. Proportion of recognisable common English words in the text
  const commonWords = ['the', 'and', 'of', 'to', 'in', 'is', 'shall', 'party', 'agreement', 'date', 'contract', 'termination'];
  const lowerText = text.toLowerCase();
  const recognisedWordCount = commonWords.filter(w => lowerText.includes(w)).length;
  scores.push(recognisedWordCount / commonWords.length);

  // 4. Penalise documents with excessive whitespace (blank/image PDFs)
  const nonWhitespaceRatio = text.replace(/\s/g, '').length / text.length;
  scores.push(Math.min(1.0, nonWhitespaceRatio * 3)); // scale: 0.33 nonws = 1.0 score

  // 5. Presence of digits (contracts always have dates, amounts)
  const digitRatio = (text.match(/\d/g) ?? []).length / text.length;
  scores.push(Math.min(1.0, digitRatio * 20)); // 5% digits = perfect score

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

// ─── Text Cleaning ─────────────────────────────────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')           // normalise line endings
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')       // collapse excessive blank lines
    .replace(/[ \t]+/g, ' ')          // collapse multiple spaces
    .replace(/^\s+|\s+$/gm, '')       // trim each line
    .trim();
}
