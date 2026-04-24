/**
 * LegalParalegalEquipper.ts
 * 
 * Runs the full one-time equipping sequence that bootstraps a new legal AI employee.
 * Call this once per firm deployment — not at runtime.
 * 
 * Usage:
 *   npx ts-node src/business/equipping/LegalParalegalEquipper.ts
 */

import { createClient } from '@supabase/supabase-js'
import { MemoryManager } from '../memory/MemoryManager.js'
import { LEGAL_SOPS, MEHTA_PILOT_IDENTITY } from '../domain/legal.js'
import 'dotenv/config'

async function equipLegalParalegal() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  const memory = new MemoryManager()

  console.log('🚀 Equipping Legal Paralegal AI Employee...\n')

  // 1. Create or find the pilot tenant
  console.log('1/4  Upserting tenant: Mehta & Associates')
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .upsert({
      name: 'Mehta & Associates',
      domain: 'mehta-associates.com',
      plan: 'pilot'
    }, { onConflict: 'domain' })
    .select('id')
    .single()

  if (tenantError) throw new Error(`Tenant error: ${tenantError.message}`)
  console.log(`   ✓ Tenant ID: ${tenant.id}\n`)

  // 2. Insert the Role Identity
  console.log('2/4  Creating role identity: Maya (Paralegal)')
  const { data: role, error: roleError } = await supabase
    .from('role_identities')
    .insert({
      ...MEHTA_PILOT_IDENTITY,
      tenant_id: tenant.id
    })
    .select('id')
    .single()

  if (roleError) throw new Error(`Role error: ${roleError.message}`)
  console.log(`   ✓ Role ID: ${role.id}\n`)

  // 3. Ingest all legal SOPs into procedural memory with embeddings
  console.log(`3/4  Ingesting ${LEGAL_SOPS.length} standard operating procedures...`)
  for (const sop of LEGAL_SOPS) {
    process.stdout.write(`   ↳ "${sop.title}"... `)
    await memory.ingestSOP(
      sop.steps.join('\n'),
      sop.title,
      role.id,
      tenant.id,
      sop.domain_tags
    )
    console.log('✓')
  }
  console.log()

  // 4. Seed an initial working memory slot
  console.log('4/4  Initialising working memory slot...')
  await memory.checkpoint({
    role_id: role.id,
    tenant_id: tenant.id,
    session_id: `bootstrap-${role.id}`,
    task_description: 'AI Employee initialised and ready to accept tasks.',
    current_step: 'Standby',
    steps_completed: [],
    steps_remaining: [],
    artifacts: {},
    pending_approvals: [],
    checkpoint_at: new Date(),
    status: 'active'
  })
  console.log('   ✓ Working memory bootstrapped\n')

  console.log('═══════════════════════════════════════════════')
  console.log('✅ Maya is equipped and ready.')
  console.log(`   Tenant ID : ${tenant.id}`)
  console.log(`   Role ID   : ${role.id}`)
  console.log('═══════════════════════════════════════════════')
  console.log('\nAdd these values to your .env:\n')
  console.log(`MANTIS_TENANT_DOMAIN=mehta-associates.com`)
  console.log(`MANTIS_DEFAULT_ROLE_ID=${role.id}`)
}

equipLegalParalegal().catch(err => {
  console.error('\n❌ Equipping failed:', err.message)
  process.exit(1)
})
