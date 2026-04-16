/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Copper/CopperTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const CopperTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "required": true,
    "default": "",
    "options": [
      {
        "name": "Company",
        "value": "company"
      },
      {
        "name": "Lead",
        "value": "lead"
      },
      {
        "name": "Opportunity",
        "value": "opportunity"
      },
      {
        "name": "Person",
        "value": "person"
      },
      {
        "name": "Project",
        "value": "project"
      },
      {
        "name": "Task",
        "value": "task"
      }
    ],
    "description": "The resource which will fire the event"
  },
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "required": true,
    "default": "",
    "options": [
      {
        "name": "Delete",
        "value": "delete",
        "description": "An existing record is removed"
      },
      {
        "name": "New",
        "value": "new",
        "description": "A new record is created"
      },
      {
        "name": "Update",
        "value": "update",
        "description": "Any field in the existing entity record is changed"
      }
    ],
    "description": "The event to listen to"
  }
];
