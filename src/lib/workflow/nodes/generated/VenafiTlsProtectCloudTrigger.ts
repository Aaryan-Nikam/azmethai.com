/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Venafi/ProtectCloud/VenafiTlsProtectCloudTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const VenafiTlsProtectCloudTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "typeOptions": {
      "loadOptionsMethod": "getActivityTypes"
    },
    "required": true,
    "default": [],
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>. Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
  },
  {
    "displayName": "Trigger On",
    "name": "triggerOn",
    "type": "multiOptions",
    "typeOptions": {
      "loadOptionsMethod": "getActivitySubTypes",
      "loadOptionsDependsOn": [
        "resource"
      ]
    },
    "required": true,
    "default": [],
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>. Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>. Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
  }
];
