/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Notion/NotionTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const NotionTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "options": [
      {
        "name": "Page Added to Database",
        "value": "pageAddedToDatabase"
      },
      {
        "name": "Page Updated in Database",
        "value": "pagedUpdatedInDatabase"
      }
    ],
    "required": true,
    "default": "pageAddedToDatabase"
  },
  {
    "displayName": "In Notion, make sure to <a href=\"https://www.notion.so/help/add-and-manage-connections-with-the-api\" target=\"_blank\">add your connection</a> to the pages you want to access.",
    "name": "notionNotice",
    "type": "notice",
    "default": ""
  },
  {
    "displayName": "Database",
    "name": "databaseId",
    "type": "resourceLocator",
    "default": {
      "mode": "list",
      "value": ""
    },
    "required": true,
    "modes": [
      {
        "displayName": "Database",
        "name": "list",
        "type": "list",
        "placeholder": "Select a Database...",
        "typeOptions": {
          "searchListMethod": "getDatabases",
          "searchable": true
        }
      },
      {
        "displayName": "Link",
        "name": "url",
        "type": "string",
        "placeholder": "https://www.notion.so/0fe2f7de558b471eab07e9d871cdf4a9?v=f2d424ba0c404733a3f500c78c881610",
        "validation": [
          {
            "type": "regex",
            "properties": {
              "regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}).*",
              "errorMessage": "Not a valid Notion Database URL"
            }
          }
        ],
        "extractValue": {
          "type": "regex",
          "regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})"
        }
      },
      {
        "displayName": "ID",
        "name": "id",
        "type": "string",
        "placeholder": "ab1545b247fb49fa92d6f4b49f4d8116",
        "validation": [
          {
            "type": "regex",
            "properties": {
              "regex": "^(([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})|([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))[ \t]*",
              "errorMessage": "Not a valid Notion Database ID"
            }
          }
        ],
        "extractValue": {
          "type": "regex",
          "regex": "^([0-9a-f]{8}-?[0-9a-f]{4}-?4[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12})"
        },
        "url": "=https://www.notion.so/{{$value.replace(/-/g, \"\")}}"
      }
    ],
    "displayOptions": {
      "show": {
        "event": [
          "pageAddedToDatabase",
          "pagedUpdatedInDatabase"
        ]
      }
    },
    "description": "The Notion Database to operate on"
  },
  {
    "displayName": "Simplify",
    "name": "simple",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "event": [
          "pageAddedToDatabase",
          "pagedUpdatedInDatabase"
        ]
      }
    },
    "default": true,
    "description": "Whether to return a simplified version of the response instead of the raw data"
  }
];
