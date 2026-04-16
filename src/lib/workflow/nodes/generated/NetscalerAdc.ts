// Auto-generated from n8n node: NetscalerAdc
// Source: [n8n]/Netscaler/ADC/NetscalerAdc.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const citrixAdcNode: AzmethNodeDefinition = {
  "displayName": "Netscaler ADC",
  "name": "citrixAdc",
  "icon": "[object Object]",
  "group": "output",
  "version": 1,
  "description": "Consume Netscaler ADC API",
  "defaults": {
    "name": "Netscaler ADC"
  },
  "credentials": [
    {
      "name": "citrixAdcApi",
      "required": true
    }
  ],
  "properties": [
    {
      "displayName": "Resource",
      "name": "resource",
      "type": "options",
      "originalType": "options",
      "default": "file",
      "options": [
        {
          "name": "Certificate",
          "value": "certificate"
        },
        {
          "name": "File",
          "value": "file"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
