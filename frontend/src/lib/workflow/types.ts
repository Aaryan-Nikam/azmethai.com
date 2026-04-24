/**
 * Azmeth AI Workflow Node Type Definitions
 * Modeled after n8n's INodeTypeDescription with our extensions
 */

export interface AzmethNodePropertyOption {
  name: string;
  value: string | number | boolean;
  description?: string;
  action?: string;
}

export interface AzmethNodePropertyDisplayOptions {
  show?: Record<string, Array<string | number | boolean>>;
  hide?: Record<string, Array<string | number | boolean>>;
}

export type AzmethNodePropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'options'
  | 'multiOptions'
  | 'collection'
  | 'fixedCollection'
  | 'dateTime'
  | 'color'
  | 'json'
  | 'notice'
  | 'hidden'
  | 'credentialsSelect'
  | 'resourceLocator'
  | 'resourceMapper'
  | 'filter';

export interface AzmethNodeProperty {
  displayName: string;
  name: string;
  type: AzmethNodePropertyType;
  originalType?: string;
  default?: any;
  required?: boolean;
  description?: string;
  placeholder?: string;
  hint?: string;
  options?: AzmethNodePropertyOption[];
  displayOptions?: AzmethNodePropertyDisplayOptions;
  typeOptions?: Record<string, any>;
  noDataExpression?: boolean;
}

export interface AzmethNodeCredential {
  name: string;
  required?: boolean;
  displayOptions?: AzmethNodePropertyDisplayOptions;
}

export interface AzmethNodeDefinition {
  displayName: string;
  name: string;
  icon: string;
  group: string;
  version: number | number[];
  description: string;
  defaults?: {
    name?: string;
    color?: string;
  };
  credentials?: AzmethNodeCredential[];
  properties: AzmethNodeProperty[];
}
