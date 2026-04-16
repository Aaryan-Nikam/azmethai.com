/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Keap/KeapTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const KeapTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Event Name or ID",
    "name": "eventId",
    "type": "options",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>",
    "typeOptions": {
      "loadOptionsMethod": "getEvents"
    },
    "default": "",
    "required": true
  },
  {
    "displayName": "RAW Data",
    "name": "rawData",
    "type": "boolean",
    "default": false,
    "description": "Whether to return the data exactly in the way it got received from the API"
  }
];
