/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/ExecuteWorkflowTrigger/ExecuteWorkflowTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const ExecuteWorkflowTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "When an ‘execute workflow’ node calls this workflow, the execution starts here. Any data passed into the 'execute workflow' node will be output by this node.",
    "name": "notice",
    "type": "notice",
    "default": ""
  },
  {
    "displayName": "Events",
    "name": "events",
    "type": "hidden",
    "noDataExpression": true,
    "options": [
      {
        "name": "Workflow Call",
        "value": "worklfow_call",
        "description": "When called by another workflow using Execute Workflow Trigger",
        "action": "When Called by Another Workflow"
      }
    ],
    "default": "worklfow_call"
  }
];
