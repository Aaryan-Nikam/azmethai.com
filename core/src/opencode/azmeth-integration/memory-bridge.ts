/**
 * @file memory-bridge.ts
 * @description Azmeth Memory Bridge
 *
 * Bridges the OpenCode `memdir/` memory hierarchy (AZMETH.md files) with
 * Azmeth's cloud `WorkspaceStore` (Postgres/Supabase).
 *
 * In Claude Code, memory is loaded from local files:
 *   ~/.azmeth/AZMETH.md           → User memory
 *   <project>/AZMETH.md           → Project memory
 *   <project>/.azmeth/AZMETH.md   → Local project memory
 *
 * In Azmeth, these are stored in Supabase and loaded per-tenant/per-session,
 * enabling cloud-native memory that persists across devices and deployments.
 *
 * This bridge:
 *  1. Reads memory from Supabase on session start
 *  2. Writes updated AZMETH.md content back to Supabase on session end
 *  3. Provides the `MemoryFileInfo[]` array that `getAttachmentMessages` needs
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { MemoryFileInfo } from '../utils/azmethmd.js'

export interface AzmethMemoryEntry {
  id: string
  tenant_id: string
  role_id: string | null
  session_id: string | null
  type: 'user' | 'project' | 'local' | 'managed'
  content: string
  path: string
  updated_at: string
}

/** Lazy singleton — only instantiated when memory functions are called */
let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    if (!url || url.includes('mockup')) {
      throw new Error('[MemoryBridge] SUPABASE_URL is not set. Set a real URL to use cloud memory.')
    }
    _supabase = createClient(url, key!)
  }
  return _supabase
}

/**
 * Loads all memory files for a session from Supabase,
 * returning them in the `MemoryFileInfo[]` format expected by the query loop.
 */
export async function loadSessionMemory(
  tenantId: string,
  roleId?: string,
  sessionId?: string,
): Promise<MemoryFileInfo[]> {
  const query = getSupabase()
    .from('azmeth_memory')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('type', { ascending: true }) // managed → user → project → local

  const { data, error } = await query
  if (error) {
    console.error('[MemoryBridge] Failed to load memory:', error.message)
    return []
  }

  const entries = (data as AzmethMemoryEntry[]).filter(entry => {
    // Include global (no role) and role-specific memories
    const roleMatch = !entry.role_id || entry.role_id === roleId
    // Include global (no session) and session-specific memories
    const sessionMatch = !entry.session_id || entry.session_id === sessionId
    return roleMatch && sessionMatch
  })

  // Map to MemoryFileInfo shape expected by OpenCode
  return entries.map(e => ({
    path: e.path,
    type: mapMemoryType(e.type),
    content: e.content,
    contentDiffersFromDisk: false,
  }))
}

/**
 * Persists updated memory content back to Supabase.
 * Called after the session updates an AZMETH.md file.
 */
export async function persistMemory(
  tenantId: string,
  path: string,
  content: string,
  type: AzmethMemoryEntry['type'],
  roleId?: string,
  sessionId?: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from('azmeth_memory')
    .upsert(
      {
        tenant_id: tenantId,
        role_id: roleId ?? null,
        session_id: sessionId ?? null,
        type,
        path,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,path,type' },
    )

  if (error) {
    console.error('[MemoryBridge] Failed to persist memory:', error.message)
  }
}

/**
 * Appends new content to an existing memory entry (used by the /memory command).
 */
export async function appendToMemory(
  tenantId: string,
  path: string,
  newContent: string,
  roleId?: string,
): Promise<void> {
  const { data } = await getSupabase()
    .from('azmeth_memory')
    .select('content')
    .eq('tenant_id', tenantId)
    .eq('path', path)
    .maybeSingle()

  const updated = data
    ? `${data.content}\n\n${newContent}`
    : newContent

  await persistMemory(tenantId, path, updated, 'project', roleId)
}

function mapMemoryType(t: AzmethMemoryEntry['type']): import('../utils/memory/types.js').MemoryType {
  const map: Record<AzmethMemoryEntry['type'], import('../utils/memory/types.js').MemoryType> = {
    managed: 'Managed',
    user: 'User',
    project: 'Project',
    local: 'Local',
  }
  return map[t]
}
