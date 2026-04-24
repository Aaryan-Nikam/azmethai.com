/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Flow/FlowTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const FlowTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "default": "",
    "options": [
      {
        "name": "Project",
        "value": "list"
      },
      {
        "name": "Task",
        "value": "task"
      }
    ],
    "description": "Resource that triggers the webhook"
  },
  {
    "displayName": "Project ID",
    "name": "listIds",
    "type": "string",
    "required": true,
    "default": "",
    "displayOptions": {
      "show": {
        "resource": [
          "list"
        ]
      },
      "hide": {
        "resource": [
          "task"
        ]
      }
    },
    "description": "Lists IDs, perhaps known better as \"Projects\" separated by a comma (,)"
  },
  {
    "displayName": "Task ID",
    "name": "taskIds",
    "type": "string",
    "required": true,
    "default": "",
    "displayOptions": {
      "show": {
        "resource": [
          "task"
        ]
      },
      "hide": {
        "resource": [
          "list"
        ]
      }
    },
    "description": "Task IDs separated by a comma (,)"
  }
];
