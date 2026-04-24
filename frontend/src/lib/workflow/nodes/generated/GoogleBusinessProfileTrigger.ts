// Auto-generated from n8n node: GoogleBusinessProfileTrigger
// Source: [n8n]/Google/BusinessProfile/GoogleBusinessProfileTrigger.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const googleBusinessProfileTriggerNode: AzmethNodeDefinition = {
  "displayName": "Google Business Profile Trigger",
  "name": "googleBusinessProfileTrigger",
  "icon": "googleBusinessProfile",
  "group": "trigger",
  "version": 1,
  "description": "Fetches reviews from Google Business Profile and starts the workflow on specified polling intervals.",
  "defaults": {
    "name": "Google Business Profile Trigger"
  },
  "credentials": [
    {
      "name": "googleBusinessProfileOAuth2Api",
      "required": true
    }
  ],
  "properties": [
    {
      "displayName": "Event",
      "name": "event",
      "type": "options",
      "originalType": "options",
      "default": "reviewAdded",
      "required": true,
      "options": [
        {
          "name": "Review Added",
          "value": "reviewAdded"
        }
      ],
      "noDataExpression": true
    },
    {
      "displayName": "Account",
      "name": "account",
      "type": "resourceLocator",
      "originalType": "resourceLocator",
      "default": {
        "mode": "list",
        "value": ""
      },
      "required": true,
      "description": "The Google Business Profile account",
      "displayOptions": {
        "show": {
          "event": [
            "reviewAdded"
          ]
        }
      }
    },
    {
      "displayName": "Location",
      "name": "location",
      "type": "resourceLocator",
      "originalType": "resourceLocator",
      "default": {
        "mode": "list",
        "value": ""
      },
      "required": true,
      "description": "The specific location or business associated with the account",
      "displayOptions": {
        "show": {
          "event": [
            "reviewAdded"
          ]
        }
      }
    }
  ],
  };
