export interface KnowledgeNode {
  id: string
  content: string
  embedding: number[]
  metadata: KnowledgeMetadata
  clusterId: string | null
  createdAt: Date
  updatedAt: Date
  accessCount: number
  lastAccessed: Date
  connections: string[] // IDs of connected nodes
}

export interface KnowledgeEdge {
  id: string
  sourceId: string
  targetId: string
  type: 'semantic_similarity' | 'temporal_sequence' | 'causal_link' | 'hierarchical'
  strength: number
  metadata?: Record<string, any>
}

export interface KnowledgeCluster {
  id: string
  name: string
  description: string
  centroid: number[]
  nodeCount: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
  topNodes: KnowledgeNode[]
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

export interface KnowledgeMetadata {
  source: string
  type: 'fact' | 'concept' | 'procedure' | 'experience'
  tags: string[]
  importance: number
  tenantId: string
  roleId?: string
}

export interface BrainQuery {
  text: string
  tenantId: string
  roleId?: string
  limit?: number
  includeClusters?: boolean
  filters?: {
    types?: KnowledgeMetadata['type'][]
    tags?: string[]
    dateRange?: {
      start: Date
      end: Date
    }
    minImportance?: number
  }
}

export interface BrainResult {
  nodes: KnowledgeNode[]
  clusters: KnowledgeCluster[]
  query: string
  totalFound: number
  executionTime?: number
}

export interface BrainTraversalOptions {
  startNodeId: string
  depth?: number
  direction?: 'outgoing' | 'incoming' | 'both'
  maxNodes?: number
  relationshipTypes?: KnowledgeEdge['type'][]
}

export interface BrainConsolidationOptions {
  tenantId: string
  maxClusterSize?: number
  minClusterSize?: number
  similarityThreshold?: number
  forceRecompute?: boolean
}

export interface BrainAnalytics {
  totalNodes: number
  totalClusters: number
  averageClusterSize: number
  mostActiveNodes: KnowledgeNode[]
  knowledgeGaps: string[]
  coverageByType: Record<KnowledgeMetadata['type'], number>
  temporalDistribution: Array<{
    period: string
    nodeCount: number
  }>
}