/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/PayPal/PayPalTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const PayPalTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Event Names or IDs",
    "name": "events",
    "type": "multiOptions",
    "required": true,
    "default": [],
    "description": "The event to listen to. Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>.",
    "typeOptions": {
      "loadOptionsMethod": "getEvents"
    },
    "options": []
  }
];
