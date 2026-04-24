/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Dhl/Dhl.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const DhlProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Resource",
    "name": "resource",
    "noDataExpression": true,
    "type": "hidden",
    "options": [
      {
        "name": "Shipment",
        "value": "shipment"
      }
    ],
    "default": "shipment"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "shipment"
        ]
      }
    },
    "options": [
      {
        "name": "Get Tracking Details",
        "value": "get",
        "action": "Get tracking details for a shipment"
      }
    ],
    "default": "get"
  },
  {
    "displayName": "Tracking Number",
    "name": "trackingNumber",
    "type": "string",
    "required": true,
    "default": ""
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Recipient's Postal Code",
        "name": "recipientPostalCode",
        "type": "string",
        "default": "",
        "description": "DHL will return more detailed information on the shipment when you provide the Recipient's Postal Code - it acts as a verification step"
      }
    ]
  }
];
