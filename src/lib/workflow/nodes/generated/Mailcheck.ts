/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Mailcheck/Mailcheck.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const MailcheckProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Email",
        "value": "email"
      }
    ],
    "default": "email"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "email"
        ]
      }
    },
    "options": [
      {
        "name": "Check",
        "value": "check",
        "action": "Check an email"
      }
    ],
    "default": "check"
  },
  {
    "displayName": "Email",
    "name": "email",
    "type": "string",
    "placeholder": "name@email.com",
    "displayOptions": {
      "show": {
        "resource": [
          "email"
        ],
        "operation": [
          "check"
        ]
      }
    },
    "default": "",
    "description": "Email address to check"
  }
];
