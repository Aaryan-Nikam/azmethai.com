import { INodeType, INodeTypes } from 'n8n-workflow';
import { NODE_PATH_MAP } from './node-path-map';

export class NodeTypeLoader implements INodeTypes {
  private loadedNodes: Map<string, INodeType> = new Map();
  
  /**
   * Load a node class by name
   */
  getByName(nodeType: string): INodeType {
    // Check cache first
    if (this.loadedNodes.has(nodeType)) {
      return this.loadedNodes.get(nodeType)!;
    }
    
    // Get file path
    const nodePath = NODE_PATH_MAP[nodeType];
    
    if (!nodePath) {
      throw new Error(
        `[Azmeth Execution Engine] Unknown node type: ${nodeType}. ` +
        `This node might not be in the pre-compiled node-path-map.`
      );
    }
    
    try {
      const fullPath = `n8n-nodes-base/dist/nodes/${nodePath}`;
      const req = eval('require');
      const NodeClass = req(fullPath);
      
      const key = Object.keys(NodeClass).find(k => k !== '__esModule' && typeof NodeClass[k] === 'function');
      const nodeInstance = new (NodeClass.default || NodeClass[key || Object.keys(NodeClass)[0]])() as any;
      
      // The engine expects description.properties. If it's missing but exists elsewhere, normalize it
      if (nodeInstance.description && !nodeInstance.description.properties && nodeInstance.nodeProperties) {
        nodeInstance.description.properties = nodeInstance.nodeProperties;
      }
      
      this.loadedNodes.set(nodeType, nodeInstance);
      return nodeInstance;
      
    } catch (error) {
      console.error(`Failed to load node ${nodeType} from ${nodePath}:`, error);
      throw new Error(
        `Failed to load node type ${nodeType}. ` +
        `Check that the path in NODE_PATH_MAP is correct and the base library is installed.`
      );
    }
  }
  
  /**
   * Load a specific version of a node
   */
  getByNameAndVersion(nodeType: string, version?: number): INodeType {
    // For now, ignore version and load latest
    return this.getByName(nodeType);
  }
}
