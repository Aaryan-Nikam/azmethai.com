/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Redis/RedisTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const RedisTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Channels",
    "name": "channels",
    "type": "string",
    "default": "",
    "required": true,
    "description": "Channels to subscribe to, multiple channels be defined with comma. Wildcard character(*) is supported."
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "JSON Parse Body",
        "name": "jsonParseBody",
        "type": "boolean",
        "default": false,
        "description": "Whether to try to parse the message to an object"
      },
      {
        "displayName": "Only Message",
        "name": "onlyMessage",
        "type": "boolean",
        "default": false,
        "description": "Whether to return only the message property"
      }
    ]
  }
];
