/**
 * Text-file extraction runner (for testing without PDFs)
 * 
 * Skips Stage 1/2 PDF parsing and feeds plain text directly to Claude.
 * Useful for: testing Claude extraction logic, validating prompt accuracy,
 * running against copied contract text.
 * 
 * Usage:
 *   npx tsx src/test-harness/run-text.ts test-contracts/sample-1.txt
 *   npx tsx src/test-harness/run-text.ts              (all .txt files)
 */

import 'dotenv/config';
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import chalk from 'chalk';
import { table } from 'table';
import { extractVendorContract } from '../extraction/vendor-contract.extractor.ts';
import type { FieldRouting } from '../validation/vendor-contract.schema.ts';

const RESULTS_DIR = join(import.meta.dirname, 'results');
const CONTRACTS_DIR = join(import.meta.dirname, '../../test-contracts');

async function runTextExtraction(filePath: string): Promise<void> {
  const filename = basename(filePath);
  console.log('\n' + chalk.blue('═'.repeat(70)));
  console.log(chalk.blue.bold(`  EXTRACTING (text): ${filename}`));
  console.log(chalk.blue('═'.repeat(70)));

  const text = await readFile(filePath, 'utf-8');
  console.log(chalk.dim(`  ${text.split('\n').length} lines, ${text.length} chars`));

  console.log(chalk.cyan('\n[1/2] Running Claude extraction (tool calling)...'));
  const { result, log } = await extractVendorContract(text, filename);

  console.log(`  Cost: ${chalk.yellow(`$${log.estimatedCostUsd.toFixed(4)}`)} | Tokens: ${log.inputTokens}+${log.outputTokens} | Time: ${log.durationMs}ms`);

  if (!result) {
    console.error(chalk.red(`  ✗ Extraction failed: ${log.errorMessage}`));
    return;
  }

  console.log(chalk.cyan('\n[2/2] Routing analysis...\n'));

  const tableData = [
    [chalk.bold('Field'), chalk.bold('Confidence'), chalk.bold('Decision'), chalk.bold('Value Preview')],
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

  const { summary } = result;
  console.log(chalk.bold('─── SUMMARY ───────────────────────────────────────'));
  console.log(`  Overall confidence:        ${formatConfidence(summary.overall_confidence)}`);
  console.log(`  Auto-accepted:             ${chalk.green(summary.auto_accepted.toString())}/${summary.total_fields}`);
  console.log(`  Needs human review:        ${chalk.yellow(summary.needs_review.toString())}/${summary.total_fields}`);
  console.log(`  Rejected:                  ${chalk.red(summary.rejected.toString())}/${summary.total_fields}`);
  console.log(`  Document processable:      ${summary.document_processable ? chalk.green('YES') : chalk.red('NO')}`);

  const autoRenewal = result.extraction.auto_renewal;
  if (autoRenewal) {
    const danger = autoRenewal.value.exists && autoRenewal.value.notice_period_days;
    console.log('\n' + chalk.red.bold('  ⚡ AUTO-RENEWAL CLAUSE ─────────────────────────────────────────'));
    console.log(`  Exists:            ${autoRenewal.value.exists ? chalk.red.bold('YES — TRAP DETECTED') : chalk.green('No')}`);
    if (autoRenewal.value.exists) {
      const deadline = autoRenewal.value.notice_period_days ?
        chalk.red.bold(`${autoRenewal.value.notice_period_days} DAYS NOTICE REQUIRED`) :
        chalk.yellow('NOTICE PERIOD UNKNOWN');
      console.log(`  Notice required:   ${deadline}`);
      console.log(`  Renewable for:     ${autoRenewal.value.renewal_term_months ?? '?'} months each time`);
      const annual = result.extraction.annual_value_gbp?.value;
      if (annual && danger) {
        console.log(`  ${chalk.red.bold(`⚠ FINANCIAL EXPOSURE: £${annual.toLocaleString()} locked in if notice missed`)}`);
      }
    }
    console.log(`  Confidence:        ${formatConfidence(autoRenewal.confidence)} ${autoRenewal.confidence < 0.7 ? chalk.yellow('← FLAGGED FOR REVIEW') : ''}`);
    console.log(`  Source:            "${chalk.dim(autoRenewal.source_text.slice(0, 120))}..."`);
  }

  const slas = result.extraction.sla_commitments;
  if (slas?.value && slas.value.length > 0) {
    console.log('\n' + chalk.cyan.bold('  ⚡ SLA COMMITMENTS + CREDIT OPPORTUNITIES ─────────────────────'));
    slas.value.forEach((sla, i) => {
      const creditText = sla.credit_percentage ?
        chalk.green(` → ${sla.credit_percentage}% credit on breach`) : '';
      console.log(`  [${i + 1}] ${sla.metric}: ${chalk.bold(sla.target)}${creditText}`);
      if (sla.credit_mechanism) {
        console.log(`       ${chalk.dim(sla.credit_mechanism)}`);
      }
    });
  }

  const escalations = result.extraction.price_escalation_triggers;
  if (escalations?.value && escalations.value.length > 0) {
    console.log('\n' + chalk.yellow.bold('  ⚡ PRICE ESCALATION TRIGGERS ──────────────────────────────────'));
    escalations.value.forEach((e, i) => {
      const cap = e.cap_percentage ? chalk.yellow(` (capped at ${e.cap_percentage}%)`) : '';
      console.log(`  [${i + 1}] ${e.trigger_type.toUpperCase()}: ${e.description}${cap}`);
    });
  }

  await mkdir(RESULTS_DIR, { recursive: true });
  const outputPath = join(RESULTS_DIR, `${basename(filename, extname(filename))}-result.json`);
  await writeFile(outputPath, JSON.stringify({
    filename, extractedAt: new Date().toISOString(),
    log: { model: log.model, tokens: `${log.inputTokens}+${log.outputTokens}`, costUsd: log.estimatedCostUsd, durationMs: log.durationMs },
    summary: result.summary, routing: result.routing, extraction: result.extraction,
  }, null, 2));
  console.log(`\n  ${chalk.dim(`JSON saved: ${outputPath}`)}`);
}

function formatConfidence(c: number): string {
  const pct = `${(c * 100).toFixed(0)}%`;
  return c >= 0.70 ? chalk.green(pct) : c >= 0.40 ? chalk.yellow(pct) : chalk.red(pct);
}
function formatDecision(d: FieldRouting['decision']): string {
  return d === 'auto_accept' ? chalk.green('✓ AUTO') : d === 'human_review' ? chalk.yellow('⚠ REVIEW') : chalk.red('✗ REJECTED');
}
function formatValue(v: unknown): string {
  if (v == null) return chalk.dim('—');
  if (typeof v === 'boolean') return v ? chalk.green('true') : 'false';
  if (typeof v === 'number') return chalk.cyan(v.toString());
  if (typeof v === 'string') return v.length > 40 ? v.slice(0, 37) + '...' : v;
  if (Array.isArray(v)) return `[${v.length} items]`;
  if (typeof v === 'object') { const k = Object.keys(v as object); return `{${k.slice(0,3).join(', ')}}`; }
  return String(v).slice(0, 40);
}

// ─── Entry ─────────────────────────────────────────────────────────────────

const target = process.argv[2];
if (target) {
  await runTextExtraction(target);
} else {
  const entries = await readdir(CONTRACTS_DIR).catch(() => [] as string[]);
  const files = entries.filter(f => f.endsWith('.txt')).map(f => join(CONTRACTS_DIR, f));
  if (!files.length) {
    console.error(chalk.red('\n✗ No .txt files in test-contracts/'));
    console.error(chalk.dim('  Run: node src/test-harness/generate-samples.mjs\n'));
    process.exit(1);
  }
  for (const f of files) await runTextExtraction(f);
}
