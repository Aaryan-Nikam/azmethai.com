import { SupabaseClient } from '@supabase/supabase-js'
import type { KnowledgeNode, KnowledgeCluster } from './types.js'

export interface ClusteringConfig {
  method: 'kmeans' | 'hierarchical' | 'dbscan'
  maxClusters: number
  minClusterSize: number
  similarityThreshold: number
  maxIterations: number
}

export class ClusteringEngine {
  private supabase: SupabaseClient
  private config: ClusteringConfig

  constructor(supabase: SupabaseClient, config: ClusteringConfig) {
    this.supabase = supabase
    this.config = config
  }

  /**
   * Clusters nodes based on their embeddings
   */
  async clusterNodes(nodes: KnowledgeNode[]): Promise<Map<string, string>> {
    if (nodes.length < this.config.minClusterSize) {
      return new Map() // No clustering needed
    }

    switch (this.config.method) {
      case 'kmeans':
        return this.kMeansClustering(nodes)
      case 'hierarchical':
        return this.hierarchicalClustering(nodes)
      case 'dbscan':
        return this.dbscanClustering(nodes)
      default:
        throw new Error(`Unknown clustering method: ${this.config.method}`)
    }
  }

  /**
   * Updates existing clusters with new nodes
   */
  async updateClusters(
    newNodes: KnowledgeNode[],
    existingClusters: KnowledgeCluster[]
  ): Promise<{ assignments: Map<string, string>; newClusters: KnowledgeCluster[] }> {
    const assignments = new Map<string, string>()
    const newClusters: KnowledgeCluster[] = []

    // Try to assign new nodes to existing clusters
    for (const node of newNodes) {
      let bestCluster: KnowledgeCluster | null = null
      let bestSimilarity = 0

      for (const cluster of existingClusters) {
        const similarity = this.cosineSimilarity(node.embedding, cluster.centroid)
        if (similarity > this.config.similarityThreshold && similarity > bestSimilarity) {
          bestCluster = cluster
          bestSimilarity = similarity
        }
      }

      if (bestCluster) {
        assignments.set(node.id, bestCluster.id)
        await this.updateClusterCentroid(bestCluster.id, node.embedding)
      } else {
        // Create new cluster for this node
        const newCluster = await this.createClusterFromNode(node)
        newClusters.push(newCluster)
        assignments.set(node.id, newCluster.id)
      }
    }

    return { assignments, newClusters }
  }

  /**
   * Splits a cluster that's too large
   */
  async splitCluster(clusterId: string): Promise<KnowledgeCluster[]> {
    // Get all nodes in the cluster
    const { data: nodesData } = await this.supabase
      .from('brain_nodes')
      .select('*')
      .eq('cluster_id', clusterId)

    if (!nodesData || nodesData.length <= this.config.minClusterSize) {
      return []
    }

    const nodes = nodesData.map(this.mapDbRowToNode)

    // Use k-means with k=2 to split into two clusters
    const subclusters = await this.kMeansClustering(nodes, 2)
    const newClusters: KnowledgeCluster[] = []

    // Create new clusters from the split
    const clusterGroups = new Map<string, KnowledgeNode[]>()
    for (const [nodeId, clusterId_] of subclusters) {
      if (!clusterGroups.has(clusterId_)) {
        clusterGroups.set(clusterId_, [])
      }
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        clusterGroups.get(clusterId_)!.push(node)
      }
    }

    for (const [_, clusterNodes] of clusterGroups) {
      if (clusterNodes.length >= this.config.minClusterSize) {
        const newCluster = await this.createClusterFromNodes(clusterNodes)
        newClusters.push(newCluster)

        // Update node assignments
        for (const node of clusterNodes) {
          await this.supabase
            .from('brain_nodes')
            .update({ cluster_id: newCluster.id })
            .eq('id', node.id)
        }
      }
    }

    // Remove the original cluster
    await this.supabase.from('brain_clusters').delete().eq('id', clusterId)

    return newClusters
  }

  /**
   * Merges small clusters
   */
  async mergeClusters(clusterIds: string[]): Promise<KnowledgeCluster | null> {
    if (clusterIds.length < 2) return null

    // Get all clusters
    const { data: clustersData } = await this.supabase
      .from('brain_clusters')
      .select('*')
      .in('id', clusterIds)

    if (!clustersData || clustersData.length < 2) return null

    // Get all nodes from these clusters
    const { data: nodesData } = await this.supabase
      .from('brain_nodes')
      .select('*')
      .in('cluster_id', clusterIds)

    const nodes = nodesData?.map(this.mapDbRowToNode) || []

    // Create merged cluster
    const mergedCluster = await this.createClusterFromNodes(nodes, `Merged from ${clusterIds.length} clusters`)

    // Update all nodes to point to new cluster
    await this.supabase
      .from('brain_nodes')
      .update({ cluster_id: mergedCluster.id })
      .in('cluster_id', clusterIds)

    // Delete old clusters
    await this.supabase.from('brain_clusters').delete().in('id', clusterIds)

    return mergedCluster
  }

  /**
   * Recomputes cluster centroids
   */
  async recomputeCentroids(clusterIds?: string[]): Promise<void> {
    let query = this.supabase.from('brain_clusters').select('id')

    if (clusterIds) {
      query = query.in('id', clusterIds)
    }

    const { data: clusters } = await query

    for (const cluster of clusters || []) {
      await this.recomputeCentroid(cluster.id)
    }
  }

  /**
   * Gets cluster quality metrics
   */
  async getClusterMetrics(clusterId: string): Promise<{
    cohesion: number
    separation: number
    silhouetteScore: number
  }> {
    // Get cluster and its nodes
    const cluster = await this.getCluster(clusterId)
    if (!cluster) throw new Error(`Cluster ${clusterId} not found`)

    const { data: nodesData } = await this.supabase
      .from('brain_nodes')
      .select('*')
      .eq('cluster_id', clusterId)

    if (!nodesData || nodesData.length === 0) {
      return { cohesion: 0, separation: 0, silhouetteScore: 0 }
    }

    const nodes = nodesData.map(this.mapDbRowToNode)

    // Calculate cohesion (average distance within cluster)
    let cohesion = 0
    let pairCount = 0
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        cohesion += this.cosineSimilarity(nodes[i].embedding, nodes[j].embedding)
        pairCount++
      }
    }
    cohesion = pairCount > 0 ? cohesion / pairCount : 0

    // Calculate separation (average distance to other clusters)
    const otherClusters = await this.getNearbyClusters(cluster.centroid, clusterId)
    let separation = 0
    if (otherClusters.length > 0) {
      for (const otherCluster of otherClusters) {
        separation += this.cosineSimilarity(cluster.centroid, otherCluster.centroid)
      }
      separation /= otherClusters.length
    }

    // Calculate silhouette score
    const silhouetteScore = this.calculateSilhouetteScore(nodes, cluster, otherClusters)

    return { cohesion, separation, silhouetteScore }
  }

  private async kMeansClustering(
    nodes: KnowledgeNode[],
    k: number = this.config.maxClusters
  ): Promise<Map<string, string>> {
    if (nodes.length < k) {
      k = Math.max(1, Math.floor(nodes.length / 2))
    }

    // Initialize centroids randomly
    const centroids = this.initializeCentroids(nodes, k)
    const assignments = new Map<string, string>()

    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      // Assign nodes to nearest centroid
      const newAssignments = new Map<string, string>()
      for (const node of nodes) {
        let bestCentroid = 0
        let bestSimilarity = -1

        for (let i = 0; i < centroids.length; i++) {
          const similarity = this.cosineSimilarity(node.embedding, centroids[i])
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestCentroid = i
          }
        }

        newAssignments.set(node.id, `temp_cluster_${bestCentroid}`)
      }

      // Update centroids
      const newCentroids = this.updateCentroids(nodes, newAssignments, k)
      centroids.splice(0, centroids.length, ...newCentroids)

      // Check for convergence
      if (this.assignmentsEqual(assignments, newAssignments)) {
        break
      }

      assignments.clear()
      for (const [nodeId, clusterId] of newAssignments) {
        assignments.set(nodeId, clusterId)
      }
    }

    return assignments
  }

  private async hierarchicalClustering(nodes: KnowledgeNode[]): Promise<Map<string, string>> {
    // Simplified hierarchical clustering
    const assignments = new Map<string, string>()

    // Start with each node in its own cluster
    for (const node of nodes) {
      assignments.set(node.id, `hierarchical_${node.id}`)
    }

    // Iteratively merge closest clusters until we reach target number
    while (assignments.size > this.config.maxClusters) {
      const clusters = this.groupNodesByCluster(assignments)
      if (clusters.size <= 1) break

      let closestPair: [string, string] | null = null
      let minDistance = Infinity

      // Find closest pair of clusters
      for (const [clusterId1, clusterNodes1] of clusters) {
        for (const [clusterId2, clusterNodes2] of clusters) {
          if (clusterId1 >= clusterId2) continue

          const distance = this.clusterDistance(clusterNodes1, clusterNodes2)
          if (distance < minDistance) {
            minDistance = distance
            closestPair = [clusterId1, clusterId2]
          }
        }
      }

      if (!closestPair || minDistance > 1 - this.config.similarityThreshold) break

      // Merge the closest pair
      const [keepId, removeId] = closestPair
      for (const [nodeId, clusterId] of assignments) {
        if (clusterId === removeId) {
          assignments.set(nodeId, keepId)
        }
      }
    }

    return assignments
  }

  private async dbscanClustering(nodes: KnowledgeNode[]): Promise<Map<string, string>> {
    const assignments = new Map<string, string>()
    const visited = new Set<string>()
    let clusterId = 0

    for (const node of nodes) {
      if (visited.has(node.id)) continue

      visited.add(node.id)
      const neighbors = this.findNeighbors(node, nodes, this.config.similarityThreshold)

      if (neighbors.length < this.config.minClusterSize) {
        assignments.set(node.id, 'noise')
        continue
      }

      // Start new cluster
      clusterId++
      const currentCluster = `dbscan_${clusterId}`
      assignments.set(node.id, currentCluster)

      // Expand cluster
      const seedSet = [...neighbors]
      for (let i = 0; i < seedSet.length; i++) {
        const seedNode = seedSet[i]

        if (!visited.has(seedNode.id)) {
          visited.add(seedNode.id)
          const seedNeighbors = this.findNeighbors(seedNode, nodes, this.config.similarityThreshold)

          if (seedNeighbors.length >= this.config.minClusterSize) {
            seedSet.push(...seedNeighbors.filter(n => !seedSet.some(s => s.id === n.id)))
          }
        }

        if (!assignments.has(seedNode.id) || assignments.get(seedNode.id) === 'noise') {
          assignments.set(seedNode.id, currentCluster)
        }
      }
    }

    return assignments
  }

  private initializeCentroids(nodes: KnowledgeNode[], k: number): number[][] {
    // Simple initialization: pick first k nodes
    return nodes.slice(0, k).map(node => [...node.embedding])
  }

  private updateCentroids(
    nodes: KnowledgeNode[],
    assignments: Map<string, string>,
    k: number
  ): number[][] {
    const centroids: number[][] = Array.from({ length: k }, () => [])
    const counts: number[] = Array(k).fill(0)

    for (const node of nodes) {
      const clusterIndex = parseInt(assignments.get(node.id)?.split('_').pop() || '0')
      if (clusterIndex < k) {
        if (centroids[clusterIndex].length === 0) {
          centroids[clusterIndex] = [...node.embedding]
        } else {
          // Add vectors element-wise
          for (let i = 0; i < node.embedding.length; i++) {
            centroids[clusterIndex][i] += node.embedding[i]
          }
        }
        counts[clusterIndex]++
      }
    }

    // Average the centroids
    for (let i = 0; i < k; i++) {
      if (counts[i] > 0) {
        for (let j = 0; j < centroids[i].length; j++) {
          centroids[i][j] /= counts[i]
        }
      }
    }

    return centroids
  }

  private assignmentsEqual(a: Map<string, string>, b: Map<string, string>): boolean {
    if (a.size !== b.size) return false
    for (const [key, value] of a) {
      if (b.get(key) !== value) return false
    }
    return true
  }

  private groupNodesByCluster(assignments: Map<string, string>): Map<string, KnowledgeNode[]> {
    const groups = new Map<string, KnowledgeNode[]>()

    for (const [nodeId, clusterId] of assignments) {
      if (!groups.has(clusterId)) {
        groups.set(clusterId, [])
      }
      // Note: This is a simplified version - in real implementation,
      // we'd need to look up the actual node objects
    }

    return groups
  }

  private clusterDistance(nodes1: KnowledgeNode[], nodes2: KnowledgeNode[]): number {
    let totalDistance = 0
    let count = 0

    for (const node1 of nodes1) {
      for (const node2 of nodes2) {
        totalDistance += 1 - this.cosineSimilarity(node1.embedding, node2.embedding)
        count++
      }
    }

    return count > 0 ? totalDistance / count : 0
  }

  private findNeighbors(node: KnowledgeNode, allNodes: KnowledgeNode[], threshold: number): KnowledgeNode[] {
    return allNodes.filter(other =>
      other.id !== node.id &&
      this.cosineSimilarity(node.embedding, other.embedding) >= threshold
    )
  }

  private async createClusterFromNode(node: KnowledgeNode): Promise<KnowledgeCluster> {
    return this.createClusterFromNodes([node])
  }

  private async createClusterFromNodes(
    nodes: KnowledgeNode[],
    name?: string
  ): Promise<KnowledgeCluster> {
    const centroid = this.calculateCentroid(nodes.map(n => n.embedding))
    const clusterId = this.generateId()

    // Generate cluster name if not provided
    const clusterName = name || await this.generateClusterName(nodes)

    const cluster: KnowledgeCluster = {
      id: clusterId,
      name: clusterName,
      description: `Cluster containing ${nodes.length} knowledge items`,
      centroid,
      nodeCount: nodes.length,
      tags: this.extractCommonTags(nodes),
      createdAt: new Date(),
      updatedAt: new Date(),
      topNodes: nodes.slice(0, 5), // Most recently accessed
    }

    await this.supabase.from('brain_clusters').insert({
      id: cluster.id,
      name: cluster.name,
      description: cluster.description,
      centroid: cluster.centroid,
      node_count: cluster.nodeCount,
      tags: cluster.tags,
      tenant_id: nodes[0]?.metadata.tenantId,
      created_at: cluster.createdAt,
      updated_at: cluster.updatedAt,
    })

    return cluster
  }

  private async generateClusterName(nodes: KnowledgeNode[]): Promise<string> {
    // Simple cluster naming based on common tags
    const tagCounts = new Map<string, number>()
    for (const node of nodes) {
      for (const tag of node.metadata.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag)

    return topTags.length > 0 ? topTags.join(', ') : 'General Knowledge'
  }

  private extractCommonTags(nodes: KnowledgeNode[]): string[] {
    const tagCounts = new Map<string, number>()
    for (const node of nodes) {
      for (const tag of node.metadata.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }

    // Return tags that appear in at least 30% of nodes
    const threshold = Math.max(1, Math.floor(nodes.length * 0.3))
    return Array.from(tagCounts.entries())
      .filter(([, count]) => count >= threshold)
      .map(([tag]) => tag)
  }

  private calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return []

    const dimension = embeddings[0].length
    const centroid = new Array(dimension).fill(0)

    for (const embedding of embeddings) {
      for (let i = 0; i < dimension; i++) {
        centroid[i] += embedding[i]
      }
    }

    for (let i = 0; i < dimension; i++) {
      centroid[i] /= embeddings.length
    }

    return centroid
  }

  private async updateClusterCentroid(clusterId: string, newEmbedding: number[]): Promise<void> {
    const { data: clusterData } = await this.supabase
      .from('brain_clusters')
      .select('centroid, node_count')
      .eq('id', clusterId)
      .single()

    if (clusterData) {
      const newCentroid = this.updateCentroid(
        clusterData.centroid,
        newEmbedding,
        clusterData.node_count
      )

      await this.supabase
        .from('brain_clusters')
        .update({
          centroid: newCentroid,
          node_count: clusterData.node_count + 1,
          updated_at: new Date(),
        })
        .eq('id', clusterId)
    }
  }

  private updateCentroid(oldCentroid: number[], newVector: number[], count: number): number[] {
    // Online centroid update: new_centroid = (old_centroid * count + new_vector) / (count + 1)
    return oldCentroid.map((val, i) => (val * count + newVector[i]) / (count + 1))
  }

  private async recomputeCentroid(clusterId: string): Promise<void> {
    const { data: nodesData } = await this.supabase
      .from('brain_nodes')
      .select('embedding')
      .eq('cluster_id', clusterId)

    if (nodesData && nodesData.length > 0) {
      const embeddings = nodesData.map(row => row.embedding)
      const newCentroid = this.calculateCentroid(embeddings)

      await this.supabase
        .from('brain_clusters')
        .update({
          centroid: newCentroid,
          node_count: nodesData.length,
          updated_at: new Date(),
        })
        .eq('id', clusterId)
    }
  }

  private async getCluster(clusterId: string): Promise<KnowledgeCluster | null> {
    const { data, error } = await this.supabase
      .from('brain_clusters')
      .select('*')
      .eq('id', clusterId)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      centroid: data.centroid,
      nodeCount: data.node_count,
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      topNodes: [], // Would need separate query
    }
  }

  private async getNearbyClusters(centroid: number[], excludeId?: string): Promise<KnowledgeCluster[]> {
    // Simplified - would need a more sophisticated query in practice
    const { data } = await this.supabase
      .from('brain_clusters')
      .select('*')
      .neq('id', excludeId || '')
      .limit(5)

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      centroid: row.centroid,
      nodeCount: row.node_count,
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      topNodes: [],
    }))
  }

  private calculateSilhouetteScore(
    nodes: KnowledgeNode[],
    cluster: KnowledgeCluster,
    otherClusters: KnowledgeCluster[]
  ): number {
    if (nodes.length <= 1) return 0

    let totalScore = 0

    for (const node of nodes) {
      // Calculate cohesion (average distance to other points in same cluster)
      const sameClusterDistances = nodes
        .filter(n => n.id !== node.id)
        .map(n => 1 - this.cosineSimilarity(node.embedding, n.embedding))

      const cohesion = sameClusterDistances.length > 0
        ? sameClusterDistances.reduce((a, b) => a + b, 0) / sameClusterDistances.length
        : 0

      // Calculate separation (average distance to points in other clusters)
      let separation = 0
      if (otherClusters.length > 0) {
        const otherDistances: number[] = []
        for (const otherCluster of otherClusters) {
          // Simplified: distance to centroid
          otherDistances.push(1 - this.cosineSimilarity(node.embedding, otherCluster.centroid))
        }
        separation = Math.min(...otherDistances)
      }

      // Silhouette score for this point
      const silhouette = (separation - cohesion) / Math.max(separation, cohesion)
      totalScore += isNaN(silhouette) ? 0 : silhouette
    }

    return totalScore / nodes.length
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

  private mapDbRowToNode(data: any): KnowledgeNode {
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

  private generateId(): string {
    return `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}