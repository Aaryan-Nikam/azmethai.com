/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/SplitInBatches/v1/SplitInBatchesV1.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const SplitInBatchesV1Properties: AzmethNodeProperty[] = [
  {
    "displayName": "You may not need this node — n8n nodes automatically run once for each input item. <a href=\"https://docs.n8n.io/getting-started/key-concepts/looping.html#using-loops-in-n8n\" target=\"_blank\">More info</a>",
    "name": "splitInBatchesNotice",
    "type": "notice",
    "default": ""
  },
  {
    "displayName": "Batch Size",
    "name": "batchSize",
    "type": "number",
    "typeOptions": {
      "minValue": 1
    },
    "default": 10,
    "description": "The number of items to return with each call"
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Reset",
        "name": "reset",
        "type": "boolean",
        "default": false,
        "description": "Whether the node will be reset and so with the current input-data newly initialized"
      }
    ]
  }
];
