/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/N8nTrigger/N8nTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const N8nTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Events",
    "name": "events",
    "type": "multiOptions",
    "required": true,
    "default": [],
    "description": "Specifies under which conditions an execution should happen: <b>Instance started</b>: Triggers when this n8n instance is started or re-started",
    "options": [
      {
        "name": "Instance Started",
        "value": "init",
        "description": "Triggers when this n8n instance is started or re-started"
      }
    ]
  }
];
