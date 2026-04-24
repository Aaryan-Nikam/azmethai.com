/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Mailjet/MailjetTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const MailjetTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "required": true,
    "default": "open",
    "options": [
      {
        "name": "email.blocked",
        "value": "blocked"
      },
      {
        "name": "email.bounce",
        "value": "bounce"
      },
      {
        "name": "email.open",
        "value": "open"
      },
      {
        "name": "email.sent",
        "value": "sent"
      },
      {
        "name": "email.spam",
        "value": "spam"
      },
      {
        "name": "email.unsub",
        "value": "unsub"
      }
    ],
    "description": "Determines which resource events the webhook is triggered for"
  }
];
