/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Pipedrive/PipedriveTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const PipedriveTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Authentication",
    "name": "authentication",
    "type": "options",
    "options": [
      {
        "name": "API Token",
        "value": "apiToken"
      },
      {
        "name": "OAuth2",
        "value": "oAuth2"
      }
    ],
    "default": "apiToken"
  },
  {
    "displayName": "Incoming Authentication",
    "name": "incomingAuthentication",
    "type": "options",
    "options": [
      {
        "name": "Basic Auth",
        "value": "basicAuth"
      },
      {
        "name": "None",
        "value": "none"
      }
    ],
    "default": "none",
    "description": "If authentication should be activated for the webhook (makes it more secure)"
  },
  {
    "displayName": "Action",
    "name": "action",
    "type": "options",
    "options": [
      {
        "name": "Added",
        "value": "added",
        "description": "Data got added",
        "action": "Data was added"
      },
      {
        "name": "All",
        "value": "*",
        "description": "Any change",
        "action": "Any change"
      },
      {
        "name": "Deleted",
        "value": "deleted",
        "description": "Data got deleted",
        "action": "Data was deleted"
      },
      {
        "name": "Merged",
        "value": "merged",
        "description": "Data got merged",
        "action": "Data was merged"
      },
      {
        "name": "Updated",
        "value": "updated",
        "description": "Data got updated",
        "action": "Data was updated"
      }
    ],
    "default": "*",
    "description": "Type of action to receive notifications about"
  },
  {
    "displayName": "Object",
    "name": "object",
    "type": "options",
    "options": [
      {
        "name": "Activity",
        "value": "activity"
      },
      {
        "name": "Activity Type",
        "value": "activityType"
      },
      {
        "name": "All",
        "value": "*"
      },
      {
        "name": "Deal",
        "value": "deal"
      },
      {
        "name": "Note",
        "value": "note"
      },
      {
        "name": "Organization",
        "value": "organization"
      },
      {
        "name": "Person",
        "value": "person"
      },
      {
        "name": "Pipeline",
        "value": "pipeline"
      },
      {
        "name": "Product",
        "value": "product"
      },
      {
        "name": "Stage",
        "value": "stage"
      },
      {
        "name": "User",
        "value": "user"
      }
    ],
    "default": "*",
    "description": "Type of object to receive notifications about"
  }
];
