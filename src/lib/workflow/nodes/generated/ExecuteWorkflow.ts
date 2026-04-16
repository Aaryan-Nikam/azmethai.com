/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/ExecuteWorkflow/ExecuteWorkflow.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const ExecuteWorkflowProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "hidden",
    "noDataExpression": true,
    "default": "call_workflow",
    "options": [
      {
        "name": "Call Another Workflow",
        "value": "call_workflow"
      }
    ]
  },
  {
    "displayName": "Source",
    "name": "source",
    "type": "options",
    "options": [
      {
        "name": "Database",
        "value": "database",
        "description": "Load the workflow from the database by ID"
      },
      {
        "name": "Local File",
        "value": "localFile",
        "description": "Load the workflow from a locally saved file"
      },
      {
        "name": "Parameter",
        "value": "parameter",
        "description": "Load the workflow from a parameter"
      },
      {
        "name": "URL",
        "value": "url",
        "description": "Load the workflow from an URL"
      }
    ],
    "default": "database",
    "description": "Where to get the workflow to execute from"
  },
  {
    "displayName": "Workflow ID",
    "name": "workflowId",
    "type": "string",
    "displayOptions": {
      "show": {
        "source": [
          "database"
        ]
      }
    },
    "default": "",
    "required": true,
    "description": "The workflow to execute"
  },
  {
    "displayName": "Workflow Path",
    "name": "workflowPath",
    "type": "string",
    "displayOptions": {
      "show": {
        "source": [
          "localFile"
        ]
      }
    },
    "default": "",
    "placeholder": "/data/workflow.json",
    "required": true,
    "description": "The path to local JSON workflow file to execute"
  },
  {
    "displayName": "Workflow JSON",
    "name": "workflowJson",
    "type": "string",
    "typeOptions": {
      "editor": "json",
      "rows": 10
    },
    "displayOptions": {
      "show": {
        "source": [
          "parameter"
        ]
      }
    },
    "default": "\n\n\n",
    "required": true,
    "description": "The workflow JSON code to execute"
  },
  {
    "displayName": "Workflow URL",
    "name": "workflowUrl",
    "type": "string",
    "displayOptions": {
      "show": {
        "source": [
          "url"
        ]
      }
    },
    "default": "",
    "placeholder": "https://example.com/workflow.json",
    "required": true,
    "description": "The URL from which to load the workflow from"
  },
  {
    "displayName": "Any data you pass into this node will be output by the Execute Workflow Trigger. <a href=\"https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/\" target=\"_blank\">More info</a>",
    "name": "executeWorkflowNotice",
    "type": "notice",
    "default": ""
  }
];
