// Auto-generated from n8n node: FacebookLeadAdsTrigger
// Source: [n8n]/FacebookLeadAds/FacebookLeadAdsTrigger.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const facebookLeadAdsTriggerNode: AzmethNodeDefinition = {
  "displayName": "Facebook Lead Ads Trigger",
  "name": "facebookLeadAdsTrigger",
  "icon": "facebook",
  "group": "trigger",
  "version": 1,
  "description": "Handle Facebook Lead Ads events via webhooks",
  "defaults": {
    "name": "Facebook Lead Ads Trigger"
  },
  "credentials": [
    {
      "name": "facebookLeadAdsOAuth2Api",
      "required": true
    }
  ],
  "properties": [
    {
      "displayName": "Due to Facebook API limitations, you can use just one Facebook Lead Ads trigger for each Facebook App",
      "name": "facebookLeadAdsNotice",
      "type": "notice",
      "originalType": "notice",
      "default": ""
    },
    {
      "displayName": "Event",
      "name": "event",
      "type": "options",
      "originalType": "options",
      "default": "newLead",
      "required": true,
      "options": [
        {
          "name": "New Lead",
          "value": "newLead"
        }
      ]
    },
    {
      "displayName": "Page",
      "name": "page",
      "type": "resourceLocator",
      "originalType": "resourceLocator",
      "default": {
        "mode": "list",
        "value": ""
      },
      "required": true,
      "description": "The page linked to the form for retrieving new leads"
    },
    {
      "displayName": "Form",
      "name": "form",
      "type": "resourceLocator",
      "originalType": "resourceLocator",
      "default": {
        "mode": "list",
        "value": ""
      },
      "required": true,
      "description": "The form to monitor for fetching lead details upon submission"
    },
    {
      "displayName": "Options",
      "name": "options",
      "type": "collection",
      "originalType": "collection",
      "default": {},
      "placeholder": "Add option",
      "options": [
        {
          "name": "simplifyOutput",
          "description": "Whether to return a simplified version of the webhook event instead of all fields"
        }
      ]
    }
  ],
  };
