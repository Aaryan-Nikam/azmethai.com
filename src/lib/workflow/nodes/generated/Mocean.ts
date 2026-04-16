/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Mocean/Mocean.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const MoceanProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "SMS",
        "value": "sms"
      },
      {
        "name": "Voice",
        "value": "voice"
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
          "sms",
          "voice"
        ]
      }
    },
    "options": [
      {
        "name": "Send",
        "value": "send",
        "description": "Send SMS/Voice message",
        "action": "Send an SMS"
      }
    ],
    "default": "send"
  },
  {
    "displayName": "From",
    "name": "from",
    "type": "string",
    "default": "",
    "placeholder": "Sender Number",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "resource": [
          "sms",
          "voice"
        ]
      }
    },
    "description": "Number to which to send the message"
  },
  {
    "displayName": "To",
    "name": "to",
    "type": "string",
    "default": "",
    "placeholder": "Receipient number",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "resource": [
          "sms",
          "voice"
        ]
      }
    },
    "description": "Number from which to send the message"
  },
  {
    "displayName": "Language",
    "name": "language",
    "type": "options",
    "options": [
      {
        "name": "Chinese Mandarin (China)",
        "value": "cmn-CN"
      },
      {
        "name": "English (United Kingdom)",
        "value": "en-GB"
      },
      {
        "name": "English (United States)",
        "value": "en-US"
      },
      {
        "name": "Japanese (Japan)",
        "value": "ja-JP"
      },
      {
        "name": "Korean (Korea)",
        "value": "ko-KR"
      }
    ],
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "resource": [
          "voice"
        ]
      }
    },
    "default": "en-US"
  },
  {
    "displayName": "Message",
    "name": "message",
    "type": "string",
    "default": "",
    "placeholder": "",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "resource": [
          "sms",
          "voice"
        ]
      }
    },
    "description": "Message to send"
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Field",
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
    "default": {},
    "options": [
      {
        "displayName": "Delivery Report URL",
        "name": "dlrUrl",
        "type": "string",
        "default": "",
        "placeholder": ""
      }
    ]
  }
];
