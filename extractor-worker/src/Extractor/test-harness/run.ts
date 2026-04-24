/**
 * Test Harness — Week 1-2 POC
 * 
 * Run against real vendor contracts to measure extraction accuracy.
 * This is the only thing that matters at this stage.
 * 
 * Usage:
 *   npx tsx src/test-harness/run.ts [path-to-pdf]
 *   npx tsx src/test-harness/run.ts                  (runs all PDFs in test-contracts/)
 * 
 * Output:
 *   - Per-field extraction results with confidence scores
 *   - Routing decisions (auto-accept / review / rejected)
 *   - Estimated processing cost
 *   - Stage 1 vs Stage 2 parsing used
 *   - JSON output saved to test-harness/results/
 */

import 'dotenv/config';
import { readdir, writeFile, mkdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import chalk from 'chalk';
import { table } from 'table';
import { parseDocument } from '../parsers/pdf-parser.ts';
import { extractVendorContract } from '../extraction/vendor-contract.extractor.ts';
import type { FieldRouting } from '../validation/vendor-contract.schema.ts';

const RESULTS_DIR = join(import.meta.dirname, 'results');
const CONTRACTS_DIR = join(import.meta.dirname, '../../test-contracts');

// ─── Run a single PDF through the full pipeline ────────────────────────────

async function runExtraction(filePath: string): Promise<void> {
  const filename = basename(filePath);
  console.log('\n' + chalk.blue('═'.repeat(70)));
  console.log(chalk.blue.bold(`  EXTRACTING: ${filename}`));
  console.log(chalk.blue('═'.repeat(70)));

  // ── Stage 1/2: Parse PDF ──────────────────────────────────────────────
  console.log(chalk.cyan('\n[1/3] Parsing PDF...'));
  let parsed;
  try {
    parsed = await parseDocument(filePath);
  } catch (err) {
    console.error(chalk.red(`  ✗ PDF parsing failed: ${err instanceof Error ? err.message : err}`));
    return;
  }

  console.log(chalk.green(`  ✓ Parsed via Stage ${parsed.stage} | Quality: ${(parsed.qualityScore * 100).toFixed(1)}% | ${parsed.wordCount} words | ${parsed.pageCount} pages`));

  // ── Stage 3: Claude Extraction ────────────────────────────────────────
  console.log(chalk.cyan('\n[2/3] Running Claude extraction (tool calling)...'));
  const { result, log } = await extractVendorContract(parsed.text, filename);

  console.log(`  Cost: ${chalk.yellow(`$${log.estimatedCostUsd.toFixed(4)}`)} | Tokens: ${log.inputTokens}+${log.outputTokens} | Time: ${log.durationMs}ms`);

  if (!result) {
    console.error(chalk.red(`  ✗ Extraction failed: ${log.errorMessage}`));
    return;
  }

  // ── Stage 4: Display Results ──────────────────────────────────────────
  console.log(chalk.cyan('\n[3/3] Routing analysis...\n'));

  const tableData = [
    [
      chalk.bold('Field'),
      chalk.bold('Confidence'),
      chalk.bold('Decision'),
      chalk.bold('Value Preview'),
    ],
    ...result.routing.map(r => [
      r.field,
      formatConfidence(r.confidence),
      formatDecision(r.decision),
      formatValue(r.value),
    ]),
  ];

  console.log(table(tableData, {
    columns: {
      0: { width: 30, truncate: 30 },
      1: { width: 12, alignment: 'center' },
      2: { width: 14, alignment: 'center' },
      3: { width: 40, truncate: 40 },
    },
  }));

  // ── Summary ───────────────────────────────────────────────────────────
  const { summary } = result;
  console.log(chalk.bold('─── SUMMARY ───────────────────────────────────────'));
  console.log(`  Overall confidence:        ${formatConfidence(summary.overall_confidence)}`);
  console.log(`  Fields auto-accepted:      ${chalk.green(summary.auto_accepted.toString())}/${summary.total_fields}`);
  console.log(`  Fields needing review:     ${chalk.yellow(summary.needs_review.toString())}/${summary.total_fields}`);
  console.log(`  Fields rejected:           ${chalk.red(summary.rejected.toString())}/${summary.total_fields}`);
  console.log(`  Document processable:      ${summary.document_processable ? chalk.green('YES') : chalk.red('NO — too many rejected fields')}`);
  console.log(`  Auto-renewal confidence:   ${formatConfidence(summary.critical_auto_renewal_confidence)} ${summary.critical_auto_renewal_confidence < 0.70 ? chalk.yellow('⚠ CRITICAL FIELD — NEEDS REVIEW') : ''}`);

  // ── Highlight critical auto-renewal ───────────────────────────────────
  const autoRenewal = result.extraction.auto_renewal;
  if (autoRenewal) {
    console.log('\n' + chalk.red.bold('  ⚡ AUTO-RENEWAL CLAUSE ───────────────────────────────────────────'));
    console.log(`  Exists:            ${autoRenewal.value.exists ? chalk.red('YES — AUTO-RENEWAL ACTIVE') : chalk.green('No')}`);
    if (autoRenewal.value.exists) {
      console.log(`  Notice required:   ${chalk.yellow(autoRenewal.value.notice_period_days?.toString() ?? 'UNKNOWN')} days`);
      console.log(`  Notice method:     ${autoRenewal.value.notice_method ?? 'NOT SPECIFIED'}`);
      console.log(`  Renewal term:      ${autoRenewal.value.renewal_term_months ?? 'UNKNOWN'} months`);
      console.log(`  Source text:       "${chalk.italic(autoRenewal.source_text.slice(0, 150))}..."`);
    }
  }

  // ── Highlight SLAs ────────────────────────────────────────────────────
  const slas = result.extraction.sla_commitments;
  if (slas?.value && slas.value.length > 0) {
    console.log('\n' + chalk.cyan.bold('  ⚡ SLA COMMITMENTS ─────────────────────────────────────────────'));
    slas.value.forEach((sla, i) => {
      console.log(`  [${i + 1}] ${sla.metric}: ${chalk.bold(sla.target)} ${sla.credit_percentage ? `(${sla.credit_percentage}% credit if breached)` : ''}`);
    });
  }

  // ── Save JSON results ─────────────────────────────────────────────────
  await mkdir(RESULTS_DIR, { recursive: true });
  const outputPath = join(RESULTS_DIR, `${basename(filename, extname(filename))}-result.json`);
  await writeFile(outputPath, JSON.stringify({
    filename,
    parsedAt: new Date().toISOString(),
    parseStage: parsed.stage,
    parseQualityScore: parsed.qualityScore,
    extractionLog: {
      model: log.model,
      inputTokens: log.inputTokens,
      outputTokens: log.outputTokens,
      estimatedCostUsd: log.estimatedCostUsd,
      durationMs: log.durationMs,
      success: log.success,
    },
    routing: result.routing,
    summary: result.summary,
    extraction: result.extraction,
  }, null, 2));

  console.log(`\n  ${chalk.dim(`Full result saved to: ${outputPath}`)}`);
}

// ─── Format helpers ────────────────────────────────────────────────────────

function formatConfidence(confidence: number): string {
  const pct = `${(confidence * 100).toFixed(0)}%`;
  if (confidence >= 0.70) return chalk.green(pct);
  if (confidence >= 0.40) return chalk.yellow(pct);
  return chalk.red(pct);
}

function formatDecision(decision: FieldRouting['decision']): string {
  switch (decision) {
    case 'auto_accept': return chalk.green('✓ AUTO');
    case 'human_review': return chalk.yellow('⚠ REVIEW');
    case 'rejected': return chalk.red('✗ REJECTED');
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return chalk.dim('—');
  if (typeof value === 'boolean') return value ? chalk.green('true') : 'false';
  if (typeof value === 'number') return chalk.cyan(value.toString());
  if (typeof value === 'string') return value.length > 40 ? value.slice(0, 37) + '...' : value;
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value as object);
    return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
  }
  return String(value).slice(0, 40);
}

// ─── Main Entry Point ──────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(chalk.red('\n✗ ANTHROPIC_API_KEY is not set.'));
    console.error(chalk.dim('  Copy .env.example to .env and add your key.\n'));
    process.exit(1);
  }

  const targetFile = process.argv[2];

  if (targetFile) {
    // Run single file
    await runExtraction(targetFile);
  } else {
    // Run all PDFs in test-contracts/
    let files: string[];
    try {
      const entries = await readdir(CONTRACTS_DIR);
      files = entries
        .filter(f => f.toLowerCase().endsWith('.pdf'))
        .map(f => join(CONTRACTS_DIR, f));
    } catch {
      console.error(chalk.red(`\n✗ No test-contracts/ directory found.`));
      console.error(chalk.dim(`  Place PDF contracts at: ${CONTRACTS_DIR}\n`));
      process.exit(1);
    }

    if (files.length === 0) {
      console.error(chalk.red(`\n✗ No PDF files found in test-contracts/`));
      console.error(chalk.dim(`  Place your vendor contracts there and re-run.\n`));
      process.exit(1);
    }

    console.log(chalk.bold(`\nProcessing ${files.length} contract(s)...`));

    let totalCost = 0;
    for (const file of files) {
      await runExtraction(file);
    }

    console.log('\n' + chalk.blue.bold('═'.repeat(70)));
    console.log(chalk.blue.bold(`  ALL EXTRACTIONS COMPLETE`));
    console.log(chalk.blue.bold('═'.repeat(70)));
    console.log(chalk.dim(`  Results saved to: ${RESULTS_DIR}`));
  }
}

main().catch(err => {
  console.error(chalk.red('\n✗ Fatal error:'), err);
  process.exit(1);
});
