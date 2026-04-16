// Auto-generated from n8n node: DataTable
// Source: [n8n]/DataTable/DataTable.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const dataTableNode: AzmethNodeDefinition = {
  "displayName": "Data table",
  "name": "dataTable",
  "icon": "fa:table",
  "group": "input",
  "version": [
    1,
    1.1
  ],
  "description": "Permanently save data across workflow executions in a table",
  "defaults": {
    "name": "Data table"
  },
  "credentials": [],
  "properties": [
    {
      "displayName": "Resource",
      "name": "resource",
      "type": "options",
      "originalType": "options",
      "default": "row",
      "options": [
        {
          "name": "Row",
          "value": "row"
        },
        {
          "name": "Table",
          "value": "table"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
