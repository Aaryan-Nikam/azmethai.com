/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/WriteBinaryFile/WriteBinaryFile.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const WriteBinaryFileProperties: AzmethNodeProperty[] = [
  {
    "displayName": "File Name",
    "name": "fileName",
    "type": "string",
    "default": "",
    "required": true,
    "placeholder": "/data/example.jpg",
    "description": "Path to which the file should be written"
  },
  {
    "displayName": "Property Name",
    "name": "dataPropertyName",
    "type": "string",
    "default": "data",
    "required": true,
    "description": "Name of the binary property which contains the data for the file to be written"
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Append",
        "name": "append",
        "type": "boolean",
        "default": false,
        "description": "Whether to append to an existing file"
      }
    ]
  }
];
