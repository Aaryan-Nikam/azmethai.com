// Auto-generated from n8n node: WhatsAppTrigger
// Source: [n8n]/WhatsApp/WhatsAppTrigger.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const whatsAppTriggerNode: AzmethNodeDefinition = {
  "displayName": "WhatsApp Trigger",
  "name": "whatsAppTrigger",
  "icon": "whatsapp",
  "group": "trigger",
  "version": 1,
  "description": "Handle WhatsApp events via webhooks",
  "defaults": {
    "name": "WhatsApp Trigger"
  },
  "credentials": [
    {
      "name": "whatsAppTriggerApi",
      "required": true
    }
  ],
  "properties": [
    {
      "displayName": "Due to Facebook API limitations, you can use just one WhatsApp trigger for each Facebook App",
      "name": "whatsAppNotice",
      "type": "notice",
      "originalType": "notice",
      "default": ""
    },
    {
      "displayName": "Trigger On",
      "name": "updates",
      "type": "multiOptions",
      "originalType": "multiOptions",
      "default": [],
      "required": true,
      "options": [
        {
          "name": "Account Review Update",
          "value": "account_review_update"
        },
        {
          "name": "Account Update",
          "value": "account_update"
        },
        {
          "name": "Business Capability Update",
          "value": "business_capability_update"
        },
        {
          "name": "Message Template Quality Update",
          "value": "message_template_quality_update"
        },
        {
          "name": "Message Template Status Update",
          "value": "message_template_status_update"
        },
        {
          "name": "Messages",
          "value": "messages"
        },
        {
          "name": "Phone Number Name Update",
          "value": "phone_number_name_update"
        },
        {
          "name": "Phone Number Quality Update",
          "value": "phone_number_quality_update"
        },
        {
          "name": "Security",
          "value": "security"
        },
        {
          "name": "Template Category Update",
          "value": "template_category_update"
        }
      ]
    },
    {
      "displayName": "Options",
      "name": "options",
      "type": "collection",
      "originalType": "collection",
      "default": {},
      "placeholder": "Add option",
      "options": [
        {
          "name": "messageStatusUpdates",
          "description": "WhatsApp sends notifications to the Trigger when the status of a message changes (for example from Sent to Delivered and from Delivered to Read). To avoid multiple executions for one WhatsApp message, you can set the Trigger to execute only on selected message status updates."
        }
      ]
    }
  ],
  };
