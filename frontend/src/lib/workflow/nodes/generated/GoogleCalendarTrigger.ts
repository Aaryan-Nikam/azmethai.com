/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Google/Calendar/GoogleCalendarTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const GoogleCalendarTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Calendar",
    "name": "calendarId",
    "type": "resourceLocator",
    "default": {
      "mode": "list",
      "value": ""
    },
    "required": true,
    "description": "Google Calendar to operate on",
    "modes": [
      {
        "displayName": "Calendar",
        "name": "list",
        "type": "list",
        "placeholder": "Select a Calendar...",
        "typeOptions": {
          "searchListMethod": "getCalendars",
          "searchable": true
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
              "regex": "(^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*(?:[ \t]+)*$)",
              "errorMessage": "Not a valid Google Calendar ID"
            }
          }
        ],
        "extractValue": {
          "type": "regex",
          "regex": "(^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*)"
        },
        "placeholder": "name@google.com"
      }
    ]
  },
  {
    "displayName": "Trigger On",
    "name": "triggerOn",
    "type": "options",
    "required": true,
    "default": "",
    "options": [
      {
        "name": "Event Created",
        "value": "eventCreated"
      },
      {
        "name": "Event Ended",
        "value": "eventEnded"
      },
      {
        "name": "Event Started",
        "value": "eventStarted"
      },
      {
        "name": "Event Updated",
        "value": "eventUpdated"
      }
    ]
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Match Term",
        "name": "matchTerm",
        "type": "string",
        "default": "",
        "description": "Free text search terms to filter events that match these terms in any field, except for extended properties"
      }
    ]
  }
];
