import type { KnowledgeGraph, KnowledgeNode, KnowledgeEdge, KnowledgeCluster } from './types.js'

export interface VisualizationOptions {
  layout: 'force' | 'circular' | 'hierarchical' | 'cluster'
  width: number
  height: number
  showLabels: boolean
  showEdges: boolean
  nodeSize: 'fixed' | 'importance' | 'connections'
  colorScheme: 'type' | 'cluster' | 'importance'
  interactive: boolean
}

export interface VisualizationData {
  nodes: Array<{
    id: string
    label: string
    x: number
    y: number
    size: number
    color: string
    type: string
    cluster?: string
    importance: number
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    strength: number
    type: string
    label?: string
  }>
  clusters?: Array<{
    id: string
    name: string
    color: string
    nodes: string[]
  }>
}

export class BrainVisualizer {
  private options: VisualizationOptions

  constructor(options: Partial<VisualizationOptions> = {}) {
    this.options = {
      layout: 'force',
      width: 800,
      height: 600,
      showLabels: true,
      showEdges: true,
      nodeSize: 'importance',
      colorScheme: 'type',
      interactive: true,
      ...options,
    }
  }

  /**
   * Generates visualization data for a knowledge graph
   */
  generateVisualization(graph: KnowledgeGraph): VisualizationData {
    const positions = this.calculateLayout(graph, this.options.layout)
    const nodeData = this.processNodes(graph.nodes, positions)
    const edgeData = this.processEdges(graph.edges)

    return {
      nodes: nodeData,
      edges: edgeData,
    }
  }

  /**
   * Generates visualization data including clusters
   */
  generateClusteredVisualization(
    graph: KnowledgeGraph,
    clusters: KnowledgeCluster[]
  ): VisualizationData {
    const positions = this.calculateLayout(graph, this.options.layout)
    const nodeData = this.processNodes(graph.nodes, positions)
    const edgeData = this.processEdges(graph.edges)
    const clusterData = this.processClusters(clusters, nodeData)

    return {
      nodes: nodeData,
      edges: edgeData,
      clusters: clusterData,
    }
  }

  /**
   * Exports visualization as SVG
   */
  exportAsSVG(data: VisualizationData): string {
    const { width, height } = this.options
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`

    // Add styles
    svg += `
      <defs>
        <style>
          .node { fill: #4a90e2; stroke: #fff; stroke-width: 2; }
          .edge { stroke: #ccc; stroke-width: 1; fill: none; }
          .label { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }
          .cluster { fill: rgba(74, 144, 226, 0.1); stroke: #4a90e2; stroke-width: 1; }
        </style>
      </defs>
    `

    // Draw clusters if available
    if (data.clusters) {
      for (const cluster of data.clusters) {
        const clusterNodes = data.nodes.filter(n => cluster.nodes.includes(n.id))
        if (clusterNodes.length === 0) continue

        const bounds = this.calculateBounds(clusterNodes)
        svg += `<rect x="${bounds.x - 10}" y="${bounds.y - 10}" width="${bounds.width + 20}" height="${bounds.height + 20}" class="cluster" fill="${cluster.color}" opacity="0.3"/>`
        svg += `<text x="${bounds.x + bounds.width / 2}" y="${bounds.y - 5}" class="label">${cluster.name}</text>`
      }
    }

    // Draw edges
    for (const edge of data.edges) {
      const sourceNode = data.nodes.find(n => n.id === edge.source)
      const targetNode = data.nodes.find(n => n.id === edge.target)

      if (sourceNode && targetNode) {
        const strokeWidth = Math.max(1, edge.strength * 3)
        svg += `<line x1="${sourceNode.x}" y1="${sourceNode.y}" x2="${targetNode.x}" y2="${targetNode.y}" class="edge" stroke-width="${strokeWidth}" opacity="${edge.strength}"/>`
      }
    }

    // Draw nodes
    for (const node of data.nodes) {
      svg += `<circle cx="${node.x}" cy="${node.y}" r="${node.size}" class="node" fill="${node.color}"/>`

      if (this.options.showLabels) {
        svg += `<text x="${node.x}" y="${node.y + node.size + 15}" class="label">${node.label}</text>`
      }
    }

    svg += '</svg>'
    return svg
  }

  /**
   * Exports visualization as JSON for web rendering
   */
  exportAsJSON(data: VisualizationData): string {
    return JSON.stringify({
      ...data,
      metadata: {
        layout: this.options.layout,
        width: this.options.width,
        height: this.options.height,
        interactive: this.options.interactive,
        generatedAt: new Date().toISOString(),
      },
    }, null, 2)
  }

  /**
   * Generates HTML with embedded D3.js visualization
   */
  generateInteractiveHTML(data: VisualizationData): string {
    const jsonData = this.exportAsJSON(data)

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Knowledge Graph Visualization</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; }
    .node { stroke: #fff; stroke-width: 1.5px; }
    .link { stroke: #999; stroke-opacity: 0.6; }
    .label { font-size: 12px; text-anchor: middle; }
    .controls { position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.9); padding: 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="controls">
    <button onclick="resetZoom()">Reset Zoom</button>
    <label><input type="checkbox" id="showLabels" checked> Show Labels</label>
    <label><input type="checkbox" id="showEdges" checked> Show Edges</label>
  </div>
  <svg id="graph" width="${this.options.width}" height="${this.options.height}"></svg>

  <script>
    const data = ${jsonData};

    const svg = d3.select("#graph");
    const width = ${this.options.width};
    const height = ${this.options.height};

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.edges).id(d => d.id).distance(50))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));

    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(data.edges)
      .enter().append("line")
      .attr("class", "link")
      .attr("stroke-width", d => Math.sqrt(d.strength) * 2);

    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(data.nodes)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", d => d.size)
      .attr("fill", d => d.color)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    const labels = svg.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(data.nodes)
      .enter().append("text")
      .attr("class", "label")
      .text(d => d.label)
      .attr("dy", d => d.size + 15);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      labels
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function resetZoom() {
      svg.transition().duration(500).call(
        d3.zoom().transform,
        d3.zoomIdentity
      );
    }

    // Add zoom behavior
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 4])
      .on("zoom", zoomed));

    function zoomed(event) {
      svg.selectAll("g").attr("transform", event.transform);
    }
  </script>
</body>
</html>`
  }

  /**
   * Updates visualization options
   */
  updateOptions(options: Partial<VisualizationOptions>): void {
    this.options = { ...this.options, ...options }
  }

  private calculateLayout(graph: KnowledgeGraph, layout: string): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>()
    const { width, height } = this.options

    switch (layout) {
      case 'circular':
        this.calculateCircularLayout(graph.nodes, positions, width, height)
        break
      case 'hierarchical':
        this.calculateHierarchicalLayout(graph, positions, width, height)
        break
      case 'cluster':
        this.calculateClusterLayout(graph, positions, width, height)
        break
      case 'force':
      default:
        this.calculateForceLayout(graph, positions, width, height)
        break
    }

    return positions
  }

  private calculateCircularLayout(
    nodes: KnowledgeNode[],
    positions: Map<string, { x: number; y: number }>,
    width: number,
    height: number
  ): void {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 3

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      })
    })
  }

  private calculateHierarchicalLayout(
    graph: KnowledgeGraph,
    positions: Map<string, { x: number; y: number }>,
    width: number,
    height: number
  ): void {
    // Simplified hierarchical layout based on node types
    const levels = new Map<string, KnowledgeNode[]>()
    const levelHeight = height / 4

    for (const node of graph.nodes) {
      const level = node.metadata.type
      if (!levels.has(level)) {
        levels.set(level, [])
      }
      levels.get(level)!.push(node)
    }

    let levelIndex = 0
    for (const [level, levelNodes] of levels) {
      const y = (levelIndex + 1) * levelHeight
      const xSpacing = width / (levelNodes.length + 1)

      levelNodes.forEach((node, index) => {
        positions.set(node.id, {
          x: (index + 1) * xSpacing,
          y,
        })
      })

      levelIndex++
    }
  }

  private calculateClusterLayout(
    graph: KnowledgeGraph,
    positions: Map<string, { x: number; y: number }>,
    width: number,
    height: number
  ): void {
    // Group nodes by cluster
    const clusters = new Map<string | null, KnowledgeNode[]>()

    for (const node of graph.nodes) {
      const clusterId = node.clusterId
      if (!clusters.has(clusterId)) {
        clusters.set(clusterId, [])
      }
      clusters.get(clusterId)!.push(node)
    }

    const clusterSpacing = Math.min(width, height) / Math.sqrt(clusters.size)
    let clusterIndex = 0

    for (const [clusterId, clusterNodes] of clusters) {
      const clusterX = (clusterIndex % 3) * clusterSpacing + clusterSpacing
      const clusterY = Math.floor(clusterIndex / 3) * clusterSpacing + clusterSpacing

      this.calculateCircularLayout(clusterNodes, positions, clusterSpacing * 0.8, clusterSpacing * 0.8)

      // Offset cluster positions
      for (const node of clusterNodes) {
        const pos = positions.get(node.id)!
        positions.set(node.id, {
          x: pos.x + clusterX,
          y: pos.y + clusterY,
        })
      }

      clusterIndex++
    }
  }

  private calculateForceLayout(
    graph: KnowledgeGraph,
    positions: Map<string, { x: number; y: number }>,
    width: number,
    height: number
  ): void {
    // Simple force-directed layout approximation
    const centerX = width / 2
    const centerY = height / 2

    // Initialize with random positions around center
    graph.nodes.forEach(node => {
      positions.set(node.id, {
        x: centerX + (Math.random() - 0.5) * 200,
        y: centerY + (Math.random() - 0.5) * 200,
      })
    })

    // Simple force simulation (simplified version)
    for (let iteration = 0; iteration < 50; iteration++) {
      // Calculate repulsive forces
      for (const node1 of graph.nodes) {
        const pos1 = positions.get(node1.id)!
        let forceX = 0
        let forceY = 0

        for (const node2 of graph.nodes) {
          if (node1.id === node2.id) continue

          const pos2 = positions.get(node2.id)!
          const dx = pos1.x - pos2.x
          const dy = pos1.y - pos2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance > 0) {
            const force = 1000 / (distance * distance)
            forceX += (dx / distance) * force
            forceY += (dy / distance) * force
          }
        }

        // Apply attractive forces from connected nodes
        for (const edge of graph.edges) {
          if (edge.sourceId === node1.id || edge.targetId === node1.id) {
            const connectedId = edge.sourceId === node1.id ? edge.targetId : edge.sourceId
            const connectedPos = positions.get(connectedId)

            if (connectedPos) {
              const dx = connectedPos.x - pos1.x
              const dy = connectedPos.y - pos1.y
              const distance = Math.sqrt(dx * dx + dy * dy)

              if (distance > 0) {
                const force = distance * 0.1 * edge.strength
                forceX += (dx / distance) * force
                forceY += (dy / distance) * force
              }
            }
          }
        }

        // Update position
        pos1.x += forceX * 0.01
        pos1.y += forceY * 0.01

        // Keep within bounds
        pos1.x = Math.max(50, Math.min(width - 50, pos1.x))
        pos1.y = Math.max(50, Math.min(height - 50, pos1.y))
      }
    }
  }

  private processNodes(
    nodes: KnowledgeNode[],
    positions: Map<string, { x: number; y: number }>
  ): VisualizationData['nodes'] {
    return nodes.map(node => {
      const pos = positions.get(node.id) || { x: 0, y: 0 }
      return {
        id: node.id,
        label: this.generateNodeLabel(node),
        x: pos.x,
        y: pos.y,
        size: this.calculateNodeSize(node),
        color: this.calculateNodeColor(node),
        type: node.metadata.type,
        cluster: node.clusterId || undefined,
        importance: node.metadata.importance,
      }
    })
  }

  private processEdges(edges: KnowledgeEdge[]): VisualizationData['edges'] {
    return edges.map(edge => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      strength: edge.strength,
      type: edge.type,
      label: edge.type,
    }))
  }

  private processClusters(
    clusters: KnowledgeCluster[],
    nodes: VisualizationData['nodes']
  ): VisualizationData['clusters'] {
    return clusters.map(cluster => ({
      id: cluster.id,
      name: cluster.name,
      color: this.generateClusterColor(cluster.id),
      nodes: cluster.topNodes.map(n => n.id),
    }))
  }

  private generateNodeLabel(node: KnowledgeNode): string {
    // Truncate content for label
    const maxLength = 30
    const content = node.content.length > maxLength
      ? node.content.substring(0, maxLength) + '...'
      : node.content

    return content
  }

  private calculateNodeSize(node: KnowledgeNode): number {
    switch (this.options.nodeSize) {
      case 'importance':
        return Math.max(5, Math.min(20, 5 + node.metadata.importance * 15))
      case 'connections':
        return Math.max(5, Math.min(20, 5 + node.connections.length * 2))
      case 'fixed':
      default:
        return 10
    }
  }

  private calculateNodeColor(node: KnowledgeNode): string {
    switch (this.options.colorScheme) {
      case 'type':
        return this.getColorForType(node.metadata.type)
      case 'cluster':
        return node.clusterId ? this.generateClusterColor(node.clusterId) : '#cccccc'
      case 'importance':
        const intensity = Math.floor(node.metadata.importance * 255)
        return `rgb(${255 - intensity}, ${intensity}, 100)`
      default:
        return '#4a90e2'
    }
  }

  private getColorForType(type: string): string {
    const colors: Record<string, string> = {
      fact: '#4a90e2',
      concept: '#50c878',
      procedure: '#ff6b6b',
      experience: '#ffd93d',
    }
    return colors[type] || '#cccccc'
  }

  private generateClusterColor(clusterId: string): string {
    // Generate consistent color from cluster ID
    let hash = 0
    for (let i = 0; i < clusterId.length; i++) {
      hash = clusterId.charCodeAt(i) + ((hash << 5) - hash)
    }

    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 60%)`
  }

  private calculateBounds(nodes: VisualizationData['nodes']): {
    x: number
    y: number
    width: number
    height: number
  } {
    if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const node of nodes) {
      minX = Math.min(minX, node.x - node.size)
      minY = Math.min(minY, node.y - node.size)
      maxX = Math.max(maxX, node.x + node.size)
      maxY = Math.max(maxY, node.y + node.size)
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}