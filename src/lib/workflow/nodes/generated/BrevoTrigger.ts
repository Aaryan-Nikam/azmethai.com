// Auto-generated from n8n node: BrevoTrigger
// Source: [n8n]/Brevo/BrevoTrigger.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const sendInBlueTriggerNode: AzmethNodeDefinition = {
  "displayName": "Brevo Trigger",
  "name": "sendInBlueTrigger",
  "icon": "brevo",
  "group": "trigger",
  "version": 1,
  "description": "Starts the workflow when Brevo events occur",
  "defaults": {
    "name": "Brevo Trigger"
  },
  "credentials": [
    {
      "name": "sendInBlueApi",
      "required": true,
      "displayOptions": {
        "show": {}
      }
    }
  ],
  "properties": [
    {
      "displayName": "Resource",
      "name": "type",
      "type": "options",
      "originalType": "options",
      "default": "transactional",
      "required": true,
      "options": [
        {
          "name": "Inbound",
          "value": "inbound"
        },
        {
          "name": "Marketing",
          "value": "marketing"
        },
        {
          "name": "Transactional",
          "value": "transactional"
        }
      ]
    },
    {
      "displayName": "Trigger On",
      "name": "events",
      "type": "multiOptions",
      "originalType": "multiOptions",
      "default": [],
      "required": true,
      "placeholder": "Add Event",
      "options": [
        {
          "name": "Email Blocked",
          "value": "blocked",
          "description": "Triggers when transactional email is blocked"
        },
        {
          "name": "Email Clicked",
          "value": "click",
          "description": "Triggers when transactional email is clicked"
        },
        {
          "name": "Email Deferred",
          "value": "deferred",
          "description": "Triggers when transactional email is deferred"
        },
        {
          "name": "Email Delivered",
          "value": "delivered",
          "description": "Triggers when transactional email is delivered"
        },
        {
          "name": "Email Hard Bounce",
          "value": "hardBounce",
          "description": "Triggers when transactional email is hard bounced"
        },
        {
          "name": "Email Invalid",
          "value": "invalid",
          "description": "Triggers when transactional email is invalid"
        },
        {
          "name": "Email Marked Spam",
          "value": "spam",
          "description": "Triggers when transactional email is set to spam"
        },
        {
          "name": "Email Opened",
          "value": "opened",
          "description": "Triggers when transactional email is opened"
        },
        {
          "name": "Email Sent",
          "value": "request",
          "description": "Triggers when transactional email is sent"
        },
        {
          "name": "Email Soft-Bounce",
          "value": "softBounce",
          "description": "Triggers when transactional email is soft bounced"
        },
        {
          "name": "Email Unique Open",
          "value": "uniqueOpened",
          "description": "Triggers when transactional email is unique opened"
        },
        {
          "name": "Email Unsubscribed",
          "value": "unsubscribed",
          "description": "Triggers when transactional email is unsubscribed"
        }
      ],
      "displayOptions": {
        "show": {
          "type": [
            "transactional"
          ]
        }
      }
    },
    {
      "displayName": "Trigger On",
      "name": "events",
      "type": "multiOptions",
      "originalType": "multiOptions",
      "default": [],
      "required": true,
      "placeholder": "Add Event",
      "options": [
        {
          "name": "Marketing Email Clicked",
          "value": "click",
          "description": "Triggers when marketing email is clicked"
        },
        {
          "name": "Marketing Email Delivered",
          "value": "delivered",
          "description": "Triggers when marketing email is delivered"
        },
        {
          "name": "Marketing Email Hard Bounce",
          "value": "hardBounce",
          "description": "Triggers when marketing email is hard bounced"
        },
        {
          "name": "Marketing Email List Addition",
          "value": "listAddition",
          "description": "Triggers when marketing email is clicked"
        },
        {
          "name": "Marketing Email Opened",
          "value": "opened",
          "description": "Triggers when marketing email is opened"
        },
        {
          "name": "Marketing Email Soft Bounce",
          "value": "softBounce",
          "description": "Triggers when marketing email is soft bounced"
        },
        {
          "name": "Marketing Email Spam",
          "value": "spam",
          "description": "Triggers when marketing email is spam"
        },
        {
          "name": "Marketing Email Unsubscribed",
          "value": "unsubscribed",
          "description": "Triggers when marketing email is unsubscribed"
        }
      ],
      "displayOptions": {
        "show": {
          "type": [
            "marketing"
          ]
        }
      }
    },
    {
      "displayName": "Trigger On",
      "name": "events",
      "type": "multiOptions",
      "originalType": "multiOptions",
      "default": [],
      "required": true,
      "placeholder": "Add Event",
      "options": [
        {
          "name": "Inbound Email Processed",
          "value": "inboundEmailProcessed",
          "description": "Triggers when inbound email is processed"
        }
      ],
      "displayOptions": {
        "show": {
          "type": [
            "inbound"
          ]
        }
      }
    }
  ],
  };
