// Auto-generated from n8n node: Airtop
// Source: [n8n]/Airtop/Airtop.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const airtopNode: AzmethNodeDefinition = {
  "displayName": "Airtop",
  "name": "airtop",
  "icon": "airtop",
  "group": "transform",
  "version": [
    1,
    1.1
  ],
  "description": "Scrape and control any site with Airtop",
  "defaults": {
    "name": "Airtop"
  },
  "credentials": [
    {
      "name": "airtopApi",
      "required": true
    }
  ],
  "properties": [
    {
      "displayName": "Resource",
      "name": "resource",
      "type": "options",
      "originalType": "options",
      "default": "session",
      "options": [
        {
          "name": "Agent",
          "value": "agent"
        },
        {
          "name": "Extraction",
          "value": "extraction"
        },
        {
          "name": "File",
          "value": "file"
        },
        {
          "name": "Interaction",
          "value": "interaction"
        },
        {
          "name": "Session",
          "value": "session"
        },
        {
          "name": "Window",
          "value": "window"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
