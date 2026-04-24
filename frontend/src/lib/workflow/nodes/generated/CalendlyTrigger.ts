/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Calendly/CalendlyTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const CalendlyTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Scope",
    "name": "scope",
    "type": "options",
    "default": "user",
    "required": true,
    "hint": "Ignored if you are using an API Key",
    "options": [
      {
        "name": "Organization",
        "value": "organization",
        "description": "Triggers the webhook for all subscribed events within the organization"
      },
      {
        "name": "User",
        "value": "user",
        "description": "Triggers the webhook for subscribed events that belong to the current user"
      }
    ]
  },
  {
    "displayName": "Events",
    "name": "events",
    "type": "multiOptions",
    "options": [
      {
        "name": "invitee.created",
        "value": "invitee.created",
        "description": "Receive notifications when a new Calendly event is created"
      },
      {
        "name": "invitee.canceled",
        "value": "invitee.canceled",
        "description": "Receive notifications when a Calendly event is canceled"
      }
    ],
    "default": [],
    "required": true
  }
];
