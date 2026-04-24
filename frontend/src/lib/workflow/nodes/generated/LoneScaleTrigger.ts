/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/LoneScale/LoneScaleTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const LoneScaleTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Workflow Name",
    "name": "workflow",
    "type": "options",
    "noDataExpression": true,
    "typeOptions": {
      "loadOptionsMethod": "getWorkflows"
    },
    "default": "",
    "description": "Select one workflow. Choose from the list",
    "required": true
  }
];
