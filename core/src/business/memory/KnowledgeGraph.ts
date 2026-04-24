import { SupabaseClient } from '@supabase/supabase-js'
import type { KnowledgeNode, KnowledgeEdge, KnowledgeGraph, BrainTraversalOptions } from './types.js'

export class KnowledgeGraph {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Adds a new node to the knowledge graph
   */
  async addNode(node: Omit<KnowledgeNode, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed' | 'connections'>): Promise<KnowledgeNode> {
    const newNode: KnowledgeNode = {
      ...node,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date(),
      connections: [],
    }

    await this.supabase.from('brain_nodes').insert({
      id: newNode.id,
      content: newNode.content,
      embedding: newNode.embedding,
      metadata: newNode.metadata,
      cluster_id: newNode.clusterId,
      created_at: newNode.createdAt,
      updated_at: newNode.updatedAt,
      access_count: newNode.accessCount,
      last_accessed: newNode.lastAccessed,
    })

    return newNode
  }

  /**
   * Adds an edge between two nodes
   */
  async addEdge(edge: Omit<KnowledgeEdge, 'id'>): Promise<KnowledgeEdge> {
    const newEdge: KnowledgeEdge = {
      ...edge,
      id: this.generateId(),
    }

    await this.supabase.from('brain_edges').insert({
      id: newEdge.id,
      source_id: newEdge.sourceId,
      target_id: newEdge.targetId,
      type: newEdge.type,
      strength: newEdge.strength,
      metadata: newEdge.metadata,
    })

    // Update connections in nodes
    await this.updateNodeConnections(newEdge.sourceId, newEdge.targetId)
    await this.updateNodeConnections(newEdge.targetId, newEdge.sourceId)

    return newEdge
  }

  /**
   * Traverses the knowledge graph from a starting node
   */
  async traverse(options: BrainTraversalOptions): Promise<KnowledgeGraph> {
    const {
      startNodeId,
      depth = 2,
      direction = 'both',
      maxNodes = 50,
      relationshipTypes
    } = options

    const nodes = new Map<string, KnowledgeNode>()
    const edges = new Map<string, KnowledgeEdge>()
    const visited = new Set<string>()

    // Start with the initial node
    const startNode = await this.getNode(startNodeId)
    if (!startNode) {
      throw new Error(`Start node ${startNodeId} not found`)
    }

    nodes.set(startNodeId, startNode)
    await this.traverseFromNode(
      startNode,
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
   * Finds paths between two nodes
   */
  async findPaths(
    startNodeId: string,
    endNodeId: string,
    maxDepth: number = 5,
    maxPaths: number = 10
  ): Promise<Array<{ path: KnowledgeNode[]; edges: KnowledgeEdge[]; totalStrength: number }>> {
    const paths: Array<{ path: KnowledgeNode[]; edges: KnowledgeEdge[]; totalStrength: number }> = []

    const startNode = await this.getNode(startNodeId)
    const endNode = await this.getNode(endNodeId)

    if (!startNode || !endNode) {
      return paths
    }

    await this.dfsPaths(
      startNode,
      endNode,
      [startNode],
      [],
      0,
      maxDepth,
      paths,
      maxPaths,
      new Set()
    )

    // Sort by total strength (descending)
    return paths.sort((a, b) => b.totalStrength - a.totalStrength)
  }

  /**
   * Gets nodes connected to a given node
   */
  async getConnectedNodes(
    nodeId: string,
    relationshipTypes?: KnowledgeEdge['type'][],
    limit: number = 20
  ): Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }> {
    let query = this.supabase
      .from('brain_edges')
      .select('*')
      .or(`source_id.eq.${nodeId},target_id.eq.${nodeId}`)

    if (relationshipTypes && relationshipTypes.length > 0) {
      query = query.in('type', relationshipTypes)
    }

    const { data: edgesData } = await query.limit(limit)

    if (!edgesData || edgesData.length === 0) {
      return { nodes: [], edges: [] }
    }

    const edges: KnowledgeEdge[] = edgesData.map(row => ({
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      type: row.type,
      strength: row.strength,
      metadata: row.metadata,
    }))

    // Get unique node IDs
    const nodeIds = new Set<string>()
    edges.forEach(edge => {
      nodeIds.add(edge.sourceId)
      nodeIds.add(edge.targetId)
    })
    nodeIds.delete(nodeId) // Remove the original node

    // Fetch nodes
    const { data: nodesData } = await this.supabase
      .from('brain_nodes')
      .select('*')
      .in('id', Array.from(nodeIds))

    const nodes: KnowledgeNode[] = (nodesData || []).map(this.mapDbRowToNode)

    return { nodes, edges }
  }

  /**
   * Updates the strength of an edge
   */
  async updateEdgeStrength(edgeId: string, newStrength: number): Promise<void> {
    await this.supabase
      .from('brain_edges')
      .update({
        strength: newStrength,
        updated_at: new Date(),
      })
      .eq('id', edgeId)
  }

  /**
   * Removes an edge from the graph
   */
  async removeEdge(edgeId: string): Promise<void> {
    // Get edge info before deletion
    const { data: edgeData } = await this.supabase
      .from('brain_edges')
      .select('source_id, target_id')
      .eq('id', edgeId)
      .single()

    if (edgeData) {
      // Remove the edge
      await this.supabase.from('brain_edges').delete().eq('id', edgeId)

      // Update node connections
      await this.updateNodeConnections(edgeData.source_id, edgeData.target_id, true)
      await this.updateNodeConnections(edgeData.target_id, edgeData.source_id, true)
    }
  }

  /**
   * Gets graph statistics
   */
  async getStatistics(tenantId: string): Promise<{
    nodeCount: number
    edgeCount: number
    averageDegree: number
    connectedComponents: number
    mostConnectedNodes: Array<{ node: KnowledgeNode; degree: number }>
  }> {
    // Get node and edge counts
    const { count: nodeCount } = await this.supabase
      .from('brain_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('metadata->>tenantId', tenantId)

    const { count: edgeCount } = await this.supabase
      .from('brain_edges')
      .select('*', { count: 'exact', head: true })

    // Calculate degrees and find most connected nodes
    const { data: degreeData } = await this.supabase
      .from('brain_nodes')
      .select(`
        id,
        connections
      `)
      .eq('metadata->>tenantId', tenantId)

    const degrees = (degreeData || []).map(row => ({
      nodeId: row.id,
      degree: (row.connections || []).length,
    }))

    const mostConnected = degrees
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 10)

    // Get the actual nodes for most connected
    const mostConnectedNodes = await Promise.all(
      mostConnected.map(async ({ nodeId, degree }) => {
        const node = await this.getNode(nodeId)
        return { node: node!, degree }
      })
    )

    const averageDegree = degrees.length > 0
      ? degrees.reduce((sum, d) => sum + d.degree, 0) / degrees.length
      : 0

    return {
      nodeCount: nodeCount || 0,
      edgeCount: edgeCount || 0,
      averageDegree,
      connectedComponents: 0, // Would need more complex analysis
      mostConnectedNodes,
    }
  }

  private async traverseFromNode(
    node: KnowledgeNode,
    depth: number,
    direction: 'outgoing' | 'incoming' | 'both',
    relationshipTypes: KnowledgeEdge['type'][] | undefined,
    nodes: Map<string, KnowledgeNode>,
    edges: Map<string, KnowledgeEdge>,
    visited: Set<string>,
    maxNodes: number
  ): Promise<void> {
    if (depth <= 0 || visited.has(node.id) || nodes.size >= maxNodes) {
      return
    }

    visited.add(node.id)

    let edgeQuery = this.supabase.from('brain_edges').select('*')

    if (direction === 'outgoing') {
      edgeQuery = edgeQuery.eq('source_id', node.id)
    } else if (direction === 'incoming') {
      edgeQuery = edgeQuery.eq('target_id', node.id)
    } else {
      edgeQuery = edgeQuery.or(`source_id.eq.${node.id},target_id.eq.${node.id}`)
    }

    if (relationshipTypes && relationshipTypes.length > 0) {
      edgeQuery = edgeQuery.in('type', relationshipTypes)
    }

    const { data: edgeData } = await edgeQuery

    for (const edgeRow of edgeData || []) {
      if (edges.size >= maxNodes * 2) break // Limit edges too

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
      if (!nodes.has(connectedId) && nodes.size < maxNodes) {
        const connectedNode = await this.getNode(connectedId)
        if (connectedNode) {
          nodes.set(connectedId, connectedNode)
          await this.traverseFromNode(
            connectedNode,
            depth - 1,
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

  private async dfsPaths(
    current: KnowledgeNode,
    target: KnowledgeNode,
    path: KnowledgeNode[],
    pathEdges: KnowledgeEdge[],
    currentStrength: number,
    maxDepth: number,
    results: Array<{ path: KnowledgeNode[]; edges: KnowledgeEdge[]; totalStrength: number }>,
    maxPaths: number,
    visited: Set<string>
  ): Promise<void> {
    if (path.length > maxDepth || results.length >= maxPaths) {
      return
    }

    if (current.id === target.id) {
      results.push({
        path: [...path],
        edges: [...pathEdges],
        totalStrength: currentStrength,
      })
      return
    }

    visited.add(current.id)

    // Get edges from current node
    const { data: edgeData } = await this.supabase
      .from('brain_edges')
      .select('*')
      .eq('source_id', current.id)

    for (const edgeRow of edgeData || []) {
      const nextNodeId = edgeRow.target_id

      if (visited.has(nextNodeId)) continue

      const nextNode = await this.getNode(nextNodeId)
      if (!nextNode) continue

      const edge: KnowledgeEdge = {
        id: edgeRow.id,
        sourceId: edgeRow.source_id,
        targetId: edgeRow.target_id,
        type: edgeRow.type,
        strength: edgeRow.strength,
        metadata: edgeRow.metadata,
      }

      await this.dfsPaths(
        nextNode,
        target,
        [...path, nextNode],
        [...pathEdges, edge],
        currentStrength + edge.strength,
        maxDepth,
        results,
        maxPaths,
        new Set(visited)
      )
    }

    visited.delete(current.id)
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

  private async updateNodeConnections(nodeId: string, connectedNodeId: string, remove: boolean = false): Promise<void> {
    // Get current connections
    const { data: nodeData } = await this.supabase
      .from('brain_nodes')
      .select('connections')
      .eq('id', nodeId)
      .single()

    if (!nodeData) return

    let connections = nodeData.connections || []

    if (remove) {
      connections = connections.filter((id: string) => id !== connectedNodeId)
    } else if (!connections.includes(connectedNodeId)) {
      connections.push(connectedNodeId)
    }

    await this.supabase
      .from('brain_nodes')
      .update({ connections })
      .eq('id', nodeId)
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
    return `kg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}