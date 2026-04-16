/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/SeaTable/SeaTableTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const SeaTableTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Table Name or ID",
    "name": "tableName",
    "type": "options",
    "required": true,
    "typeOptions": {
      "loadOptionsMethod": "getTableNames"
    },
    "default": "",
    "description": "The name of SeaTable table to access. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
  },
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "options": [
      {
        "name": "Row Created",
        "value": "rowCreated",
        "description": "Trigger on newly created rows"
      }
    ],
    "default": "rowCreated"
  },
  {
    "displayName": "Simplify",
    "name": "simple",
    "type": "boolean",
    "default": true,
    "description": "Whether to return a simplified version of the response instead of the raw data"
  }
];
