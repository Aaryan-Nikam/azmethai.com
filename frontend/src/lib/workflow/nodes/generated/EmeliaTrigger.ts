/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Emelia/EmeliaTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const EmeliaTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Campaign Name or ID",
    "name": "campaignId",
    "type": "options",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>",
    "typeOptions": {
      "loadOptionsMethod": "getCampaigns"
    },
    "required": true,
    "default": ""
  },
  {
    "displayName": "Events",
    "name": "events",
    "type": "multiOptions",
    "required": true,
    "default": [],
    "options": [
      {
        "name": "Email Bounced",
        "value": "bounced"
      },
      {
        "name": "Email Opened",
        "value": "opened"
      },
      {
        "name": "Email Replied",
        "value": "replied"
      },
      {
        "name": "Email Sent",
        "value": "sent"
      },
      {
        "name": "Link Clicked",
        "value": "clicked"
      },
      {
        "name": "Unsubscribed Contact",
        "value": "unsubscribed"
      }
    ]
  }
];
