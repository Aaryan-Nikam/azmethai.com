/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Google/Firebase/RealtimeDatabase/GoogleFirebaseRealtimeDatabase.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const GoogleFirebaseRealtimeDatabaseProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Project Name or ID",
    "name": "projectId",
    "type": "options",
    "default": "",
    "typeOptions": {
      "loadOptionsMethod": "getProjects"
    },
    "description": "As displayed in firebase console URL. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>.",
    "required": true
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Create",
        "value": "create",
        "description": "Write data to a database",
        "action": "Write data to a database"
      },
      {
        "name": "Delete",
        "value": "delete",
        "description": "Delete data from a database",
        "action": "Delete data from a database"
      },
      {
        "name": "Get",
        "value": "get",
        "description": "Get a record from a database",
        "action": "Get a record from a database"
      },
      {
        "name": "Push",
        "value": "push",
        "description": "Append to a list of data",
        "action": "Append to a list of data"
      },
      {
        "name": "Update",
        "value": "update",
        "description": "Update item on a database",
        "action": "Update item in a database"
      }
    ],
    "default": "create",
    "required": true
  },
  {
    "displayName": "Object Path",
    "name": "path",
    "type": "string",
    "default": "",
    "placeholder": "e.g. /app/users",
    "description": "Object path on database. Do not append .json.",
    "required": true,
    "displayOptions": {
      "hide": {
        "operation": [
          "get"
        ]
      }
    }
  },
  {
    "displayName": "Object Path",
    "name": "path",
    "type": "string",
    "default": "",
    "placeholder": "e.g. /app/users",
    "description": "Object path on database. Do not append .json.",
    "hint": "Leave blank to get a whole database object",
    "displayOptions": {
      "show": {
        "operation": [
          "get"
        ]
      }
    }
  },
  {
    "displayName": "Columns / Attributes",
    "name": "attributes",
    "type": "string",
    "default": "",
    "displayOptions": {
      "show": {
        "operation": [
          "create",
          "push",
          "update"
        ]
      }
    },
    "description": "Attributes to save",
    "required": true,
    "placeholder": "age, name, city"
  }
];
