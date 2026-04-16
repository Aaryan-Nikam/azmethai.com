/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/InvoiceNinja/InvoiceNinjaTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const InvoiceNinjaTriggerProperties: AzmethNodeProperty[] = [
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
        "name": "Version 4",
        "value": "v4"
      },
      {
        "name": "Version 5",
        "value": "v5"
      }
    ],
    "default": "v4"
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
        "name": "Version 4",
        "value": "v4"
      },
      {
        "name": "Version 5",
        "value": "v5"
      }
    ],
    "default": "v5"
  },
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "options": [
      {
        "name": "Client Created",
        "value": "create_client"
      },
      {
        "name": "Invoice Created",
        "value": "create_invoice"
      },
      {
        "name": "Payment Created",
        "value": "create_payment"
      },
      {
        "name": "Quote Created",
        "value": "create_quote"
      },
      {
        "name": "Vendor Created",
        "value": "create_vendor"
      }
    ],
    "default": "",
    "required": true
  }
];
