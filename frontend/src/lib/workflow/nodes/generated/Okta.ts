// Auto-generated from n8n node: Okta
// Source: [n8n]/Okta/Okta.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const oktaNode: AzmethNodeDefinition = {
  "displayName": "Okta",
  "name": "okta",
  "icon": "[object Object]",
  "group": "transform",
  "version": 1,
  "description": "Use the Okta API",
  "defaults": {
    "name": "Okta"
  },
  "credentials": [
    {
      "name": "oktaApi",
      "required": true
    }
  ],
  "properties": [
    {
      "displayName": "Resource",
      "name": "resource",
      "type": "options",
      "originalType": "options",
      "default": "user",
      "options": [
        {
          "name": "User",
          "value": "user"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
