/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/JotForm/JotFormTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const JotFormTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Form Name or ID",
    "name": "form",
    "type": "options",
    "required": true,
    "typeOptions": {
      "loadOptionsMethod": "getForms"
    },
    "default": "",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>"
  },
  {
    "displayName": "Resolve Data",
    "name": "resolveData",
    "type": "boolean",
    "default": true,
    "description": "By default does the webhook-data use internal keys instead of the names. If this option gets activated, it will resolve the keys automatically to the actual names."
  },
  {
    "displayName": "Only Answers",
    "name": "onlyAnswers",
    "type": "boolean",
    "default": true,
    "description": "Whether to return only the answers of the form and not any of the other data"
  }
];
