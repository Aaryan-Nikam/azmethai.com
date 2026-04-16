/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Lemlist/LemlistTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const LemlistTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "required": true,
    "default": "",
    "options": [
      {
        "name": "*",
        "value": "*"
      },
      {
        "name": "Emails Bounced",
        "value": "emailsBounced"
      },
      {
        "name": "Emails Clicked",
        "value": "emailsClicked"
      },
      {
        "name": "Emails Failed",
        "value": "emailsFailed"
      },
      {
        "name": "Emails Interested",
        "value": "emailsInterested"
      },
      {
        "name": "Emails Not Interested",
        "value": "emailsNotInterested"
      },
      {
        "name": "Emails Opened",
        "value": "emailsOpened"
      },
      {
        "name": "Emails Replied",
        "value": "emailsReplied"
      },
      {
        "name": "Emails Send Failed",
        "value": "emailsSendFailed"
      },
      {
        "name": "Emails Sent",
        "value": "emailsSent"
      },
      {
        "name": "Emails Unsubscribed",
        "value": "emailsUnsubscribed"
      }
    ]
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Field",
    "default": {},
    "options": [
      {
        "displayName": "Campaing Name or ID",
        "name": "campaignId",
        "type": "options",
        "typeOptions": {
          "loadOptionsMethod": "getCampaigns"
        },
        "default": "",
        "description": "We'll call this hook only for this campaignId. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
      },
      {
        "displayName": "Is First",
        "name": "isFirst",
        "type": "boolean",
        "default": false,
        "description": "Whether to call this hook only the first time this activity happened"
      }
    ]
  }
];
