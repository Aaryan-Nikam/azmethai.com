/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/WorkflowTrigger/WorkflowTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const WorkflowTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Events",
    "name": "events",
    "type": "multiOptions",
    "required": true,
    "default": [],
    "description": "Specifies under which conditions an execution should happen:\n\t\t\t\t\t<ul>\n\t\t\t\t\t\t<li><b>Active Workflow Updated</b>: Triggers when this workflow is updated</li>\n\t\t\t\t\t\t<li><b>Workflow Activated</b>: Triggers when this workflow is activated</li>\n\t\t\t\t\t</ul>",
    "options": [
      {
        "name": "Active Workflow Updated",
        "value": "update",
        "description": "Triggers when this workflow is updated"
      },
      {
        "name": "Workflow Activated",
        "value": "activate",
        "description": "Triggers when this workflow is activated"
      }
    ]
  }
];
