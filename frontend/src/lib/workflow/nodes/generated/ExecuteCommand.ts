/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/ExecuteCommand/ExecuteCommand.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const ExecuteCommandProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Execute Once",
    "name": "executeOnce",
    "type": "boolean",
    "default": true,
    "description": "Whether to execute only once instead of once for each entry"
  },
  {
    "displayName": "Command",
    "name": "command",
    "typeOptions": {
      "rows": 5
    },
    "type": "string",
    "default": "",
    "placeholder": "echo \"test\"",
    "description": "The command to execute",
    "required": true
  }
];
