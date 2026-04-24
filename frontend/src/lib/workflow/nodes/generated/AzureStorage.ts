// Auto-generated from n8n node: AzureStorage
// Source: [n8n]/Microsoft/Storage/AzureStorage.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const azureStorageNode: AzmethNodeDefinition = {
  "displayName": "Azure Storage",
  "name": "azureStorage",
  "icon": "[object Object]",
  "group": "transform",
  "version": 1,
  "description": "Interact with Azure Storage API",
  "defaults": {
    "name": "Azure Storage"
  },
  "credentials": [
    {
      "name": "azureStorageOAuth2Api",
      "required": true,
      "displayOptions": {
        "show": {
          "authentication": [
            "oAuth2"
          ]
        }
      }
    },
    {
      "name": "azureStorageSharedKeyApi",
      "required": true,
      "displayOptions": {
        "show": {
          "authentication": [
            "sharedKey"
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
      "default": "sharedKey",
      "options": [
        {
          "name": "OAuth2",
          "value": "oAuth2"
        },
        {
          "name": "Shared Key",
          "value": "sharedKey"
        }
      ]
    },
    {
      "displayName": "Resource",
      "name": "resource",
      "type": "options",
      "originalType": "options",
      "default": "container",
      "options": [
        {
          "name": "Blob",
          "value": "blob"
        },
        {
          "name": "Container",
          "value": "container"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
