/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Wise/WiseTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const WiseTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Profile Name or ID",
    "name": "profileId",
    "type": "options",
    "description": "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>",
    "required": true,
    "typeOptions": {
      "loadOptionsMethod": "getProfiles"
    },
    "default": ""
  },
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "required": true,
    "default": "",
    "options": [
      {
        "name": "Balance Credit",
        "value": "balanceCredit",
        "description": "Triggered every time a balance account is credited"
      },
      {
        "name": "Transfer Active Case",
        "value": "transferActiveCases",
        "description": "Triggered every time a transfer's list of active cases is updated"
      },
      {
        "name": "Transfer State Changed",
        "value": "tranferStateChange",
        "description": "Triggered every time a transfer's status is updated"
      }
    ]
  }
];
