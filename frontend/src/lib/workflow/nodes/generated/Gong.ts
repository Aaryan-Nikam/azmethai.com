// Auto-generated from n8n node: Gong
// Source: [n8n]/Gong/Gong.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const gongNode: AzmethNodeDefinition = {
  "displayName": "Gong",
  "name": "gong",
  "icon": "gong",
  "group": "transform",
  "version": 1,
  "description": "Interact with Gong API",
  "defaults": {
    "name": "Gong"
  },
  "credentials": [
    {
      "name": "gongApi",
      "required": true,
      "displayOptions": {
        "show": {
          "authentication": [
            "accessToken"
          ]
        }
      }
    },
    {
      "name": "gongOAuth2Api",
      "required": true,
      "displayOptions": {
        "show": {
          "authentication": [
            "oAuth2"
          ]
        }
      }
    }
  ],
  "properties": [
    {
      "displayName": "Authentication",
      "name": "authentication",
      "type": "options",
      "originalType": "options",
      "default": "accessToken",
      "options": [
        {
          "name": "Access Token",
          "value": "accessToken"
        },
        {
          "name": "OAuth2",
          "value": "oAuth2"
        }
      ]
    },
    {
      "displayName": "Resource",
      "name": "resource",
      "type": "options",
      "originalType": "options",
      "default": "call",
      "options": [
        {
          "name": "Call",
          "value": "call"
        },
        {
          "name": "User",
          "value": "user"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
