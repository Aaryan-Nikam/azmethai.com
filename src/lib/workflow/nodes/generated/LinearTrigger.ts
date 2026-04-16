/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Linear/LinearTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const LinearTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Team Name or ID",
    "name": "teamId",
    "type": "options",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>",
    "typeOptions": {
      "loadOptionsMethod": "getTeams"
    },
    "default": ""
  },
  {
    "displayName": "Listen to Resources",
    "name": "resources",
    "type": "multiOptions",
    "options": [
      {
        "name": "Comment Reaction",
        "value": "reaction"
      },
      {
        "name": "Cycle",
        "value": "cycle"
      },
      {
        "name": "Issue",
        "value": "issue"
      },
      {
        "name": "Issue Comment",
        "value": "comment"
      },
      {
        "name": "Issue Label",
        "value": "issueLabel"
      },
      {
        "name": "Project",
        "value": "project"
      }
    ],
    "default": [],
    "required": true
  }
];
