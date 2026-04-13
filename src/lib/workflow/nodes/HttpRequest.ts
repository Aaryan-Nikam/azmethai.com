import { AzmethNodeDefinition } from "../types";

export const HttpRequestNode: AzmethNodeDefinition = {
  "displayName": "HTTP Request",
  "name": "httpRequest",
  "icon": "fa:globe",
  "group": [
    "output"
  ],
  "version": [
    3,
    4,
    4.1,
    4.2,
    4.3,
    4.4
  ],
  "subtitle": "={{$parameter[\"method\"] + \": \" + $parameter[\"url\"]}}",
  "description": "Makes an HTTP request and returns the response data",
  "defaults": {
    "name": "HTTP Request",
    "color": "#0004F5"
  },
  "inputs": [
    "main"
  ],
  "outputs": [
    "main"
  ],
  "credentials": [
    {
      "name": "httpSslAuth",
      "required": true,
      "displayOptions": {
        "show": {
          "provideSslCertificates": [
            true
          ]
        }
      }
    }
  ],
  "properties": [
    {
      "displayName": "Method",
      "name": "method",
      "type": "options",
      "options": [
        { "name": "DELETE", "value": "DELETE" },
        { "name": "GET", "value": "GET" },
        { "name": "HEAD", "value": "HEAD" },
        { "name": "OPTIONS", "value": "OPTIONS" },
        { "name": "PATCH", "value": "PATCH" },
        { "name": "POST", "value": "POST" },
        { "name": "PUT", "value": "PUT" }
      ],
      "default": "GET",
      "description": "The request method to use"
    },
    {
      "displayName": "URL",
      "name": "url",
      "type": "string",
      "default": "",
      "placeholder": "http://example.com/index.html",
      "description": "The URL to make the request to",
      "required": true
    },
    {
      "displayName": "Authentication",
      "name": "authentication",
      "noDataExpression": true,
      "type": "options",
      "options": [
        { "name": "None", "value": "none" },
        { "name": "Predefined Credential Type", "value": "predefinedCredentialType" },
        { "name": "Generic Credential Type", "value": "genericCredentialType" }
      ],
      "default": "none"
    },
    {
      "displayName": "Credential Type",
      "name": "nodeCredentialType",
      "type": "credentialsSelect",
      "noDataExpression": true,
      "required": true,
      "default": "",
      "displayOptions": {
        "show": {
          "authentication": ["predefinedCredentialType"]
        }
      }
    },
    {
      "displayName": "Generic Auth Type",
      "name": "genericAuthType",
      "type": "credentialsSelect",
      "required": true,
      "default": "",
      "displayOptions": {
        "show": {
          "authentication": ["genericCredentialType"]
        }
      }
    },
    {
      "displayName": "Send Query Parameters",
      "name": "sendQuery",
      "type": "boolean",
      "default": false,
      "noDataExpression": true
    },
    {
      "displayName": "Specify Query Parameters",
      "name": "specifyQuery",
      "type": "options",
      "displayOptions": {
        "show": { "sendQuery": [true] }
      },
      "options": [
        { "name": "Using Fields Below", "value": "keypair" },
        { "name": "Using JSON", "value": "json" }
      ],
      "default": "keypair"
    },
    {
      "displayName": "Query Parameters",
      "name": "queryParameters",
      "type": "fixedCollection",
      "displayOptions": {
        "show": { "sendQuery": [true], "specifyQuery": ["keypair"] }
      },
      "typeOptions": { "multipleValues": true },
      "placeholder": "Add Query Parameter",
      "default": { "parameters": [{ "name": "", "value": "" }] },
      "options": [
        {
          "name": "parameters",
          "displayName": "Query Parameter",
          "values": [
            { "displayName": "Name", "name": "name", "type": "string", "default": "" },
            { "displayName": "Value", "name": "value", "type": "string", "default": "" }
          ]
        }
      ]
    },
    {
      "displayName": "JSON",
      "name": "jsonQuery",
      "type": "json",
      "displayOptions": {
        "show": { "sendQuery": [true], "specifyQuery": ["json"] }
      },
      "default": ""
    },
    {
      "displayName": "Send Body",
      "name": "sendBody",
      "type": "boolean",
      "default": false,
      "noDataExpression": true
    },
    {
      "displayName": "Body Content Type",
      "name": "contentType",
      "type": "options",
      "displayOptions": {
        "show": { "sendBody": [true] }
      },
      "options": [
        { "name": "Form Urlencoded", "value": "form-urlencoded" },
        { "name": "Form-Data", "value": "multipart-form-data" },
        { "name": "JSON", "value": "json" },
        { "name": "Raw", "value": "raw" }
      ],
      "default": "json"
    },
    {
      "displayName": "Body Parameters",
      "name": "bodyParameters",
      "type": "fixedCollection",
      "displayOptions": {
        "show": { "sendBody": [true], "contentType": ["json"], "specifyBody": ["keypair"] }
      },
      "typeOptions": { "multipleValues": true },
      "default": { "parameters": [{ "name": "", "value": "" }] },
      "options": [
        {
          "name": "parameters",
          "displayName": "Body Field",
          "values": [
            { "displayName": "Name", "name": "name", "type": "string", "default": "" },
            { "displayName": "Value", "name": "value", "type": "string", "default": "" }
          ]
        }
      ]
    },
    {
      "displayName": "JSON",
      "name": "jsonBody",
      "type": "json",
      "displayOptions": {
        "show": { "sendBody": [true], "contentType": ["json"], "specifyBody": ["json"] }
      },
      "default": ""
    }
  ]
};
