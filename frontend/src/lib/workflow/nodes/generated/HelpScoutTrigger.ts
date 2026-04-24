/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/HelpScout/HelpScoutTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const HelpScoutTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Events",
    "name": "events",
    "type": "multiOptions",
    "options": [
      {
        "name": "Conversation - Assigned",
        "value": "convo.assigned"
      },
      {
        "name": "Conversation - Created",
        "value": "convo.created"
      },
      {
        "name": "Conversation - Deleted",
        "value": "convo.deleted"
      },
      {
        "name": "Conversation - Merged",
        "value": "convo.merged"
      },
      {
        "name": "Conversation - Moved",
        "value": "convo.moved"
      },
      {
        "name": "Conversation - Status",
        "value": "convo.status"
      },
      {
        "name": "Conversation - Tags",
        "value": "convo.tags"
      },
      {
        "name": "Conversation Agent Reply - Created",
        "value": "convo.agent.reply.created"
      },
      {
        "name": "Conversation Customer Reply - Created",
        "value": "convo.customer.reply.created"
      },
      {
        "name": "Conversation Note - Created",
        "value": "convo.note.created"
      },
      {
        "name": "Customer - Created",
        "value": "customer.created"
      },
      {
        "name": "Rating - Received",
        "value": "satisfaction.ratings"
      }
    ],
    "default": [],
    "required": true
  }
];
