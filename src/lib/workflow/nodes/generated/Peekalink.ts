/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Peekalink/Peekalink.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const PeekalinkProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Is Available",
        "value": "isAvailable",
        "description": "Check whether preview for a given link is available",
        "action": "Check whether the preview for a given link is available"
      },
      {
        "name": "Preview",
        "value": "preview",
        "description": "Return the preview for a link",
        "action": "Return the preview for a link"
      }
    ],
    "default": "preview"
  },
  {
    "displayName": "URL",
    "name": "url",
    "type": "string",
    "default": "",
    "required": true
  }
];
