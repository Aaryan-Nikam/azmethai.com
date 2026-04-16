/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/RespondToWebhook/RespondToWebhook.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const RespondToWebhookProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Respond With",
    "name": "respondWith",
    "type": "options",
    "options": [
      {
        "name": "Binary",
        "value": "binary"
      },
      {
        "name": "First Incoming Item",
        "value": "firstIncomingItem"
      },
      {
        "name": "JSON",
        "value": "json"
      },
      {
        "name": "No Data",
        "value": "noData"
      },
      {
        "name": "Text",
        "value": "text"
      }
    ],
    "default": "firstIncomingItem",
    "description": "The data that should be returned"
  },
  {
    "displayName": "When using expressions, note that this node will only run for the first item in the input data.",
    "name": "webhookNotice",
    "type": "notice",
    "displayOptions": {
      "show": {
        "respondWith": [
          "json",
          "text"
        ]
      }
    },
    "default": ""
  },
  {
    "displayName": "Response Body",
    "name": "responseBody",
    "type": "json",
    "displayOptions": {
      "show": {
        "respondWith": [
          "json"
        ]
      }
    },
    "default": "",
    "placeholder": "{ \"key\": \"value\" }",
    "description": "The HTTP Response JSON data"
  },
  {
    "displayName": "Response Body",
    "name": "responseBody",
    "type": "string",
    "displayOptions": {
      "show": {
        "respondWith": [
          "text"
        ]
      }
    },
    "default": "",
    "placeholder": "e.g. Workflow started",
    "description": "The HTTP Response text data"
  },
  {
    "displayName": "Response Data Source",
    "name": "responseDataSource",
    "type": "options",
    "displayOptions": {
      "show": {
        "respondWith": [
          "binary"
        ]
      }
    },
    "options": [
      {
        "name": "Choose Automatically From Input",
        "value": "automatically",
        "description": "Use if input data will contain a single piece of binary data"
      },
      {
        "name": "Specify Myself",
        "value": "set",
        "description": "Enter the name of the input field the binary data will be in"
      }
    ],
    "default": "automatically"
  },
  {
    "displayName": "Input Field Name",
    "name": "inputFieldName",
    "type": "string",
    "required": true,
    "default": "data",
    "displayOptions": {
      "show": {
        "respondWith": [
          "binary"
        ],
        "responseDataSource": [
          "set"
        ]
      }
    },
    "description": "The name of the node input field with the binary data"
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Response Code",
        "name": "responseCode",
        "type": "number",
        "typeOptions": {
          "minValue": 100,
          "maxValue": 599
        },
        "default": 200,
        "description": "The HTTP Response code to return. Defaults to 200."
      },
      {
        "displayName": "Response Headers",
        "name": "responseHeaders",
        "placeholder": "Add Response Header",
        "description": "Add headers to the webhook response",
        "type": "fixedCollection",
        "typeOptions": {
          "multipleValues": true
        },
        "default": {},
        "options": [
          {
            "name": "entries",
            "displayName": "Entries",
            "values": [
              {
                "displayName": "Name",
                "name": "name",
                "type": "string",
                "default": "",
                "description": "Name of the header"
              },
              {
                "displayName": "Value",
                "name": "value",
                "type": "string",
                "default": "",
                "description": "Value of the header"
              }
            ]
          }
        ]
      }
    ]
  }
];
