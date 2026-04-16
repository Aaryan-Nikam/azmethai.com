/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Msg91/Msg91.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const Msg91Properties: AzmethNodeProperty[] = [
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "SMS",
        "value": "sms"
      }
    ],
    "default": "sms"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "sms"
        ]
      }
    },
    "options": [
      {
        "name": "Send",
        "value": "send",
        "description": "Send SMS",
        "action": "Send an SMS"
      }
    ],
    "default": "send"
  },
  {
    "displayName": "Sender ID",
    "name": "from",
    "type": "string",
    "default": "",
    "placeholder": "4155238886",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "resource": [
          "sms"
        ]
      }
    },
    "description": "The number from which to send the message"
  },
  {
    "displayName": "To",
    "name": "to",
    "type": "string",
    "default": "",
    "placeholder": "+14155238886",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "resource": [
          "sms"
        ]
      }
    },
    "description": "The number, with coutry code, to which to send the message"
  },
  {
    "displayName": "Message",
    "name": "message",
    "type": "string",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "resource": [
          "sms"
        ]
      }
    },
    "description": "The message to send"
  }
];
