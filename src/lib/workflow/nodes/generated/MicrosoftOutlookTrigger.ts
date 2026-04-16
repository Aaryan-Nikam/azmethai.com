// Auto-generated from n8n node: MicrosoftOutlookTrigger
// Source: [n8n]/Microsoft/Outlook/MicrosoftOutlookTrigger.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const microsoftOutlookTriggerNode: AzmethNodeDefinition = {
  "displayName": "Microsoft Outlook Trigger",
  "name": "microsoftOutlookTrigger",
  "icon": "outlook",
  "group": "trigger",
  "version": 1,
  "description": "Fetches emails from Microsoft Outlook and starts the workflow on specified polling intervals.",
  "defaults": {
    "name": "Microsoft Outlook Trigger"
  },
  "credentials": [
    {
      "name": "microsoftOutlookOAuth2Api",
      "required": true
    }
  ],
  "properties": [
    {
      "displayName": "Trigger On",
      "name": "event",
      "type": "options",
      "originalType": "options",
      "default": "messageReceived",
      "options": [
        {
          "name": "Message Received",
          "value": "messageReceived"
        }
      ]
    }
  ],
  };
