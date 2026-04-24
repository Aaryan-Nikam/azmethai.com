#!/usr/bin/env tsx
/**
 * scripts/ingest-legal-sops.ts
 *
 * Computes OpenAI embeddings for all procedural_memory rows that
 * were seeded by 02_legal_tables_and_seed.sql without embeddings,
 * then writes them back to Supabase.
 *
 * Run once after applying the SQL migration:
 *   npx tsx scripts/ingest-legal-sops.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

async function embed(text: string): Promise<number[]> {
  const { data } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return data[0].embedding
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('🔍 Finding procedural memory rows without embeddings...')

  const { data: rows, error } = await supabase
    .from('procedural_memory')
    .select('id, title, steps, conditions, domain_tags')
    .is('embedding', null)

  if (error) {
    console.error('❌ Failed to fetch rows:', error.message)
    process.exit(1)
  }

  if (!rows || rows.length === 0) {
    console.log('✅ All procedural memory rows already have embeddings.')
    return
  }

  console.log(`📄 Found ${rows.length} row(s) to embed.\n`)

  for (const row of rows) {
    // Build a rich text representation for embedding
    const textToEmbed = [
      row.title,
      row.conditions ?? '',
      (row.domain_tags ?? []).join(' '),
      (row.steps ?? []).join(' '),
    ].join('\n')

    process.stdout.write(`  ⚙️  Embedding: "${row.title}"...`)

    const embedding = await embed(textToEmbed)

    const { error: updateError } = await supabase
      .from('procedural_memory')
      .update({ embedding })
      .eq('id', row.id)

    if (updateError) {
      console.log(` ❌ FAILED: ${updateError.message}`)
    } else {
      console.log(` ✅ Done (${embedding.length}d vector)`)
    }

    // Respect OpenAI rate limits
    await sleep(200)
  }

  console.log('\n🎉 SOP ingestion complete. All procedural memory rows are now embedded.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
