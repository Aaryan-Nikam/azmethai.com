// Auto-generated from n8n node: TimeSaved
// Source: [n8n]/TimeSaved/TimeSaved.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const timeSavedNode: AzmethNodeDefinition = {
  "displayName": "Track Time Saved",
  "name": "timeSaved",
  "icon": "fa:timer",
  "group": "organization",
  "version": 1,
  "description": "Dynamically track time saved based on the workflow’s execution path and the number of items processed",
  "defaults": {
    "name": "Time Saved",
    "color": "#1E90FF"
  },
  "credentials": [],
  "properties": [
    {
      "displayName": "For each run, time saved is the sum of all Time Saved nodes that execute. Use this when different execution paths or items save different amounts of time.",
      "name": "notice",
      "type": "notice",
      "originalType": "notice",
      "default": ""
    },
    {
      "displayName": "Calculation Mode",
      "name": "mode",
      "type": "options",
      "originalType": "options",
      "default": "once",
      "options": [
        {
          "name": "Once For All Items",
          "value": "once",
          "description": "Counts minutes saved once for all input items"
        },
        {
          "name": "Per Item",
          "value": "perItem",
          "description": "Multiply minutes saved by the number of input items"
        }
      ],
      "noDataExpression": true
    },
    {
      "displayName": "Minutes Saved",
      "name": "minutesSaved",
      "type": "number",
      "originalType": "number",
      "default": 0,
      "description": "Number of minutes saved by this workflow execution",
      "typeOptions": {
        "minValue": 0
      },
      "noDataExpression": true
    }
  ],
  };
