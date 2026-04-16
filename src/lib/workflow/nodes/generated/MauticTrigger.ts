/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Mautic/MauticTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const MauticTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Authentication",
    "name": "authentication",
    "type": "options",
    "options": [
      {
        "name": "Credentials",
        "value": "credentials"
      },
      {
        "name": "OAuth2",
        "value": "oAuth2"
      }
    ],
    "default": "credentials"
  },
  {
    "displayName": "Event Names or IDs",
    "name": "events",
    "type": "multiOptions",
    "description": "Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>",
    "required": true,
    "typeOptions": {
      "loadOptionsMethod": "getEvents"
    },
    "default": []
  },
  {
    "displayName": "Events Order",
    "name": "eventsOrder",
    "type": "options",
    "default": "ASC",
    "options": [
      {
        "name": "ASC",
        "value": "ASC"
      },
      {
        "name": "DESC",
        "value": "DESC"
      }
    ],
    "description": "Order direction for queued events in one webhook. Can be “DESC” or “ASC”."
  }
];
