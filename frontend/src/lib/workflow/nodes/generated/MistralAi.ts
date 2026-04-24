// Auto-generated from n8n node: MistralAi
// Source: [n8n]/MistralAI/MistralAi.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const mistralAiNode: AzmethNodeDefinition = {
  "displayName": "Mistral AI",
  "name": "mistralAi",
  "icon": "[object Object]",
  "group": "transform",
  "version": 1,
  "description": "Consume Mistral AI API",
  "defaults": {
    "name": "Mistral AI"
  },
  "credentials": [
    {
      "name": "mistralCloudApi",
      "required": true
    }
  ],
  "properties": [
    {
      "displayName": "Resource",
      "name": "resource",
      "type": "options",
      "originalType": "options",
      "default": "document",
      "options": [
        {
          "name": "Document",
          "value": "document"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
