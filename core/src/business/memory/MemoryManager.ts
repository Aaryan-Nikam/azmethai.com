import { createClient, SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type {
  RoleIdentity, EpisodicMemory, SemanticMemory,
  ProceduralMemory, WorkingMemory, AssembledContext
} from '../types.js'

export class MemoryManager {
  private supabase: SupabaseClient
  private openai: OpenAI

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!  // service key — server only
    )
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  }

  // Assembles context window fresh every turn — never accumulates
  async assembleContext(
    roleId: string,
    tenantId: string,
    currentInput: string
  ): Promise<AssembledContext> {
    // Embed the current input once, use for all retrievals
    const queryEmbedding = await this.embed(currentInput)

    // All retrievals fire in parallel
    const [identity, working, episodes, semantics, procedures] = await Promise.all([
      this.loadIdentity(roleId, tenantId),
      this.loadWorkingMemory(roleId, tenantId),
      this.retrieveEpisodic(roleId, tenantId, queryEmbedding, 4),
      this.retrieveSemantic(roleId, tenantId, queryEmbedding, 6),
      this.retrieveProcedural(roleId, tenantId, queryEmbedding, 3),
    ])

    if (!identity) throw new Error(`No role identity found for roleId=${roleId}`)

    const system_prompt = this.buildSystemPrompt(identity, procedures)
    const token_estimate = this.estimateTokens(system_prompt, working, episodes, semantics)

    return {
      system_prompt,
      working_memory: working,
      retrieved_memories: [...episodes, ...semantics],
      procedures,
      token_estimate,
    }
  }

  private async loadIdentity(roleId: string, tenantId: string): Promise<RoleIdentity | null> {
    const { data, error } = await this.supabase
      .from('role_identities')
      .select('*')
      .eq('id', roleId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) return null
    return data
  }

  private async loadWorkingMemory(roleId: string, tenantId: string): Promise<WorkingMemory | null> {
    const { data } = await this.supabase
      .from('working_memory')
      .select('*')
      .eq('role_id', roleId)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('checkpoint_at', { ascending: false })
      .limit(1)
      .single()

    return data ?? null
  }

  private async retrieveEpisodic(
    roleId: string, tenantId: string,
    embedding: number[], topK: number
  ): Promise<EpisodicMemory[]> {
    const { data, error } = await this.supabase.rpc('match_episodic_memory', {
      p_role_id: roleId,
      p_tenant_id: tenantId,
      p_embedding: embedding,
      p_top_k: topK * 3,  // over-fetch for re-ranking
    })

    if (error || !data) return []

    // Re-rank by composite score: similarity + importance + recency
    return data
      .map((row: any) => ({
        ...row,
        _score: this.compositeScore(row.similarity, row.importance_score, row.created_at),
      }))
      .sort((a: any, b: any) => b._score - a._score)
      .slice(0, topK)
  }

  private async retrieveSemantic(
    roleId: string, tenantId: string,
    embedding: number[], topK: number
  ): Promise<SemanticMemory[]> {
    const { data, error } = await this.supabase.rpc('match_semantic_memory', {
      p_role_id: roleId,
      p_tenant_id: tenantId,
      p_embedding: embedding,
      p_top_k: topK,
    })

    if (error || !data) return []
    return data.filter((row: any) => row.similarity > 0.75)
  }

  async retrieveProcedural(
    roleId: string, tenantId: string,
    embedding: number[], topK: number
  ): Promise<ProceduralMemory[]> {
    const { data, error } = await this.supabase.rpc('match_procedural_memory', {
      p_role_id: roleId,
      p_tenant_id: tenantId,
      p_embedding: embedding,
      p_top_k: topK,
    })

    if (error || !data) return []
    // Sort by priority when similarity is close
    return data.sort((a: any, b: any) => {
      if (Math.abs(a.similarity - b.similarity) < 0.05) return b.priority - a.priority
      return b.similarity - a.similarity
    })
  }

  // Composite scoring: 50% semantic similarity + 30% importance + 20% recency
  private compositeScore(similarity: number, importance: number, createdAt: string): number {
    const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
    const recency = Math.exp(-ageHours / 168)  // half-life = 1 week
    return (similarity * 0.5) + (importance * 0.3) + (recency * 0.2)
  }

  // Checkpoint after every tool execution — prevents any task loss
  async checkpoint(working: Omit<WorkingMemory, 'id'>): Promise<void> {
    await this.supabase
      .from('working_memory')
      .upsert(
        { ...working, checkpoint_at: new Date() },
        { onConflict: 'session_id' }
      )
  }

  // Write raw episode at session end — compression runs async
  async writeEpisode(
    sessionId: string, roleId: string, tenantId: string,
    task: string, outcome: string, entities: string[]
  ): Promise<void> {
    const summary = `Task: ${task}\nOutcome: ${outcome.slice(0, 600)}`
    const embedding = await this.embed(summary)

    await this.supabase.from('episodic_memory').insert({
      role_id: roleId,
      tenant_id: tenantId,
      session_id: sessionId,
      summary,
      entities_involved: entities,
      embedding,
      importance_score: 0.6,
      created_at: new Date(),
    })
  }

  // Compress episodes into durable semantic facts — call async, don't await
  async compressSession(sessionId: string, roleId: string, tenantId: string): Promise<void> {
    const { data: episode } = await this.supabase
      .from('episodic_memory')
      .select('*')
      .eq('session_id', sessionId)
      .is('compressed_at', null)
      .single()

    if (!episode) return

    // Extract durable facts using a fast model
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract durable facts from this work session summary.
Return JSON: { "facts": [{ "subject": "", "predicate": "", "object": "", "confidence": 0.0-1.0 }] }
Only include facts that will still be true in 6+ months.
Examples: client preferences, matter details, billing arrangements, key contacts.
Do not include task outcomes or one-time decisions.`,
        },
        { role: 'user', content: episode.summary },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    })

    const parsed = JSON.parse(response.choices[0].message.content!)
    const facts = parsed.facts ?? []

    if (facts.length > 0) {
      const withEmbeddings = await Promise.all(
        facts.map(async (f: any) => ({
          role_id: roleId,
          tenant_id: tenantId,
          subject: f.subject,
          predicate: f.predicate,
          object: f.object,
          confidence: f.confidence,
          embedding: await this.embed(`${f.subject} ${f.predicate} ${f.object}`),
          source: 'episode_extract',
          last_verified_at: new Date(),
        }))
      )
      await this.supabase.from('semantic_memory').insert(withEmbeddings)
    }

    // Mark compressed, decay importance (facts are now in semantic store)
    await this.supabase
      .from('episodic_memory')
      .update({ compressed_at: new Date(), importance_score: episode.importance_score * 0.4 })
      .eq('id', episode.id)
  }

  // Ingest SOP document into procedural memory — called during equipping
  async ingestSOP(
    content: string, title: string,
    roleId: string, tenantId: string,
    domainTags: string[] = []
  ): Promise<void> {
    // Parse steps from SOP text using LLM
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract structured steps from this SOP. Return JSON: { "steps": ["step 1", "step 2", ...], "conditions": "when this applies", "tags": ["tag1", "tag2"] }',
        },
        { role: 'user', content: content },
      ],
      response_format: { type: 'json_object' },
    })

    const parsed = JSON.parse(response.choices[0].message.content!)
    const embedding = await this.embed(`${title} ${content.slice(0, 500)}`)

    await this.supabase.from('procedural_memory').insert({
      role_id: roleId,
      tenant_id: tenantId,
      title,
      steps: parsed.steps ?? [],
      conditions: parsed.conditions,
      domain_tags: [...domainTags, ...(parsed.tags ?? [])],
      embedding,
      priority: 5,
      version: 1,
    })
  }

  private buildSystemPrompt(identity: RoleIdentity, procedures: ProceduralMemory[]): string {
    const parts = [identity.system_persona]

    if (identity.permissions.length > 0) {
      parts.push(`## Your permissions\n${identity.permissions
        .map(p => `- ${p.resource}: ${p.actions.join(', ')}${p.conditions ? ` (${p.conditions})` : ''}`)
        .join('\n')}`)
    }

    if (identity.blocked_actions.length > 0) {
      parts.push(`## Actions you must never take\n${identity.blocked_actions
        .map(b => `- ${b.pattern}: ${b.reason}`)
        .join('\n')}`)
    }

    if (procedures.length > 0) {
      parts.push(`## Relevant procedures\n${procedures
        .map(p => `### ${p.title}${p.conditions ? `\nApply when: ${p.conditions}` : ''}\n${p.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`)
        .join('\n\n')}`)
    }

    return parts.join('\n\n')
  }

  // Token budget enforcement — identity and working memory are protected, retrieved memories get trimmed
  enforceTokenBudget(context: AssembledContext, maxTokens: number = 160_000): AssembledContext {
    if (context.token_estimate <= maxTokens) return context

    const baseTokens = this.estimateTokens(context.system_prompt, context.working_memory, [], [])
    let budget = maxTokens - baseTokens

    const trimmedMemories: (EpisodicMemory | SemanticMemory)[] = []
    for (const mem of context.retrieved_memories) {
      const cost = Math.ceil(JSON.stringify(mem).length / 4)
      if (budget - cost > 0) {
        trimmedMemories.push(mem)
        budget -= cost
      } else break
    }

    return { ...context, retrieved_memories: trimmedMemories }
  }

  async embed(text: string): Promise<number[]> {
    const { data } = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),  // hard limit
    })
    return data[0].embedding
  }

  private estimateTokens(...args: any[]): number {
    return Math.ceil(JSON.stringify(args).length / 4)
  }
}
