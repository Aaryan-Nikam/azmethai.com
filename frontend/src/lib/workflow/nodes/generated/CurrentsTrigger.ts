// Auto-generated from n8n node: CurrentsTrigger
// Source: [n8n]/Currents/CurrentsTrigger.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const currentsTriggerNode: AzmethNodeDefinition = {
  "displayName": "Currents Trigger",
  "name": "currentsTrigger",
  "icon": "currents",
  "group": "trigger",
  "version": 1,
  "description": "Starts the workflow when Currents events occur",
  "defaults": {
    "name": "Currents Trigger"
  },
  "credentials": [
    {
      "name": "currentsApi",
      "required": true
    }
  ],
  "properties": [
    {
      "displayName": "",
      "name": "",
      "type": "string",
      "default": ""
    },
    {
      "displayName": "Currents sends separate webhook events for each group in a run. If your run has multiple groups, you will receive separate events for each group.",
      "name": "noticeGroups",
      "type": "notice",
      "originalType": "notice",
      "default": ""
    },
    {
      "displayName": "Events",
      "name": "events",
      "type": "multiOptions",
      "originalType": "multiOptions",
      "default": [],
      "required": true,
      "description": "The events to listen to",
      "options": [
        {
          "name": "Run Canceled",
          "value": "RUN_CANCELED",
          "description": "Triggered when a run is manually canceled"
        },
        {
          "name": "Run Finished",
          "value": "RUN_FINISH",
          "description": "Triggered when a run completes"
        },
        {
          "name": "Run Started",
          "value": "RUN_START",
          "description": "Triggered when a new run begins"
        },
        {
          "name": "Run Timeout",
          "value": "RUN_TIMEOUT",
          "description": "Triggered when a run exceeds the time limit"
        }
      ]
    }
  ],
  };
