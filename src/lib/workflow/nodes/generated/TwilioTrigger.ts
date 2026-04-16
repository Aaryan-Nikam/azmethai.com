// Auto-generated from n8n node: TwilioTrigger
// Source: [n8n]/Twilio/TwilioTrigger.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const twilioTriggerNode: AzmethNodeDefinition = {
  "displayName": "Twilio Trigger",
  "name": "twilioTrigger",
  "icon": "twilio",
  "group": "trigger",
  "version": [
    1
  ],
  "description": "Starts the workflow on a Twilio update",
  "defaults": {
    "name": "Twilio Trigger"
  },
  "credentials": [
    {
      "name": "twilioApi",
      "required": true
    }
  ],
  "properties": [
    {
      "displayName": "Trigger On",
      "name": "updates",
      "type": "multiOptions",
      "originalType": "multiOptions",
      "default": [],
      "required": true,
      "options": [
        {
          "name": "New SMS",
          "value": "com.twilio.messaging.inbound-message.received",
          "description": "When an SMS message is received"
        },
        {
          "name": "New Call",
          "value": "com.twilio.voice.insights.call-summary.complete",
          "description": "When a call is received"
        }
      ]
    },
    {
      "displayName": "The 'New Call' event may take up to thirty minutes to be triggered",
      "name": "callTriggerNotice",
      "type": "notice",
      "originalType": "notice",
      "default": "",
      "displayOptions": {
        "show": {
          "updates": [
            "com.twilio.voice.insights.call-summary.complete"
          ]
        }
      }
    }
  ],
  };
