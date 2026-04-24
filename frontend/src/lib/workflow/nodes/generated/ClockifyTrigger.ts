/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Clockify/ClockifyTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const ClockifyTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Workspace Name or ID",
    "name": "workspaceId",
    "type": "options",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>",
    "typeOptions": {
      "loadOptionsMethod": "listWorkspaces"
    },
    "required": true,
    "default": ""
  },
  {
    "displayName": "Trigger",
    "name": "watchField",
    "type": "options",
    "options": [
      {
        "name": "New Time Entry",
        "value": 0
      }
    ],
    "required": true,
    "default": 0
  }
];
