/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Wait/Wait.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const WaitProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Webhook Authentication",
    "name": "incomingAuthentication",
    "type": "options",
    "displayOptions": {
      "show": {
        "resume": [
          "webhook"
        ]
      }
    },
    "options": [
      {
        "name": "Basic Auth",
        "value": "basicAuth"
      },
      {
        "name": "Header Auth",
        "value": "headerAuth"
      },
      {
        "name": "None",
        "value": "none"
      }
    ],
    "default": "none",
    "description": "If and how incoming resume-webhook-requests to $execution.resumeUrl should be authenticated for additional security"
  },
  {
    "displayName": "Resume",
    "name": "resume",
    "type": "options",
    "options": [
      {
        "name": "After Time Interval",
        "value": "timeInterval",
        "description": "Waits for a certain amount of time"
      },
      {
        "name": "At Specified Time",
        "value": "specificTime",
        "description": "Waits until a specific date and time to continue"
      },
      {
        "name": "On Webhook Call",
        "value": "webhook",
        "description": "Waits for a webhook call before continuing"
      }
    ],
    "default": "timeInterval",
    "description": "Determines the waiting mode to use before the workflow continues"
  },
  {
    "displayName": "Date and Time",
    "name": "dateTime",
    "type": "dateTime",
    "displayOptions": {
      "show": {
        "resume": [
          "specificTime"
        ]
      }
    },
    "default": "",
    "description": "The date and time to wait for before continuing"
  },
  {
    "displayName": "Wait Amount",
    "name": "amount",
    "type": "number",
    "displayOptions": {
      "show": {
        "resume": [
          "timeInterval"
        ]
      }
    },
    "typeOptions": {
      "minValue": 0,
      "numberPrecision": 2
    },
    "default": 1,
    "description": "The time to wait"
  },
  {
    "displayName": "Wait Unit",
    "name": "unit",
    "type": "options",
    "displayOptions": {
      "show": {
        "resume": [
          "timeInterval"
        ]
      }
    },
    "options": [
      {
        "name": "Seconds",
        "value": "seconds"
      },
      {
        "name": "Minutes",
        "value": "minutes"
      },
      {
        "name": "Hours",
        "value": "hours"
      },
      {
        "name": "Days",
        "value": "days"
      }
    ],
    "default": "hours",
    "description": "The time unit of the Wait Amount value"
  },
  {
    "displayName": "The webhook URL will be generated at run time. It can be referenced with the <strong>$execution.resumeUrl</strong> variable. Send it somewhere before getting to this node. <a href=\"https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.wait\" target=\"_blank\">More info</a>",
    "name": "webhookNotice",
    "type": "notice",
    "displayOptions": {
      "show": {
        "resume": [
          "webhook"
        ]
      }
    },
    "default": ""
  },
  {
    "displayName": "HTTP Method",
    "name": "httpMethod",
    "type": "options",
    "displayOptions": {
      "show": {
        "resume": [
          "webhook"
        ]
      }
    },
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
    "description": "The HTTP method of the Webhook call"
  },
  {
    "displayName": "Response Code",
    "name": "responseCode",
    "type": "number",
    "displayOptions": {
      "show": {
        "resume": [
          "webhook"
        ]
      }
    },
    "typeOptions": {
      "minValue": 100,
      "maxValue": 599
    },
    "default": 200,
    "description": "The HTTP Response code to return"
  },
  {
    "displayName": "Respond",
    "name": "responseMode",
    "type": "options",
    "displayOptions": {
      "show": {
        "resume": [
          "webhook"
        ]
      }
    },
    "options": [
      {
        "name": "Immediately",
        "value": "onReceived",
        "description": "As soon as this node executes"
      },
      {
        "name": "When Last Node Finishes",
        "value": "lastNode",
        "description": "Returns data of the last-executed node"
      },
      {
        "name": "Using 'Respond to Webhook' Node",
        "value": "responseNode",
        "description": "Response defined in that node"
      }
    ],
    "default": "onReceived",
    "description": "When and how to respond to the webhook"
  },
  {
    "displayName": "Response Data",
    "name": "responseData",
    "type": "options",
    "displayOptions": {
      "show": {
        "resume": [
          "webhook"
        ],
        "responseMode": [
          "lastNode"
        ]
      }
    },
    "options": [
      {
        "name": "All Entries",
        "value": "allEntries",
        "description": "Returns all the entries of the last node. Always returns an array."
      },
      {
        "name": "First Entry JSON",
        "value": "firstEntryJson",
        "description": "Returns the JSON data of the first entry of the last node. Always returns a JSON object."
      },
      {
        "name": "First Entry Binary",
        "value": "firstEntryBinary",
        "description": "Returns the binary data of the first entry of the last node. Always returns a binary file."
      }
    ],
    "default": "firstEntryJson",
    "description": "What data should be returned. If it should return all the items as array or only the first item as object."
  },
  {
    "displayName": "Property Name",
    "name": "responseBinaryPropertyName",
    "type": "string",
    "required": true,
    "default": "data",
    "displayOptions": {
      "show": {
        "resume": [
          "webhook"
        ],
        "responseData": [
          "firstEntryBinary"
        ]
      }
    },
    "description": "Name of the binary property to return"
  },
  {
    "displayName": "Limit Wait Time",
    "name": "limitWaitTime",
    "type": "boolean",
    "default": false,
    "description": "If no webhook call is received, the workflow will automatically resume execution after the specified limit type",
    "displayOptions": {
      "show": {
        "resume": [
          "webhook"
        ]
      }
    }
  },
  {
    "displayName": "Limit Type",
    "name": "limitType",
    "type": "options",
    "default": "afterTimeInterval",
    "description": "Sets the condition for the execution to resume. Can be a specified date or after some time.",
    "displayOptions": {
      "show": {
        "limitWaitTime": [
          true
        ],
        "resume": [
          "webhook"
        ]
      }
    },
    "options": [
      {
        "name": "After Time Interval",
        "description": "Waits for a certain amount of time",
        "value": "afterTimeInterval"
      },
      {
        "name": "At Specified Time",
        "description": "Waits until the set date and time to continue",
        "value": "atSpecifiedTime"
      }
    ]
  },
  {
    "displayName": "Amount",
    "name": "resumeAmount",
    "type": "number",
    "displayOptions": {
      "show": {
        "limitType": [
          "afterTimeInterval"
        ],
        "limitWaitTime": [
          true
        ],
        "resume": [
          "webhook"
        ]
      }
    },
    "typeOptions": {
      "minValue": 0,
      "numberPrecision": 2
    },
    "default": 1,
    "description": "The time to wait"
  },
  {
    "displayName": "Unit",
    "name": "resumeUnit",
    "type": "options",
    "displayOptions": {
      "show": {
        "limitType": [
          "afterTimeInterval"
        ],
        "limitWaitTime": [
          true
        ],
        "resume": [
          "webhook"
        ]
      }
    },
    "options": [
      {
        "name": "Seconds",
        "value": "seconds"
      },
      {
        "name": "Minutes",
        "value": "minutes"
      },
      {
        "name": "Hours",
        "value": "hours"
      },
      {
        "name": "Days",
        "value": "days"
      }
    ],
    "default": "hours",
    "description": "Unit of the interval value"
  },
  {
    "displayName": "Max Date and Time",
    "name": "maxDateAndTime",
    "type": "dateTime",
    "displayOptions": {
      "show": {
        "limitType": [
          "atSpecifiedTime"
        ],
        "limitWaitTime": [
          true
        ],
        "resume": [
          "webhook"
        ]
      }
    },
    "default": "",
    "description": "Continue execution after the specified date and time"
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "displayOptions": {
      "show": {
        "resume": [
          "webhook"
        ]
      }
    },
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Binary Data",
        "name": "binaryData",
        "type": "boolean",
        "displayOptions": {
          "show": {
            "/httpMethod": [
              "PATCH",
              "PUT",
              "POST"
            ]
          }
        },
        "default": false,
        "description": "Whether the webhook will receive binary data"
      },
      {
        "displayName": "Binary Property",
        "name": "binaryPropertyName",
        "type": "string",
        "default": "data",
        "displayOptions": {
          "show": {
            "binaryData": [
              true
            ]
          }
        },
        "description": "Name of the binary property to which to write the data of the received file. If the data gets received via \"Form-Data Multipart\" it will be the prefix and a number starting with 0 will be attached to it."
      },
      {
        "displayName": "Ignore Bots",
        "name": "ignoreBots",
        "type": "boolean",
        "default": false,
        "description": "Whether to ignore requests from bots like link previewers and web crawlers"
      },
      {
        "displayName": "Response Data",
        "name": "responseData",
        "type": "string",
        "displayOptions": {
          "show": {
            "/responseMode": [
              "onReceived"
            ]
          }
        },
        "default": "",
        "placeholder": "success",
        "description": "Custom response data to send"
      },
      {
        "displayName": "Response Content-Type",
        "name": "responseContentType",
        "type": "string",
        "displayOptions": {
          "show": {
            "/responseData": [
              "firstEntryJson"
            ],
            "/responseMode": [
              "lastNode"
            ]
          }
        },
        "default": "",
        "placeholder": "application/xml",
        "description": "Set a custom content-type to return if another one as the \"application/json\" should be returned"
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
      },
      {
        "displayName": "Property Name",
        "name": "responsePropertyName",
        "type": "string",
        "displayOptions": {
          "show": {
            "/responseData": [
              "firstEntryJson"
            ],
            "/responseMode": [
              "lastNode"
            ]
          }
        },
        "default": "data",
        "description": "Name of the property to return the data of instead of the whole JSON"
      },
      {
        "displayName": "Webhook Suffix",
        "name": "webhookSuffix",
        "type": "string",
        "default": "",
        "placeholder": "webhook",
        "description": "This suffix path will be appended to the restart URL. Helpful when using multiple wait nodes. Note: Does not support expressions."
      }
    ]
  }
];
