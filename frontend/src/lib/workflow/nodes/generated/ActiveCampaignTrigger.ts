/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/ActiveCampaign/ActiveCampaignTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const ActiveCampaignTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Event Names or IDs",
    "name": "events",
    "type": "multiOptions",
    "description": "Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>",
    "typeOptions": {
      "loadOptionsMethod": "getEvents"
    },
    "default": [],
    "options": []
  },
  {
    "displayName": "Source",
    "name": "sources",
    "type": "multiOptions",
    "options": [
      {
        "name": "Public",
        "value": "public",
        "description": "Run the hooks when a contact triggers the action"
      },
      {
        "name": "Admin",
        "value": "admin",
        "description": "Run the hooks when an admin user triggers the action"
      },
      {
        "name": "Api",
        "value": "api",
        "description": "Run the hooks when an API call triggers the action"
      },
      {
        "name": "System",
        "value": "system",
        "description": "Run the hooks when automated systems triggers the action"
      }
    ],
    "default": []
  }
];
