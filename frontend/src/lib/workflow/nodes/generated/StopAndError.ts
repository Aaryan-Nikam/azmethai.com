/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/StopAndError/StopAndError.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const StopAndErrorProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Error Type",
    "name": "errorType",
    "type": "options",
    "options": [
      {
        "name": "Error Message",
        "value": "errorMessage"
      },
      {
        "name": "Error Object",
        "value": "errorObject"
      }
    ],
    "default": "errorMessage",
    "description": "Type of error to throw"
  },
  {
    "displayName": "Error Message",
    "name": "errorMessage",
    "type": "string",
    "placeholder": "An error occurred!",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "errorType": [
          "errorMessage"
        ]
      }
    }
  },
  {
    "displayName": "Error Object",
    "name": "errorObject",
    "type": "json",
    "description": "Object containing error properties",
    "default": "",
    "typeOptions": {
      "alwaysOpenEditWindow": true
    },
    "placeholder": "{\n\t\"code\": \"404\",\n\t\"description\": \"The resource could not be fetched\"\n}",
    "required": true,
    "displayOptions": {
      "show": {
        "errorType": [
          "errorObject"
        ]
      }
    }
  }
];
