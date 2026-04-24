/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Aws/AwsSnsTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const AwsSnsTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Topic",
    "name": "topic",
    "type": "resourceLocator",
    "default": {
      "mode": "list",
      "value": ""
    },
    "required": true,
    "modes": [
      {
        "displayName": "From List",
        "name": "list",
        "type": "list",
        "placeholder": "Select a topic...",
        "typeOptions": {
          "searchListMethod": "listTopics",
          "searchable": true
        }
      },
      {
        "displayName": "By URL",
        "name": "url",
        "type": "string",
        "placeholder": "https://us-east-1.console.aws.amazon.com/sns/v3/home?region=us-east-1#/topic/arn:aws:sns:us-east-1:777777777777:your_topic",
        "validation": [
          {
            "type": "regex",
            "properties": {
              "regex": "https:\\/\\/[0-9a-zA-Z\\-_]+\\.console\\.aws\\.amazon\\.com\\/sns\\/v3\\/home\\?region\\=[0-9a-zA-Z\\-_]+\\#\\/topic\\/arn:aws:sns:[0-9a-zA-Z\\-_]+:[0-9]+:[0-9a-zA-Z\\-_]+(?:\\/.*|)",
              "errorMessage": "Not a valid AWS SNS Topic URL"
            }
          }
        ],
        "extractValue": {
          "type": "regex",
          "regex": "https:\\/\\/[0-9a-zA-Z\\-_]+\\.console\\.aws\\.amazon\\.com\\/sns\\/v3\\/home\\?region\\=[0-9a-zA-Z\\-_]+\\#\\/topic\\/(arn:aws:sns:[0-9a-zA-Z\\-_]+:[0-9]+:[0-9a-zA-Z\\-_]+)(?:\\/.*|)"
        }
      },
      {
        "displayName": "ID",
        "name": "id",
        "type": "string",
        "validation": [
          {
            "type": "regex",
            "properties": {
              "regex": "arn:aws:sns:[0-9a-zA-Z\\-_]+:[0-9]+:[0-9a-zA-Z\\-_]+",
              "errorMessage": "Not a valid AWS SNS Topic ARN"
            }
          }
        ],
        "placeholder": "arn:aws:sns:your-aws-region:777777777777:your_topic"
      }
    ]
  }
];
