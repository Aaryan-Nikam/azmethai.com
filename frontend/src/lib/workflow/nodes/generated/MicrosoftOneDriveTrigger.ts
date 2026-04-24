// Auto-generated from n8n node: MicrosoftOneDriveTrigger
// Source: [n8n]/Microsoft/OneDrive/MicrosoftOneDriveTrigger.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const microsoftOneDriveTriggerNode: AzmethNodeDefinition = {
  "displayName": "Microsoft OneDrive Trigger",
  "name": "microsoftOneDriveTrigger",
  "icon": "oneDrive",
  "group": "trigger",
  "version": 1,
  "description": "Trigger for Microsoft OneDrive API.",
  "defaults": {
    "name": "Microsoft OneDrive Trigger"
  },
  "credentials": [
    {
      "name": "microsoftOneDriveOAuth2Api",
      "required": true
    }
  ],
  "properties": [],
  };
