// Auto-generated from n8n node: Form
// Source: [n8n]/Form/Form.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const formNode: AzmethNodeDefinition = {
  "displayName": "n8n Form",
  "name": "form",
  "icon": "form",
  "group": "input",
  "version": [
    1,
    2.3,
    2.4,
    2.5
  ],
  "description": "Generate webforms in n8n and pass their responses to the workflow",
  "defaults": {
    "name": "Form"
  },
  "credentials": [],
  "properties": [
    {
      "displayName": "An n8n Form Trigger node must be set up before this node",
      "name": "triggerNotice",
      "type": "notice",
      "originalType": "notice",
      "default": ""
    },
    {
      "displayName": "Page Type",
      "name": "operation",
      "type": "options",
      "originalType": "options",
      "default": "page",
      "options": [
        {
          "name": "Next Form Page",
          "value": "page"
        },
        {
          "name": "Form Ending",
          "value": "completion"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
