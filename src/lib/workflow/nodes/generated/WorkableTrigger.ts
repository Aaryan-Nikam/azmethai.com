/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Workable/WorkableTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const WorkableTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Trigger On",
    "name": "triggerOn",
    "type": "options",
    "options": [
      {
        "name": "Candidate Created",
        "value": "candidateCreated"
      },
      {
        "name": "Candidate Moved",
        "value": "candidateMoved"
      }
    ],
    "default": "",
    "required": true
  },
  {
    "displayName": "Filters",
    "name": "filters",
    "type": "collection",
    "placeholder": "Add Filter",
    "default": {},
    "options": [
      {
        "displayName": "Job Name or ID",
        "name": "job",
        "type": "options",
        "typeOptions": {
          "loadOptionsMethod": "getJobs"
        },
        "default": "",
        "description": "Get notifications only for one job. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
      },
      {
        "displayName": "Stage Name or ID",
        "name": "stage",
        "type": "options",
        "typeOptions": {
          "loadOptionsMethod": "getStages"
        },
        "default": "",
        "description": "Get notifications for specific stages. e.g. 'hired'. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code-examples/expressions/\">expression</a>."
      }
    ]
  }
];
