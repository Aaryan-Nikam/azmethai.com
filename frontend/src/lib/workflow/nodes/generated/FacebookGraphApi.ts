/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Facebook/FacebookGraphApi.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const FacebookGraphApiProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Host URL",
    "name": "hostUrl",
    "type": "options",
    "options": [
      {
        "name": "Default",
        "value": "graph.facebook.com"
      },
      {
        "name": "Video Uploads",
        "value": "graph-video.facebook.com"
      }
    ],
    "default": "graph.facebook.com",
    "description": "The Host URL of the request. Almost all requests are passed to the graph.facebook.com host URL. The single exception is video uploads, which use graph-video.facebook.com.",
    "required": true
  },
  {
    "displayName": "HTTP Request Method",
    "name": "httpRequestMethod",
    "type": "options",
    "options": [
      {
        "name": "GET",
        "value": "GET"
      },
      {
        "name": "POST",
        "value": "POST"
      },
      {
        "name": "DELETE",
        "value": "DELETE"
      }
    ],
    "default": "GET",
    "description": "The HTTP Method to be used for the request",
    "required": true
  },
  {
    "displayName": "Graph API Version",
    "name": "graphApiVersion",
    "type": "options",
    "options": [
      {
        "name": "Default",
        "value": ""
      },
      {
        "name": "v15.0",
        "value": "v15.0"
      },
      {
        "name": "v14.0",
        "value": "v14.0"
      },
      {
        "name": "v13.0",
        "value": "v13.0"
      },
      {
        "name": "v12.0",
        "value": "v12.0"
      },
      {
        "name": "v11.0",
        "value": "v11.0"
      },
      {
        "name": "v10.0",
        "value": "v10.0"
      },
      {
        "name": "v9.0",
        "value": "v9.0"
      },
      {
        "name": "v8.0",
        "value": "v8.0"
      },
      {
        "name": "v7.0",
        "value": "v7.0"
      },
      {
        "name": "v6.0",
        "value": "v6.0"
      },
      {
        "name": "v5.0",
        "value": "v5.0"
      },
      {
        "name": "v4.0",
        "value": "v4.0"
      },
      {
        "name": "v3.3",
        "value": "v3.3"
      },
      {
        "name": "v3.2",
        "value": "v3.2"
      },
      {
        "name": "v3.1",
        "value": "v3.1"
      },
      {
        "name": "v3.0",
        "value": "v3.0"
      }
    ],
    "default": "",
    "description": "The version of the Graph API to be used in the request",
    "required": true
  },
  {
    "displayName": "Node",
    "name": "node",
    "type": "string",
    "default": "",
    "description": "The node on which to operate. A node is an individual object with a unique ID. For example, there are many User node objects, each with a unique ID representing a person on Facebook.",
    "placeholder": "me",
    "required": true
  },
  {
    "displayName": "Edge",
    "name": "edge",
    "type": "string",
    "default": "",
    "description": "Edge of the node on which to operate. Edges represent collections of objects which are attached to the node.",
    "placeholder": "videos"
  },
  {
    "displayName": "Ignore SSL Issues",
    "name": "allowUnauthorizedCerts",
    "type": "boolean",
    "default": false,
    "description": "Whether to connect even if SSL certificate validation is not possible"
  },
  {
    "displayName": "Send Binary Data",
    "name": "sendBinaryData",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "httpRequestMethod": [
          "POST",
          "PUT"
        ]
      }
    },
    "default": false,
    "required": true,
    "description": "Whether binary data should be sent as body"
  },
  {
    "displayName": "Binary Property",
    "name": "binaryPropertyName",
    "type": "string",
    "default": "",
    "placeholder": "file:data",
    "displayOptions": {
      "hide": {
        "sendBinaryData": [
          false
        ]
      },
      "show": {
        "httpRequestMethod": [
          "POST",
          "PUT"
        ]
      }
    },
    "description": "Name of the binary property which contains the data for the file to be uploaded. For Form-Data Multipart, they can be provided in the format: <code>\"sendKey1:binaryProperty1,sendKey2:binaryProperty2</code>"
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Fields",
        "name": "fields",
        "placeholder": "Add Field",
        "type": "fixedCollection",
        "typeOptions": {
          "multipleValues": true
        },
        "displayOptions": {
          "show": {
            "/httpRequestMethod": [
              "GET"
            ]
          }
        },
        "description": "The list of fields to request in the GET request",
        "default": {},
        "options": [
          {
            "name": "field",
            "displayName": "Field",
            "values": [
              {
                "displayName": "Name",
                "name": "name",
                "type": "string",
                "default": "",
                "description": "Name of the field"
              }
            ]
          }
        ]
      },
      {
        "displayName": "Query Parameters",
        "name": "queryParameters",
        "placeholder": "Add Parameter",
        "type": "fixedCollection",
        "typeOptions": {
          "multipleValues": true
        },
        "description": "The query parameters to send",
        "default": {},
        "options": [
          {
            "name": "parameter",
            "displayName": "Parameter",
            "values": [
              {
                "displayName": "Name",
                "name": "name",
                "type": "string",
                "default": "",
                "description": "Name of the parameter"
              },
              {
                "displayName": "Value",
                "name": "value",
                "type": "string",
                "default": "",
                "description": "Value of the parameter"
              }
            ]
          }
        ]
      },
      {
        "displayName": "Query Parameters JSON",
        "name": "queryParametersJson",
        "type": "json",
        "default": "{}",
        "placeholder": "{\"field_name\": \"field_value\"}",
        "description": "The query parameters to send, defined as a JSON object"
      }
    ]
  }
];
