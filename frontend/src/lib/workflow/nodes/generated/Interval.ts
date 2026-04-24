/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Interval/Interval.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const IntervalProperties: AzmethNodeProperty[] = [
  {
    "displayName": "This workflow will run on the schedule you define here once you <a data-key=\"activate\">activate</a> it.<br><br>For testing, you can also trigger it manually: by going back to the canvas and clicking ‘execute workflow’",
    "name": "notice",
    "type": "notice",
    "default": ""
  },
  {
    "displayName": "Interval",
    "name": "interval",
    "type": "number",
    "typeOptions": {
      "minValue": 1
    },
    "default": 1,
    "description": "Interval value"
  },
  {
    "displayName": "Unit",
    "name": "unit",
    "type": "options",
    "options": [
      {
        "name": "Seconds",
        "value": "seconds"
      },
      {
        "name": "Minutes",
        "value": "minutes"
      },
      {
        "name": "Hours",
        "value": "hours"
      }
    ],
    "default": "seconds",
    "description": "Unit of the interval value"
  }
];
