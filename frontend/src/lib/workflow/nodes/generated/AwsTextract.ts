/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Aws/Textract/AwsTextract.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const AwsTextractProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Analyze Receipt or Invoice",
        "value": "analyzeExpense"
      }
    ],
    "default": "analyzeExpense"
  },
  {
    "displayName": "Input Data Field Name",
    "name": "binaryPropertyName",
    "type": "string",
    "default": "data",
    "displayOptions": {
      "show": {
        "operation": [
          "analyzeExpense"
        ]
      }
    },
    "required": true,
    "description": "The name of the input field containing the binary file data to be uploaded. Supported file types: PNG, JPEG."
  },
  {
    "displayName": "Simplify",
    "name": "simple",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "operation": [
          "analyzeExpense"
        ]
      }
    },
    "default": true,
    "description": "Whether to return a simplified version of the response instead of the raw data"
  }
];
