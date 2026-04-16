/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Bitbucket/BitbucketTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const BitbucketTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "required": true,
    "options": [
      {
        "name": "Repository",
        "value": "repository"
      },
      {
        "name": "Workspace",
        "value": "workspace"
      }
    ],
    "default": "workspace"
  },
  {
    "displayName": "Workspace Name or ID",
    "name": "workspace",
    "type": "options",
    "displayOptions": {
      "show": {
        "resource": [
          "workspace",
          "repository"
        ]
      }
    },
    "typeOptions": {
      "loadOptionsMethod": "getWorkspaces"
    },
    "required": true,
    "default": "",
    "description": "The repository of which to listen to the events. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
  },
  {
    "displayName": "Event Names or IDs",
    "name": "events",
    "type": "multiOptions",
    "displayOptions": {
      "show": {
        "resource": [
          "workspace"
        ]
      }
    },
    "typeOptions": {
      "loadOptionsMethod": "getWorkspaceEvents"
    },
    "options": [],
    "required": true,
    "default": [],
    "description": "The events to listen to. Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
  },
  {
    "displayName": "Repository Name or ID",
    "name": "repository",
    "type": "options",
    "displayOptions": {
      "show": {
        "resource": [
          "repository"
        ]
      }
    },
    "typeOptions": {
      "loadOptionsMethod": "getRepositories",
      "loadOptionsDependsOn": [
        "workspace"
      ]
    },
    "required": true,
    "default": "",
    "description": "The repository of which to listen to the events. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
  },
  {
    "displayName": "Event Names or IDs",
    "name": "events",
    "type": "multiOptions",
    "displayOptions": {
      "show": {
        "resource": [
          "repository"
        ]
      }
    },
    "typeOptions": {
      "loadOptionsMethod": "getRepositoriesEvents"
    },
    "options": [],
    "required": true,
    "default": [],
    "description": "The events to listen to. Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
  }
];
