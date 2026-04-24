/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Autopilot/AutopilotTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const AutopilotTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "required": true,
    "default": "",
    "options": [
      {
        "name": "Contact Added",
        "value": "contactAdded"
      },
      {
        "name": "Contact Added To List",
        "value": "contactAddedToList"
      },
      {
        "name": "Contact Entered Segment",
        "value": "contactEnteredSegment"
      },
      {
        "name": "Contact Left Segment",
        "value": "contactLeftSegment"
      },
      {
        "name": "Contact Removed From List",
        "value": "contactRemovedFromList"
      },
      {
        "name": "Contact Unsubscribed",
        "value": "contactUnsubscribed"
      },
      {
        "name": "Contact Updated",
        "value": "contactUpdated"
      }
    ]
  }
];
