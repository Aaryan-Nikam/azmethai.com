/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/ExecutionData/ExecutionData.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const ExecutionDataProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Use this node to save fields you want to use later to easily find an execution (e.g. a user ID). You'll be able to search by this data in the 'executions' tab.<br>This feature is available on our Pro and Enterprise plans. <a href='https://n8n.io/pricing/' target='_blank'>More Info</a>.",
    "name": "notice",
    "type": "notice",
    "default": ""
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "default": "save",
    "noDataExpression": true,
    "options": [
      {
        "name": "Save Execution Data for Search",
        "value": "save",
        "action": "Save execution data for search"
      }
    ]
  },
  {
    "displayName": "Data to Save",
    "name": "dataToSave",
    "placeholder": "Add Saved Field",
    "type": "fixedCollection",
    "typeOptions": {
      "multipleValueButtonText": "Add Saved Field",
      "multipleValues": true
    },
    "displayOptions": {
      "show": {
        "operation": [
          "save"
        ]
      }
    },
    "default": {},
    "options": [
      {
        "displayName": "Values",
        "name": "values",
        "values": [
          {
            "displayName": "Key",
            "name": "key",
            "type": "string",
            "default": "",
            "placeholder": "e.g. myKey"
          },
          {
            "displayName": "Value",
            "name": "value",
            "type": "string",
            "default": "",
            "placeholder": "e.g. myValue"
          }
        ]
      }
    ]
  }
];
