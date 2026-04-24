/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Typeform/TypeformTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const TypeformTriggerProperties: AzmethNodeProperty[] = [
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
    "options": [],
    "default": "",
    "required": true,
    "description": "Form which should trigger workflow on submission. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
  },
  {
    "displayName": "Simplify Answers",
    "name": "simplifyAnswers",
    "type": "boolean",
    "default": true,
    "description": "Whether to convert the answers to a key:value pair (\"FIELD_TITLE\":\"USER_ANSER\") to be easily processable"
  },
  {
    "displayName": "Only Answers",
    "name": "onlyAnswers",
    "type": "boolean",
    "default": true,
    "description": "Whether to return only the answers of the form and not any of the other data"
  }
];
