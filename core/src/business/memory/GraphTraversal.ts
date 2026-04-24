import { SupabaseClient } from '@supabase/supabase-js'
import type { KnowledgeNode, KnowledgeEdge, KnowledgeGraph, BrainTraversalOptions } from './types.js'

export interface TraversalConfig {
  maxDepth: number
  maxNodes: number
  maxEdges: number
  relationshipWeights: Record<KnowledgeEdge['type'], number>
  directionPenalty: Record<'outgoing' | 'incoming' | 'both', number>
}

export class GraphTraversal {
  private supabase: SupabaseClient
  private config: TraversalConfig

  constructor(supabase: SupabaseClient, config: TraversalConfig) {
    this.supabase = supabase
    this.config = config
  }

  /**
   * Performs breadth-first traversal of the knowledge graph
   */
  async breadthFirstTraversal(options: BrainTraversalOptions): Promise<KnowledgeGraph> {
    const {
      startNodeId,
      depth = this.config.maxDepth,
      direction = 'both',
      maxNodes = this.config.maxNodes,
      relationshipTypes
    } = options

    const nodes = new Map<string, KnowledgeNode>()
    const edges = new Map<string, KnowledgeEdge>()
    const visited = new Set<string>()
    const queue: Array<{ nodeId: string; currentDepth: number }> = []

    // Start with the initial node
    const startNode = await this.getNode(startNodeId)
    if (!startNode) {
      throw new Error(`Start node ${startNodeId} not found`)
    }

    nodes.set(startNodeId, startNode)
    visited.add(startNodeId)
    queue.push({ nodeId: startNodeId, currentDepth: 0 })

    while (queue.length > 0 && nodes.size < maxNodes) {
      const { nodeId, currentDepth } = queue.shift()!
      if (currentDepth >= depth) continue

      // Get edges from current node
      const nodeEdges = await this.getNodeEdges(nodeId, direction, relationshipTypes)
      for (const edge of nodeEdges) {
        if (edges.size >= this.config.maxEdges) break

        edges.set(edge.id, edge)

        // Add connected node if not visited
        const connectedId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId
        if (!visited.has(connectedId) && nodes.size < maxNodes) {
          const connectedNode = await this.getNode(connectedId)
          if (connectedNode) {
            nodes.set(connectedId, connectedNode)
            visited.add(connectedId)
            queue.push({ nodeId: connectedId, currentDepth: currentDepth + 1 })
          }
        }
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
    }
  }

  /**
   * Performs depth-first traversal of the knowledge graph
   */
  async depthFirstTraversal(options: BrainTraversalOptions): Promise<KnowledgeGraph> {
    const {
      startNodeId,
      depth = this.config.maxDepth,
      direction = 'both',
      maxNodes = this.config.maxNodes,
      relationshipTypes
    } = options

    const nodes = new Map<string, KnowledgeNode>()
    const edges = new Map<string, KnowledgeEdge>()
    const visited = new Set<string>()

    const startNode = await this.getNode(startNodeId)
    if (!startNode) {
      throw new Error(`Start node ${startNodeId} not found`)
    }

    await this.dfsTraversal(
      startNode,
      0,
      depth,
      direction,
      relationshipTypes,
      nodes,
      edges,
      visited,
      maxNodes
    )

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
    }
  }

  /**
   * Finds shortest paths between nodes using weighted relationships
   */
  async findShortestPaths(
    startNodeId: string,
    endNodeId: string,
    maxDepth: number = 10
  ): Promise<Array<{ path: KnowledgeNode[]; edges: KnowledgeEdge[]; totalWeight: number }>> {
    const distances = new Map<string, number>()
    const previous = new Map<string, { node: KnowledgeNode; edge: KnowledgeEdge }>()
    const unvisited = new Set<string>()

    // Initialize
    const startNode = await this.getNode(startNodeId)
    if (!startNode) throw new Error(`Start node ${startNodeId} not found`)

    distances.set(startNodeId, 0)
    unvisited.add(startNodeId)

    while (unvisited.size > 0) {
      // Find node with smallest distance
      let currentId: string | null = null
      let currentDistance = Infinity

      for (const nodeId of unvisited) {
        const distance = distances.get(nodeId) || Infinity
        if (distance < currentDistance) {
          currentDistance = distance
          currentId = nodeId
        }
      }

      if (!currentId || currentDistance === Infinity) break
      if (currentId === endNodeId) break

      unvisited.delete(currentId)
      const currentNode = await this.getNode(currentId)
      if (!currentNode) continue

      // Get neighbors
      const edges = await this.getNodeEdges(currentId, 'both')
      for (const edge of edges) {
        const neighborId = edge.sourceId === currentId ? edge.targetId : edge.sourceId
        if (unvisited.has(neighborId)) continue

        const weight = this.calculateEdgeWeight(edge)
        const newDistance = currentDistance + weight

        if (newDistance < (distances.get(neighborId) || Infinity)) {
          distances.set(neighborId, newDistance)
          previous.set(neighborId, { node: currentNode, edge })
          unvisited.add(neighborId)
        }
      }
    }

    // Reconstruct path
    if (!distances.has(endNodeId)) {
      return [] // No path found
    }

    const path: KnowledgeNode[] = []
    const pathEdges: KnowledgeEdge[] = []
    let currentId = endNodeId

    while (currentId !== startNodeId) {
      const prev = previous.get(currentId)
      if (!prev) break

      path.unshift(prev.node)
      pathEdges.unshift(prev.edge)
      currentId = prev.node.id
    }

    path.unshift(startNode)

    return [{
      path,
      edges: pathEdges,
      totalWeight: distances.get(endNodeId)!,
    }]
  }

  /**
   * Performs weighted random walk traversal
   */
  async randomWalkTraversal(
    startNodeId: string,
    steps: number = 20,
    restartProbability: number = 0.1
  ): Promise<KnowledgeGraph> {
    const nodes = new Map<string, KnowledgeNode>()
    const edges = new Map<string, KnowledgeEdge>()

    let currentId = startNodeId
    const startNode = await this.getNode(currentId)
    if (!startNode) throw new Error(`Start node ${startNodeId} not found`)

    nodes.set(currentId, startNode)

    for (let step = 0; step < steps; step++) {
      // Check for restart
      if (Math.random() < restartProbability) {
        currentId = startNodeId
        continue
      }

      // Get available edges
      const availableEdges = await this.getNodeEdges(currentId, 'outgoing')
      if (availableEdges.length === 0) break

      // Weighted random selection
      const totalWeight = availableEdges.reduce((sum, edge) => sum + this.calculateEdgeWeight(edge), 0)
      let random = Math.random() * totalWeight

      let selectedEdge: KnowledgeEdge | null = null
      for (const edge of availableEdges) {
        random -= this.calculateEdgeWeight(edge)
        if (random <= 0) {
          selectedEdge = edge
          break
        }
      }

      if (!selectedEdge) continue

      edges.set(selectedEdge.id, selectedEdge)
      currentId = selectedEdge.targetId

      // Add new node if not already visited
      if (!nodes.has(currentId)) {
        const newNode = await this.getNode(currentId)
        if (newNode) {
          nodes.set(currentId, newNode)
        }
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
    }
  }

  /**
   * Finds communities using graph traversal patterns
   */
  async findCommunities(maxCommunities: number = 10): Promise<Array<{
    communityId: string
    nodes: KnowledgeNode[]
    cohesion: number
  }>> {
    const communities: Array<{
      communityId: string
      nodes: KnowledgeNode[]
      cohesion: number
    }> = []

    // Get all nodes
    const { data: nodesData } = await this.supabase
      .from('brain_nodes')
      .select('*')
      .limit(1000) // Limit for performance

    if (!nodesData) return communities

    const allNodes = nodesData.map(this.mapDbRowToNode)
    const processed = new Set<string>()

    for (const startNode of allNodes) {
      if (processed.has(startNode.id) || communities.length >= maxCommunities) continue

      // Perform community detection using label propagation
      const community = await this.labelPropagationCommunity(startNode, allNodes, processed)
      if (community.nodes.length > 1) {
        communities.push(community)
      }
    }

    return communities.sort((a, b) => b.cohesion - a.cohesion)
  }

  /**
   * Calculates centrality measures for nodes
   */
  async calculateCentrality(): Promise<Map<string, {
    degree: number
    betweenness: number
    closeness: number
  }>> {
    const centrality = new Map<string, {
      degree: number
      betweenness: number
      closeness: number
    }>()

    // Get all nodes and edges
    const { data: nodesData } = await this.supabase
      .from('brain_nodes')
      .select('id')
      .limit(500) // Limit for performance

    const { data: edgesData } = await this.supabase
      .from('brain_edges')
      .select('*')
      .limit(2000)

    if (!nodesData || !edgesData) return centrality

    const nodeIds = nodesData.map(row => row.id)
    const edges = edgesData.map(row => ({
      source: row.source_id,
      target: row.target_id,
      weight: this.calculateEdgeWeight({
        id: row.id,
        sourceId: row.source_id,
        targetId: row.target_id,
        type: row.type,
        strength: row.strength,
        metadata: row.metadata,
      }),
    }))

    // Calculate degree centrality
    const degreeMap = new Map<string, number>()
    for (const nodeId of nodeIds) {
      const degree = edges.filter(e => e.source === nodeId || e.target === nodeId).length
      degreeMap.set(nodeId, degree)
    }

    // Calculate betweenness centrality (simplified)
    const betweennessMap = new Map<string, number>()
    for (const nodeId of nodeIds) {
      let betweenness = 0
      // Count shortest paths that pass through this node
      for (const sourceId of nodeIds) {
        if (sourceId === nodeId) continue
        for (const targetId of nodeIds) {
          if (targetId === nodeId || targetId === sourceId) continue

          const pathsThroughNode = await this.countPathsThroughNode(sourceId, targetId, nodeId)
          const totalPaths = await this.countTotalPaths(sourceId, targetId)

          if (totalPaths > 0) {
            betweenness += pathsThroughNode / totalPaths
          }
        }
      }
      betweennessMap.set(nodeId, betweenness)
    }

    // Calculate closeness centrality
    const closenessMap = new Map<string, number>()
    for (const nodeId of nodeIds) {
      let totalDistance = 0
      let reachableCount = 0

      for (const targetId of nodeIds) {
        if (targetId === nodeId) continue

        const paths = await this.findShortestPaths(nodeId, targetId, 5)
        if (paths.length > 0) {
          totalDistance += paths[0].totalWeight
          reachableCount++
        }
      }

      const closeness = reachableCount > 0 ? reachableCount / totalDistance : 0
      closenessMap.set(nodeId, closeness)
    }

    // Combine results
    for (const nodeId of nodeIds) {
      centrality.set(nodeId, {
        degree: degreeMap.get(nodeId) || 0,
        betweenness: betweennessMap.get(nodeId) || 0,
        closeness: closenessMap.get(nodeId) || 0,
      })
    }

    return centrality
  }

  private async dfsTraversal(
    node: KnowledgeNode,
    currentDepth: number,
    maxDepth: number,
    direction: 'outgoing' | 'incoming' | 'both',
    relationshipTypes: KnowledgeEdge['type'][] | undefined,
    nodes: Map<string, KnowledgeNode>,
    edges: Map<string, KnowledgeEdge>,
    visited: Set<string>,
    maxNodes: number
  ): Promise<void> {
    if (currentDepth >= maxDepth || nodes.size >= maxNodes) return

    visited.add(node.id)

    const nodeEdges = await this.getNodeEdges(node.id, direction, relationshipTypes)
    for (const edge of nodeEdges) {
      if (edges.size >= this.config.maxEdges) break

      edges.set(edge.id, edge)

      const connectedId = edge.sourceId === node.id ? edge.targetId : edge.sourceId
      if (!visited.has(connectedId) && nodes.size < maxNodes) {
        const connectedNode = await this.getNode(connectedId)
        if (connectedNode) {
          nodes.set(connectedId, connectedNode)
          await this.dfsTraversal(
            connectedNode,
            currentDepth + 1,
            maxDepth,
            direction,
            relationshipTypes,
            nodes,
            edges,
            visited,
            maxNodes
          )
        }
      }
    }
  }

  private async getNodeEdges(
    nodeId: string,
    direction: 'outgoing' | 'incoming' | 'both' = 'both',
    relationshipTypes?: KnowledgeEdge['type'][]
  ): Promise<KnowledgeEdge[]> {
    let query = this.supabase.from('brain_edges').select('*')

    if (direction === 'outgoing') {
      query = query.eq('source_id', nodeId)
    } else if (direction === 'incoming') {
      query = query.eq('target_id', nodeId)
    } else {
      query = query.or(`source_id.eq.${nodeId},target_id.eq.${nodeId}`)
    }

    if (relationshipTypes && relationshipTypes.length > 0) {
      query = query.in('type', relationshipTypes)
    }

    const { data } = await query.order('strength', { ascending: false })

    return (data || []).map(row => ({
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      type: row.type,
      strength: row.strength,
      metadata: row.metadata,
    }))
  }

  private calculateEdgeWeight(edge: KnowledgeEdge): number {
    const typeWeight = this.config.relationshipWeights[edge.type] || 1
    return (1 / (1 + Math.exp(-edge.strength))) * typeWeight // Sigmoid normalization
  }

  private async labelPropagationCommunity(
    startNode: KnowledgeNode,
    allNodes: KnowledgeNode[],
    processed: Set<string>
  ): Promise<{ communityId: string; nodes: KnowledgeNode[]; cohesion: number }> {
    const community = new Set<KnowledgeNode>([startNode])
    const visited = new Set<string>([startNode.id])
    const queue = [startNode]

    // Expand community through strong connections
    while (queue.length > 0) {
      const currentNode = queue.shift()!
      const edges = await this.getNodeEdges(currentNode.id, 'both')

      for (const edge of edges) {
        if (edge.strength < 0.7) continue // Only strong connections

        const neighborId = edge.sourceId === currentNode.id ? edge.targetId : edge.sourceId
        if (visited.has(neighborId)) continue

        const neighborNode = allNodes.find(n => n.id === neighborId)
        if (!neighborNode) continue

        community.add(neighborNode)
        visited.add(neighborId)
        queue.push(neighborNode)
      }
    }

    // Mark as processed
    for (const node of community) {
      processed.add(node.id)
    }

    // Calculate cohesion
    const cohesion = await this.calculateCommunityCohesion(Array.from(community))

    return {
      communityId: `community_${startNode.id}`,
      nodes: Array.from(community),
      cohesion,
    }
  }

  private async calculateCommunityCohesion(nodes: KnowledgeNode[]): Promise<number> {
    if (nodes.length <= 1) return 1

    let totalStrength = 0
    let connectionCount = 0

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const edges = await this.getNodeEdges(nodes[i].id, 'both')
        const connection = edges.find(e =>
          (e.sourceId === nodes[j].id || e.targetId === nodes[j].id)
        )

        if (connection) {
          totalStrength += connection.strength
          connectionCount++
        }
      }
    }

    return connectionCount > 0 ? totalStrength / connectionCount : 0
  }

  private async countPathsThroughNode(
    sourceId: string,
    targetId: string,
    throughNodeId: string
  ): Promise<number> {
    // Simplified - would need full path enumeration
    return 0
  }

  private async countTotalPaths(sourceId: string, targetId: string): Promise<number> {
    // Simplified - would need full path enumeration
    return 1
  }

  private async getNode(nodeId: string): Promise<KnowledgeNode | null> {
    const { data, error } = await this.supabase
      .from('brain_nodes')
      .select('*')
      .eq('id', nodeId)
      .single()

    if (error || !data) return null

    return this.mapDbRowToNode(data)
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
}