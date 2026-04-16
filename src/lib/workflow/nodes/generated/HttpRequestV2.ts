/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/HttpRequest/V2/HttpRequestV2.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const HttpRequestV2Properties: AzmethNodeProperty[] = [
  {
    "displayName": "Authentication",
    "name": "authentication",
    "noDataExpression": true,
    "type": "options",
    "required": true,
    "options": [
      {
        "name": "None",
        "value": "none"
      },
      {
        "name": "Predefined Credential Type",
        "value": "predefinedCredentialType",
        "description": "We've already implemented auth for many services so that you don't have to set it up manually"
      },
      {
        "name": "Generic Credential Type",
        "value": "genericCredentialType",
        "description": "Fully customizable. Choose between basic, header, OAuth2, etc."
      }
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
    "credentialTypes": [
      "extends:oAuth2Api",
      "extends:oAuth1Api",
      "has:authenticate"
    ],
    "displayOptions": {
      "show": {
        "authentication": [
          "predefinedCredentialType"
        ]
      }
    }
  },
  {
    "displayName": "Generic Auth Type",
    "name": "genericAuthType",
    "type": "credentialsSelect",
    "required": true,
    "default": "",
    "credentialTypes": [
      "has:genericAuth"
    ],
    "displayOptions": {
      "show": {
        "authentication": [
          "genericCredentialType"
        ]
      }
    }
  },
  {
    "displayName": "Request Method",
    "name": "requestMethod",
    "type": "options",
    "options": [
      {
        "name": "DELETE",
        "value": "DELETE"
      },
      {
        "name": "GET",
        "value": "GET"
      },
      {
        "name": "HEAD",
        "value": "HEAD"
      },
      {
        "name": "OPTIONS",
        "value": "OPTIONS"
      },
      {
        "name": "PATCH",
        "value": "PATCH"
      },
      {
        "name": "POST",
        "value": "POST"
      },
      {
        "name": "PUT",
        "value": "PUT"
      }
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
    "displayName": "Ignore SSL Issues",
    "name": "allowUnauthorizedCerts",
    "type": "boolean",
    "default": false,
    "description": "Whether to download the response even if SSL certificate validation is not possible"
  },
  {
    "displayName": "Response Format",
    "name": "responseFormat",
    "type": "options",
    "options": [
      {
        "name": "File",
        "value": "file"
      },
      {
        "name": "JSON",
        "value": "json"
      },
      {
        "name": "String",
        "value": "string"
      }
    ],
    "default": "json",
    "description": "The format in which the data gets returned from the URL"
  },
  {
    "displayName": "Property Name",
    "name": "dataPropertyName",
    "type": "string",
    "default": "data",
    "required": true,
    "displayOptions": {
      "show": {
        "responseFormat": [
          "string"
        ]
      }
    },
    "description": "Name of the property to which to write the response data"
  },
  {
    "displayName": "Binary Property",
    "name": "dataPropertyName",
    "type": "string",
    "default": "data",
    "required": true,
    "displayOptions": {
      "show": {
        "responseFormat": [
          "file"
        ]
      }
    },
    "description": "Name of the binary property to which to write the data of the read file"
  },
  {
    "displayName": "JSON/RAW Parameters",
    "name": "jsonParameters",
    "type": "boolean",
    "default": false,
    "description": "Whether the query and/or body parameter should be set via the value-key pair UI or JSON/RAW"
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Batch Interval",
        "name": "batchInterval",
        "type": "number",
        "typeOptions": {
          "minValue": 0
        },
        "default": 1000,
        "description": "Time (in milliseconds) between each batch of requests. 0 for disabled."
      },
      {
        "displayName": "Batch Size",
        "name": "batchSize",
        "type": "number",
        "typeOptions": {
          "minValue": -1
        },
        "default": 50,
        "description": "Input will be split in batches to throttle requests. -1 for disabled. 0 will be treated as 1."
      },
      {
        "displayName": "Body Content Type",
        "name": "bodyContentType",
        "type": "options",
        "displayOptions": {
          "show": {
            "/requestMethod": [
              "PATCH",
              "POST",
              "PUT"
            ]
          }
        },
        "options": [
          {
            "name": "JSON",
            "value": "json"
          },
          {
            "name": "RAW/Custom",
            "value": "raw"
          },
          {
            "name": "Form-Data Multipart",
            "value": "multipart-form-data"
          },
          {
            "name": "Form Urlencoded",
            "value": "form-urlencoded"
          }
        ],
        "default": "json",
        "description": "Content-Type to use to send body parameters"
      },
      {
        "displayName": "Full Response",
        "name": "fullResponse",
        "type": "boolean",
        "default": false,
        "description": "Whether to return the full response data instead of only the body"
      },
      {
        "displayName": "Follow All Redirects",
        "name": "followAllRedirects",
        "type": "boolean",
        "default": false,
        "description": "Whether to follow non-GET HTTP 3xx redirects"
      },
      {
        "displayName": "Follow GET Redirect",
        "name": "followRedirect",
        "type": "boolean",
        "default": true,
        "description": "Whether to follow GET HTTP 3xx redirects"
      },
      {
        "displayName": "Ignore Response Code",
        "name": "ignoreResponseCode",
        "type": "boolean",
        "default": false,
        "description": "Whether to succeeds also when status code is not 2xx"
      },
      {
        "displayName": "MIME Type",
        "name": "bodyContentCustomMimeType",
        "type": "string",
        "default": "",
        "placeholder": "text/xml",
        "description": "Specify the mime type for raw/custom body type",
        "displayOptions": {
          "show": {
            "/requestMethod": [
              "PATCH",
              "POST",
              "PUT"
            ]
          }
        }
      },
      {
        "displayName": "Proxy",
        "name": "proxy",
        "type": "string",
        "default": "",
        "placeholder": "http://myproxy:3128",
        "description": "HTTP proxy to use"
      },
      {
        "displayName": "Split Into Items",
        "name": "splitIntoItems",
        "type": "boolean",
        "default": false,
        "description": "Whether to output each element of an array as own item",
        "displayOptions": {
          "show": {
            "/responseFormat": [
              "json"
            ]
          }
        }
      },
      {
        "displayName": "Timeout",
        "name": "timeout",
        "type": "number",
        "typeOptions": {
          "minValue": 1
        },
        "default": 10000,
        "description": "Time in ms to wait for the server to send response headers (and start the response body) before aborting the request"
      },
      {
        "displayName": "Use Querystring",
        "name": "useQueryString",
        "type": "boolean",
        "default": false,
        "description": "Whether you need arrays to be serialized as foo=bar&foo=baz instead of the default foo[0]=bar&foo[1]=baz"
      }
    ]
  },
  {
    "displayName": "Send Binary Data",
    "name": "sendBinaryData",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "jsonParameters": [
          true
        ],
        "requestMethod": [
          "PATCH",
          "POST",
          "PUT"
        ]
      }
    },
    "default": false,
    "description": "Whether binary data should be send as body"
  },
  {
    "displayName": "Binary Property",
    "name": "binaryPropertyName",
    "type": "string",
    "required": true,
    "default": "data",
    "displayOptions": {
      "hide": {
        "sendBinaryData": [
          false
        ]
      },
      "show": {
        "jsonParameters": [
          true
        ],
        "requestMethod": [
          "PATCH",
          "POST",
          "PUT"
        ]
      }
    },
    "description": "Name of the binary property which contains the data for the file to be uploaded. For Form-Data Multipart, they can be provided in the format: <code>\"sendKey1:binaryProperty1,sendKey2:binaryProperty2</code>"
  },
  {
    "displayName": "Body Parameters",
    "name": "bodyParametersJson",
    "type": "json",
    "displayOptions": {
      "hide": {
        "sendBinaryData": [
          true
        ]
      },
      "show": {
        "jsonParameters": [
          true
        ],
        "requestMethod": [
          "PATCH",
          "POST",
          "PUT",
          "DELETE"
        ]
      }
    },
    "default": "",
    "description": "Body parameters as JSON or RAW"
  },
  {
    "displayName": "Body Parameters",
    "name": "bodyParametersUi",
    "placeholder": "Add Parameter",
    "type": "fixedCollection",
    "typeOptions": {
      "multipleValues": true
    },
    "displayOptions": {
      "show": {
        "jsonParameters": [
          false
        ],
        "requestMethod": [
          "PATCH",
          "POST",
          "PUT",
          "DELETE"
        ]
      }
    },
    "description": "The body parameter to send",
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
    "displayName": "Headers",
    "name": "headerParametersJson",
    "type": "json",
    "displayOptions": {
      "show": {
        "jsonParameters": [
          true
        ]
      }
    },
    "default": "",
    "description": "Header parameters as JSON or RAW"
  },
  {
    "displayName": "Headers",
    "name": "headerParametersUi",
    "placeholder": "Add Header",
    "type": "fixedCollection",
    "typeOptions": {
      "multipleValues": true
    },
    "displayOptions": {
      "show": {
        "jsonParameters": [
          false
        ]
      }
    },
    "description": "The headers to send",
    "default": {},
    "options": [
      {
        "name": "parameter",
        "displayName": "Header",
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
            "description": "Value to set for the header"
          }
        ]
      }
    ]
  },
  {
    "displayName": "Query Parameters",
    "name": "queryParametersJson",
    "type": "json",
    "displayOptions": {
      "show": {
        "jsonParameters": [
          true
        ]
      }
    },
    "default": "",
    "description": "Query parameters as JSON (flat object)"
  },
  {
    "displayName": "Query Parameters",
    "name": "queryParametersUi",
    "placeholder": "Add Parameter",
    "type": "fixedCollection",
    "typeOptions": {
      "multipleValues": true
    },
    "displayOptions": {
      "show": {
        "jsonParameters": [
          false
        ]
      }
    },
    "description": "The query parameter to send",
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
    "displayName": "You can view the raw requests this node makes in your browser's developer console",
    "name": "infoMessage",
    "type": "notice",
    "default": ""
  }
];
