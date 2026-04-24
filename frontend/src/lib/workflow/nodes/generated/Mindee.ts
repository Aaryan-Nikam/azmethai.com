/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Mindee/Mindee.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const MindeeProperties: AzmethNodeProperty[] = [
  {
    "displayName": "API Version",
    "name": "apiVersion",
    "type": "options",
    "isNodeSetting": true,
    "displayOptions": {
      "show": {
        "@version": [
          1
        ]
      }
    },
    "options": [
      {
        "name": "1",
        "value": 1
      },
      {
        "name": "3",
        "value": 3
      },
      {
        "name": "4",
        "value": 4
      }
    ],
    "default": 1,
    "description": "Which Mindee API Version to use"
  },
  {
    "displayName": "API Version",
    "name": "apiVersion",
    "type": "options",
    "isNodeSetting": true,
    "displayOptions": {
      "show": {
        "@version": [
          2
        ]
      }
    },
    "options": [
      {
        "name": "1",
        "value": 1
      },
      {
        "name": "3",
        "value": 3
      },
      {
        "name": "4",
        "value": 4
      }
    ],
    "default": 3,
    "description": "Which Mindee API Version to use"
  },
  {
    "displayName": "API Version",
    "name": "apiVersion",
    "type": "options",
    "isNodeSetting": true,
    "displayOptions": {
      "show": {
        "@version": [
          3
        ]
      }
    },
    "options": [
      {
        "name": "1",
        "value": 1
      },
      {
        "name": "3",
        "value": 3
      },
      {
        "name": "4",
        "value": 4
      }
    ],
    "default": 4,
    "description": "Which Mindee API Version to use"
  },
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Invoice",
        "value": "invoice"
      },
      {
        "name": "Receipt",
        "value": "receipt"
      }
    ],
    "default": "receipt"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Predict",
        "value": "predict"
      }
    ],
    "default": "predict"
  },
  {
    "displayName": "Binary Property",
    "name": "binaryPropertyName",
    "type": "string",
    "required": true,
    "default": "data",
    "displayOptions": {
      "show": {
        "operation": [
          "predict"
        ],
        "resource": [
          "receipt",
          "invoice"
        ]
      }
    },
    "description": "Name of the binary property which containsthe data for the file to be uploaded"
  },
  {
    "displayName": "RAW Data",
    "name": "rawData",
    "type": "boolean",
    "default": false,
    "description": "Whether to return the data exactly in the way it got received from the API"
  }
];
