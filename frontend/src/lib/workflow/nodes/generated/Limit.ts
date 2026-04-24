// Auto-generated from n8n node: Limit
// Source: [n8n]/Transform/Limit/Limit.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const limitNode: AzmethNodeDefinition = {
  "displayName": "Limit",
  "name": "limit",
  "icon": "limit",
  "group": "transform",
  "version": 1,
  "description": "Restrict the number of items",
  "defaults": {
    "name": "Limit"
  },
  "credentials": [],
  "properties": [
    {
      "displayName": "Max Items",
      "name": "maxItems",
      "type": "number",
      "originalType": "number",
      "default": 1,
      "description": "If there are more items than this number, some are removed",
      "typeOptions": {
        "minValue": 1
      }
    },
    {
      "displayName": "Keep",
      "name": "keep",
      "type": "options",
      "originalType": "options",
      "default": "firstItems",
      "description": "When removing items, whether to keep the ones at the start or the ending",
      "options": [
        {
          "name": "First Items",
          "value": "firstItems"
        },
        {
          "name": "Last Items",
          "value": "lastItems"
        }
      ]
    }
  ],
  };
