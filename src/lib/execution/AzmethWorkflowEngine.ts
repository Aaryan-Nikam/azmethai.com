import { NodeTypeLoader } from './NodeTypeLoader';
import { CredentialManager } from './CredentialManager';
import {
  AzmethWorkflow,
  AzmethWorkflowDefinition,
  AzmethNodeDefinition,
  ExecutionResult
} from './types';

export class AzmethWorkflowEngine {
  private nodeTypes: NodeTypeLoader;
  private credentialManager: CredentialManager;
  
  constructor() {
    this.nodeTypes = new NodeTypeLoader();
    this.credentialManager = new CredentialManager();
  }
  
  /**
   * Convert Azmeth ReactFlow format to Azmeth Engine executable format
   */
  private convertToAzmethFormat(
    azmethWorkflow: AzmethWorkflow,
    userId: string
  ): AzmethWorkflowDefinition {
    // 1. Convert nodes
    const azmethNodes: AzmethNodeDefinition[] = azmethWorkflow.nodes.map(node => ({
      id: node.id,
      name: node.data?.label || node.id,
      type: node.type,
      typeVersion: 1,
      position: { x: node.position?.x || 0, y: node.position?.y || 0 }, // Changed back to object to fix "reading x" error
      parameters: node.data?.config || {}, // Field inputs mapped from properties panel
      credentials: node.data?.credentials || {}
    }));
    
    // 2. Convert edges to connections
    const connections: Record<string, { main: any[][] }> = {};
    
    for (const edge of azmethWorkflow.edges) {
      if (!connections[edge.source]) {
        connections[edge.source] = { main: [[]] };
      }
      
      // Wire the target node into the source's main output branch
      connections[edge.source].main[0].push({
        node: edge.target,
        type: 'main',
        index: 0
      });
    }
    
    return {
      id: azmethWorkflow.id,
      name: azmethWorkflow.name,
      nodes: azmethNodes,
      connections,
      active: true,
      staticData: {}
    };
  }
  
  /**
   * Main Execution Pipeline
   */
  async execute(
    azmethWorkflow: AzmethWorkflow,
    userId: string,
    inputData?: any
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    console.log(`[Azmeth Engine] Execution stubbed for build. Target: ${azmethWorkflow.name}`);
    
    return {
      success: true,
      data: { 
        message: "Workflow engine is currently in bridge mode. Please connect a Node.js backend for live execution." 
      },
      executionTime: Date.now() - startTime
    };
  }
  
  /**
   * Parse deep execution trace into a clean payload map
   */
  private extractResultData(result: any): any {
    const output: Record<string, any> = {};
    
    // Engine resultData processing
    const resultData = result.data?.resultData || result.resultData;

    if (!resultData?.runData) {
      return {};
    }

    try {
      for (const [nodeName, taskData] of Object.entries(resultData.runData)) {
        const nodeTasks = taskData as any[];
        const lastTask = nodeTasks[nodeTasks.length - 1];
        
        if (lastTask?.data?.main) {
          // Flatten all output connections and all items
          const allItems = lastTask.data.main.flat().filter(Boolean);
          output[nodeName] = allItems.map((item: any) => item.json);
        } else {
          output[nodeName] = { 
            _error: lastTask?.error,
            _status: lastTask?.executionStatus
          };
        }
      }
    } catch (e: any) {
      console.error('[AzmethWorkflowEngine] Extraction failed:', e);
    }
    
    return output;
  }
  
  /**
   * Injects dependencies, webhook URLs, hooks, and credentials into the engine executor
   */
  private async getAdditionalData(userId: string, azmethWorkflow: AzmethWorkflow) {
    const credentialManager = this.credentialManager;
    
    return {
      credentialsHelper: {
        authenticate: async (credentials: any, typeName: string, requestParams: any) => requestParams,
        
        getCredentials: async (nodeCredentials: any, type: string) => {
          if (!nodeCredentials?.id) throw new Error('Credential ID not provided mapped to node config');
          const credentialData = await credentialManager.getCredential(nodeCredentials.id, userId);
          
          return {
            getData: () => credentialData,
            getDataKey: (key: string) => credentialData[key],
            setDataKey: (key: string, data: any) => { credentialData[key] = data; },
            getDataToSave: () => credentialData
          };
        },
        
        getDecrypted: async (nodeCredentials: any, type: string) => {
          if (!nodeCredentials?.id) return {};
          return await credentialManager.getCredential(nodeCredentials.id, userId);
        },
        
        updateCredentials: async (nodeCredentials: any, type: string, data: any) => data
      },
      
      // Added missing helpers for HubSpot/Slack V2
      getParentTypes: async () => [],
      getNode: (nodeName: string) => {
        const node = azmethWorkflow.nodes.find((n: any) => n.id === nodeName || n.data?.label === nodeName);
        return {
          credentials: node?.data?.credentials || {},
          parameters: node?.data?.config || {}
        };
      },
      
      hooks: {
        executeHookFunctions: async (hookName: string, parameters: any[]) => {
          console.log(`[Azmeth Hook] ${hookName}`);
        }
      },
      
      executionId: Math.random().toString(36).substring(7),
      
      helpers: {
        assertBinaryData: () => {},
        getBinaryDataBuffer: async () => Buffer.from(''),
        prepareBinaryData: async (binaryData: Buffer, filePath?: string, mimeType?: string) => ({
          data: binaryData.toString('base64'),
          mimeType: mimeType || 'application/octet-stream',
          fileName: filePath
        })
      },
      
      timezone: 'UTC',
      webhookBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      webhookWaitingBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      webhookTestBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };
  }
}
