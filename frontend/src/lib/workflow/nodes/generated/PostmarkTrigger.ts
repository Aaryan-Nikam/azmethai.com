/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Postmark/PostmarkTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const PostmarkTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Events",
    "name": "events",
    "type": "multiOptions",
    "options": [
      {
        "name": "Bounce",
        "value": "bounce",
        "description": "Trigger on bounce"
      },
      {
        "name": "Click",
        "value": "click",
        "description": "Trigger on click"
      },
      {
        "name": "Delivery",
        "value": "delivery",
        "description": "Trigger on delivery"
      },
      {
        "name": "Open",
        "value": "open",
        "description": "Trigger webhook on open"
      },
      {
        "name": "Spam Complaint",
        "value": "spamComplaint",
        "description": "Trigger on spam complaint"
      },
      {
        "name": "Subscription Change",
        "value": "subscriptionChange",
        "description": "Trigger on subscription change"
      }
    ],
    "default": [],
    "required": true,
    "description": "Webhook events that will be enabled for that endpoint"
  },
  {
    "displayName": "First Open",
    "name": "firstOpen",
    "description": "Only fires on first open for event \"Open\"",
    "type": "boolean",
    "default": false,
    "displayOptions": {
      "show": {
        "events": [
          "open"
        ]
      }
    }
  },
  {
    "displayName": "Include Content",
    "name": "includeContent",
    "description": "Whether to include message content for events \"Bounce\" and \"Spam Complaint\"",
    "type": "boolean",
    "default": false,
    "displayOptions": {
      "show": {
        "events": [
          "bounce",
          "spamComplaint"
        ]
      }
    }
  }
];
