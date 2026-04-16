/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/ConvertKit/ConvertKitTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const ConvertKitTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "required": true,
    "default": "",
    "description": "The events that can trigger the webhook and whether they are enabled",
    "options": [
      {
        "name": "Form Subscribe",
        "value": "formSubscribe"
      },
      {
        "name": "Link Click",
        "value": "linkClick"
      },
      {
        "name": "Product Purchase",
        "value": "productPurchase"
      },
      {
        "name": "Purchase Created",
        "value": "purchaseCreate"
      },
      {
        "name": "Sequence Complete",
        "value": "courseComplete"
      },
      {
        "name": "Sequence Subscribe",
        "value": "courseSubscribe"
      },
      {
        "name": "Subscriber Activated",
        "value": "subscriberActivate"
      },
      {
        "name": "Subscriber Unsubscribe",
        "value": "subscriberUnsubscribe"
      },
      {
        "name": "Tag Add",
        "value": "tagAdd"
      },
      {
        "name": "Tag Remove",
        "value": "tagRemove"
      }
    ]
  },
  {
    "displayName": "Form Name or ID",
    "name": "formId",
    "type": "options",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>",
    "typeOptions": {
      "loadOptionsMethod": "getForms"
    },
    "required": true,
    "default": "",
    "displayOptions": {
      "show": {
        "event": [
          "formSubscribe"
        ]
      }
    }
  },
  {
    "displayName": "Sequence Name or ID",
    "name": "courseId",
    "type": "options",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>",
    "typeOptions": {
      "loadOptionsMethod": "getSequences"
    },
    "required": true,
    "default": "",
    "displayOptions": {
      "show": {
        "event": [
          "courseSubscribe",
          "courseComplete"
        ]
      }
    }
  },
  {
    "displayName": "Initiating Link",
    "name": "link",
    "type": "string",
    "required": true,
    "default": "",
    "description": "The URL of the initiating link",
    "displayOptions": {
      "show": {
        "event": [
          "linkClick"
        ]
      }
    }
  },
  {
    "displayName": "Product ID",
    "name": "productId",
    "type": "string",
    "required": true,
    "default": "",
    "displayOptions": {
      "show": {
        "event": [
          "productPurchase"
        ]
      }
    }
  },
  {
    "displayName": "Tag Name or ID",
    "name": "tagId",
    "type": "options",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>",
    "typeOptions": {
      "loadOptionsMethod": "getTags"
    },
    "required": true,
    "default": "",
    "displayOptions": {
      "show": {
        "event": [
          "tagAdd",
          "tagRemove"
        ]
      }
    }
  }
];
