/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Formstack/FormstackTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const FormstackTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Authentication",
    "name": "authentication",
    "type": "options",
    "options": [
      {
        "name": "Access Token",
        "value": "accessToken"
      },
      {
        "name": "OAuth2",
        "value": "oAuth2"
      }
    ],
    "default": "accessToken"
  },
  {
    "displayName": "Form Name or ID",
    "name": "formId",
    "type": "options",
    "typeOptions": {
      "loadOptionsMethod": "getForms"
    },
    "default": "",
    "required": true,
    "description": "The Formstack form to monitor for new submissions. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
  },
  {
    "displayName": "Simplify",
    "name": "simple",
    "type": "boolean",
    "default": true,
    "description": "Whether to return a simplified version of the response instead of the raw data"
  }
];
