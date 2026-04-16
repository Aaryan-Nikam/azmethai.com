/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/N8nTrainingCustomerDatastore/N8nTrainingCustomerDatastore.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const N8nTrainingCustomerDatastoreProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Get One Person",
        "value": "getOnePerson"
      },
      {
        "name": "Get All People",
        "value": "getAllPeople"
      }
    ],
    "default": "getOnePerson"
  },
  {
    "displayName": "Return All",
    "name": "returnAll",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "operation": [
          "getAllPeople"
        ]
      }
    },
    "default": false,
    "description": "Whether to return all results or only up to a given limit"
  },
  {
    "displayName": "Limit",
    "name": "limit",
    "type": "number",
    "displayOptions": {
      "show": {
        "operation": [
          "getAllPeople"
        ],
        "returnAll": [
          false
        ]
      }
    },
    "typeOptions": {
      "minValue": 1,
      "maxValue": 10
    },
    "default": 5,
    "description": "Max number of results to return"
  }
];
