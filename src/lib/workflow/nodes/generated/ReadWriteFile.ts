// Auto-generated from n8n node: ReadWriteFile
// Source: [n8n]/Files/ReadWriteFile/ReadWriteFile.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const readWriteFileNode: AzmethNodeDefinition = {
  "displayName": "Read/Write Files from Disk",
  "name": "readWriteFile",
  "icon": "readWriteFile",
  "group": "input",
  "version": [
    1,
    1.1
  ],
  "description": "Read or write files from the computer that runs n8n",
  "defaults": {
    "name": "Read/Write Files from Disk"
  },
  "credentials": [],
  "properties": [
    {
      "displayName": "Use this node to read and write files on the same computer running n8n. To handle files between different computers please use other nodes (e.g. FTP, HTTP Request, AWS).",
      "name": "info",
      "type": "notice",
      "originalType": "notice",
      "default": ""
    },
    {
      "displayName": "Operation",
      "name": "operation",
      "type": "options",
      "originalType": "options",
      "default": "read",
      "options": [
        {
          "name": "Read File(s) From Disk",
          "value": "read",
          "description": "Retrieve one or more files from the computer that runs n8n"
        },
        {
          "name": "Write File to Disk",
          "value": "write",
          "description": "Create a binary file on the computer that runs n8n"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
