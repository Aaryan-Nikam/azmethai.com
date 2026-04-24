import { createClient, SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { KnowledgeNode, KnowledgeEdge, KnowledgeGraph, BrainQuery, BrainResult } from './types.js'

export interface BrainConfig {
  supabaseUrl: string
  supabaseKey: string
  openaiKey: string
  clusteringThreshold: number
  maxClusterSize: number
  embeddingModel: string
}

export class Brain {
  private supabase: SupabaseClient
  private openai: OpenAI
  private config: BrainConfig

  constructor(config: BrainConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    this.openai = new OpenAI({ apiKey: config.openaiKey })
  }

  /**
   * Stores new information in the brain with automatic clustering
   */
  async store(
    content: string,
    metadata: {
      source: string
      type: 'fact' | 'concept' | 'procedure' | 'experience'
      tags: string[]
      importance: number
      tenantId: string
      roleId?: string
    }
  ): Promise<KnowledgeNode> {
    // Generate embedding for the content
    const embedding = await this.generateEmbedding(content)

    // Find related nodes for clustering
    const relatedNodes = await this.findRelatedNodes(embedding, metadata.tenantId)

    // Determine cluster assignment
    const clusterId = await this.determineCluster(relatedNodes, content, metadata)

    // Create the knowledge node
    const node: KnowledgeNode = {
      id: this.generateId(),
      content,
      embedding,
      metadata,
      clusterId,
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date(),
      connections: [],
    }

    // Store in database
    await this.supabase.from('brain_nodes').insert({
      id: node.id,
      content: node.content,
      embedding: node.embedding,
      metadata: node.metadata,
      cluster_id: node.clusterId,
      created_at: node.createdAt,
      updated_at: node.updatedAt,
      access_count: node.accessCount,
      last_accessed: node.lastAccessed,
    })

    // Create connections to related nodes
    await this.createConnections(node, relatedNodes)

    // Update cluster if needed
    if (clusterId) {
      await this.updateCluster(clusterId, node)
    }

    return node
  }

  /**
   * Queries the brain for relevant information
   */
  async query(query: BrainQuery): Promise<BrainResult> {
    const { text, tenantId, roleId, limit = 10, includeClusters = true } = query

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(text)

    // Find relevant nodes
    const relevantNodes = await this.findRelevantNodes(queryEmbedding, tenantId, roleId, limit)

    // Get cluster information if requested
    let clusters: KnowledgeCluster[] = []
    if (includeClusters && relevantNodes.length > 0) {
      const clusterIds = [...new Set(relevantNodes.map(n => n.clusterId).filter(Boolean))]
      clusters = await this.getClusters(clusterIds as string[])
    }

    // Update access statistics
    await this.updateAccessStats(relevantNodes.map(n => n.id))

    return {
      nodes: relevantNodes,
      clusters,
      query: text,
      totalFound: relevantNodes.length,
    }
  }

  /**
   * Retrieves information by traversing knowledge graph connections
   */
  async traverse(
    startNodeId: string,
    depth: number = 2,
    direction: 'outgoing' | 'incoming' | 'both' = 'both'
  ): Promise<KnowledgeGraph> {
    const nodes = new Map<string, KnowledgeNode>()
    const edges = new Map<string, KnowledgeEdge>()

    // Start with the initial node
    const startNode = await this.getNode(startNodeId)
    if (!startNode) throw new Error(`Node ${startNodeId} not found`)

    nodes.set(startNodeId, startNode)

    // Traverse the graph
    await this.traverseFromNode(startNode, depth, direction, nodes, edges, new Set([startNodeId]))

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
    }
  }

  /**
   * Gets cluster information and related nodes
   */
  async getCluster(clusterId: string): Promise<KnowledgeCluster | null> {
    const { data, error } = await this.supabase
      .from('brain_clusters')
      .select('*')
      .eq('id', clusterId)
      .single()

    if (error || !data) return null

    // Get nodes in this cluster
    const { data: nodesData } = await this.supabase
      .from('brain_nodes')
      .select('*')
      .eq('cluster_id', clusterId)
      .order('access_count', { ascending: false })
      .limit(20)

    const nodes = nodesData?.map(this.mapDbNodeToKnowledgeNode) || []

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      centroid: data.centroid,
      nodeCount: data.node_count,
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      topNodes: nodes,
    }
  }

  /**
   * Consolidates and organizes clusters
   */
  async consolidateClusters(tenantId: string): Promise<void> {
    // Find clusters that are too large or too small
    const { data: clusters } = await this.supabase
      .from('brain_clusters')
      .select('*')
      .eq('tenant_id', tenantId)

    for (const cluster of clusters || []) {
      if (cluster.node_count > this.config.maxClusterSize) {
        await this.splitCluster(cluster.id)
      } else if (cluster.node_count < 3) {
        await this.mergeSmallCluster(cluster.id, tenantId)
      }
    }

    // Recompute centroids
    await this.recomputeCentroids(tenantId)
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.config.embeddingModel,
      input: text,
    })

    return response.data[0].embedding
  }

  private async findRelatedNodes(embedding: number[], tenantId: string, limit: number = 5): Promise<KnowledgeNode[]> {
    const { data, error } = await this.supabase.rpc('find_related_brain_nodes', {
      p_embedding: embedding,
      p_tenant_id: tenantId,
      p_limit: limit,
    })

    if (error) {
      console.error('Error finding related nodes:', error)
      return []
    }

    return data?.map(this.mapDbNodeToKnowledgeNode) || []
  }

  private async findRelevantNodes(
    embedding: number[],
    tenantId: string,
    roleId?: string,
    limit: number = 10
  ): Promise<KnowledgeNode[]> {
    let query = this.supabase
      .from('brain_nodes')
      .select('*')
      .eq('tenant_id', tenantId)

    if (roleId) {
      query = query.or(`role_id.is.null,role_id.eq.${roleId}`)
    }

    const { data, error } = await this.supabase.rpc('find_relevant_brain_nodes', {
      p_embedding: embedding,
      p_tenant_id: tenantId,
      p_role_id: roleId,
      p_limit: limit,
    })

    if (error) {
      console.error('Error finding relevant nodes:', error)
      return []
    }

    return data?.map(this.mapDbNodeToKnowledgeNode) || []
  }

  private async determineCluster(
    relatedNodes: KnowledgeNode[],
    content: string,
    metadata: any
  ): Promise<string | null> {
    if (relatedNodes.length === 0) {
      // Create new cluster
      return await this.createCluster(content, metadata)
    }

    // Check similarity to existing clusters
    const similarities = await Promise.all(
      relatedNodes
        .filter(n => n.clusterId)
        .map(async (node) => {
          const cluster = await this.getCluster(node.clusterId!)
          if (!cluster) return { clusterId: node.clusterId!, similarity: 0 }

          const similarity = this.cosineSimilarity(
            await this.generateEmbedding(content),
            cluster.centroid
          )
          return { clusterId: node.clusterId!, similarity }
        })
    )

    const bestMatch = similarities
      .filter(s => s.similarity > this.config.clusteringThreshold)
      .sort((a, b) => b.similarity - a.similarity)[0]

    return bestMatch?.clusterId || await this.createCluster(content, metadata)
  }

  private async createCluster(content: string, metadata: any): Promise<string> {
    const clusterId = this.generateId()
    const centroid = await this.generateEmbedding(content)

    // Generate cluster name using AI
    const clusterName = await this.generateClusterName(content, metadata.tags)

    await this.supabase.from('brain_clusters').insert({
      id: clusterId,
      name: clusterName,
      description: `Cluster containing information about ${metadata.type}`,
      centroid,
      node_count: 0,
      tags: metadata.tags,
      tenant_id: metadata.tenantId,
      created_at: new Date(),
      updated_at: new Date(),
    })

    return clusterId
  }

  private async generateClusterName(content: string, tags: string[]): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Generate a concise, descriptive name for a knowledge cluster based on the content and tags provided. Keep it under 50 characters.',
          },
          {
            role: 'user',
            content: `Content: ${content.substring(0, 200)}...\nTags: ${tags.join(', ')}`,
          },
        ],
        max_tokens: 20,
      })

      return response.choices[0].message.content?.trim() || 'Unnamed Cluster'
    } catch (error) {
      console.error('Error generating cluster name:', error)
      return `Cluster ${Date.now()}`
    }
  }

  private async createConnections(node: KnowledgeNode, relatedNodes: KnowledgeNode[]): Promise<void> {
    const connections: Array<{ source_id: string; target_id: string; strength: number; type: string }> = []

    for (const relatedNode of relatedNodes) {
      const strength = this.cosineSimilarity(node.embedding, relatedNode.embedding)

      if (strength > 0.3) { // Minimum connection threshold
        connections.push({
          source_id: node.id,
          target_id: relatedNode.id,
          strength,
          type: 'semantic_similarity',
        })
      }
    }

    if (connections.length > 0) {
      await this.supabase.from('brain_edges').insert(connections)
    }
  }

  private async updateCluster(clusterId: string, newNode: KnowledgeNode): Promise<void> {
    // Update node count and centroid
    const { data: clusterData } = await this.supabase
      .from('brain_clusters')
      .select('node_count, centroid')
      .eq('id', clusterId)
      .single()

    if (clusterData) {
      const newCount = clusterData.node_count + 1
      const newCentroid = this.updateCentroid(clusterData.centroid, newNode.embedding, newCount)

      await this.supabase
        .from('brain_clusters')
        .update({
          node_count: newCount,
          centroid: newCentroid,
          updated_at: new Date(),
        })
        .eq('id', clusterId)
    }
  }

  private async updateAccessStats(nodeIds: string[]): Promise<void> {
    await this.supabase
      .from('brain_nodes')
      .update({
        access_count: this.supabase.raw('access_count + 1'),
        last_accessed: new Date(),
      })
      .in('id', nodeIds)
  }

  private async traverseFromNode(
    node: KnowledgeNode,
    depth: number,
    direction: 'outgoing' | 'incoming' | 'both',
    nodes: Map<string, KnowledgeNode>,
    edges: Map<string, KnowledgeEdge>,
    visited: Set<string>
  ): Promise<void> {
    if (depth <= 0 || visited.has(node.id)) return

    visited.add(node.id)

    let edgeQuery = this.supabase.from('brain_edges').select('*')

    if (direction === 'outgoing') {
      edgeQuery = edgeQuery.eq('source_id', node.id)
    } else if (direction === 'incoming') {
      edgeQuery = edgeQuery.eq('target_id', node.id)
    } else {
      edgeQuery = edgeQuery.or(`source_id.eq.${node.id},target_id.eq.${node.id}`)
    }

    const { data: edgeData } = await edgeQuery

    for (const edgeRow of edgeData || []) {
      const edge: KnowledgeEdge = {
        id: edgeRow.id,
        sourceId: edgeRow.source_id,
        targetId: edgeRow.target_id,
        type: edgeRow.type,
        strength: edgeRow.strength,
        metadata: edgeRow.metadata,
      }

      edges.set(edge.id, edge)

      // Add connected nodes
      const connectedId = edge.sourceId === node.id ? edge.targetId : edge.sourceId
      if (!nodes.has(connectedId)) {
        const connectedNode = await this.getNode(connectedId)
        if (connectedNode) {
          nodes.set(connectedId, connectedNode)
          await this.traverseFromNode(connectedNode, depth - 1, direction, nodes, edges, visited)
        }
      }
    }
  }

  private async getNode(nodeId: string): Promise<KnowledgeNode | null> {
    const { data, error } = await this.supabase
      .from('brain_nodes')
      .select('*')
      .eq('id', nodeId)
      .single()

    if (error || !data) return null

    return this.mapDbNodeToKnowledgeNode(data)
  }

  private async getClusters(clusterIds: string[]): Promise<KnowledgeCluster[]> {
    if (clusterIds.length === 0) return []

    const { data, error } = await this.supabase
      .from('brain_clusters')
      .select('*')
      .in('id', clusterIds)

    if (error || !data) return []

    return data.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      centroid: row.centroid,
      nodeCount: row.node_count,
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      topNodes: [], // Will be populated separately if needed
    }))
  }

  private async splitCluster(clusterId: string): Promise<void> {
    // Implementation for splitting large clusters
    // This would use clustering algorithms to divide the cluster
    console.log(`Splitting cluster ${clusterId} - implementation needed`)
  }

  private async mergeSmallCluster(clusterId: string, tenantId: string): Promise<void> {
    // Implementation for merging small clusters
    console.log(`Merging small cluster ${clusterId} - implementation needed`)
  }

  private async recomputeCentroids(tenantId: string): Promise<void> {
    // Implementation for recomputing cluster centroids
    console.log(`Recomputing centroids for tenant ${tenantId} - implementation needed`)
  }

  private mapDbNodeToKnowledgeNode(data: any): KnowledgeNode {
    return {
      id: data.id,
      content: data.content,
      embedding: data.embedding,
      metadata: data.metadata,
      clusterId: data.cluster_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      accessCount: data.access_count,
      lastAccessed: new Date(data.last_accessed),
      connections: data.connections || [],
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) return 0

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  private updateCentroid(oldCentroid: number[], newVector: number[], newCount: number): number[] {
    // Online update of centroid: new_centroid = (old_centroid * (n-1) + new_vector) / n
    const oldWeight = newCount - 1
    const newCentroid = oldCentroid.map((val, i) =>
      (val * oldWeight + newVector[i]) / newCount
    )
    return newCentroid
  }

  private generateId(): string {
    return `brain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}