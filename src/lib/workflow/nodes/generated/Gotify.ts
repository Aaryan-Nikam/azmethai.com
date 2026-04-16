/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Gotify/Gotify.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const GotifyProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Message",
        "value": "message"
      }
    ],
    "default": "message"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ]
      }
    },
    "options": [
      {
        "name": "Create",
        "value": "create",
        "action": "Create a message"
      },
      {
        "name": "Delete",
        "value": "delete",
        "action": "Delete a message"
      },
      {
        "name": "Get Many",
        "value": "getAll",
        "action": "Get many messages"
      }
    ],
    "default": "create"
  },
  {
    "displayName": "Message",
    "name": "message",
    "type": "string",
    "required": true,
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "create"
        ]
      }
    },
    "default": "",
    "description": "The message. Markdown (excluding html) is allowed."
  },
  {
    "displayName": "Additional Fields",
    "name": "additionalFields",
    "type": "collection",
    "placeholder": "Add Field",
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "create"
        ]
      }
    },
    "default": {},
    "options": [
      {
        "displayName": "Priority",
        "name": "priority",
        "type": "number",
        "default": 1,
        "description": "The priority of the message"
      },
      {
        "displayName": "Title",
        "name": "title",
        "type": "string",
        "default": "",
        "description": "The title of the message"
      }
    ]
  },
  {
    "displayName": "Message ID",
    "name": "messageId",
    "type": "string",
    "required": true,
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "delete"
        ]
      }
    },
    "default": ""
  },
  {
    "displayName": "Return All",
    "name": "returnAll",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "getAll"
        ]
      }
    },
    "default": false,
    "description": "Whether to return all results or only up to a given limit"
  },
  {
    "displayName": "Limit",
    "name": "limit",
    "type": "number",
    "typeOptions": {
      "minValue": 1
    },
    "description": "Max number of results to return",
    "default": 20,
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "getAll"
        ],
        "returnAll": [
          false
        ]
      }
    }
  }
];
