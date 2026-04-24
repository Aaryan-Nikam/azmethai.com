/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/FormIo/FormIoTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const FormIoTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Project Name or ID",
    "name": "projectId",
    "type": "options",
    "typeOptions": {
      "loadOptionsMethod": "getProjects"
    },
    "required": true,
    "default": "",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>"
  },
  {
    "displayName": "Form Name or ID",
    "name": "formId",
    "type": "options",
    "typeOptions": {
      "loadOptionsDependsOn": [
        "projectId"
      ],
      "loadOptionsMethod": "getForms"
    },
    "required": true,
    "default": "",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>"
  },
  {
    "displayName": "Trigger Events",
    "name": "events",
    "type": "multiOptions",
    "options": [
      {
        "name": "Submission Created",
        "value": "create"
      },
      {
        "name": "Submission Updated",
        "value": "update"
      }
    ],
    "required": true,
    "default": []
  },
  {
    "displayName": "Simplify",
    "name": "simple",
    "type": "boolean",
    "default": true,
    "description": "Whether to return a simplified version of the response instead of the raw data"
  }
];
