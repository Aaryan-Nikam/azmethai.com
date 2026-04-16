/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Compression/Compression.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const CompressionProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Compress",
        "value": "compress"
      },
      {
        "name": "Decompress",
        "value": "decompress"
      }
    ],
    "default": "decompress"
  },
  {
    "displayName": "Binary Property",
    "name": "binaryPropertyName",
    "type": "string",
    "default": "data",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "compress",
          "decompress"
        ]
      }
    },
    "placeholder": "",
    "description": "Name of the binary property which contains the data for the file(s) to be compress/decompress. Multiple can be used separated by a comma (,)."
  },
  {
    "displayName": "Output Format",
    "name": "outputFormat",
    "type": "options",
    "default": "",
    "options": [
      {
        "name": "Gzip",
        "value": "gzip"
      },
      {
        "name": "Zip",
        "value": "zip"
      }
    ],
    "displayOptions": {
      "show": {
        "operation": [
          "compress"
        ]
      }
    },
    "description": "Format of the output file"
  },
  {
    "displayName": "File Name",
    "name": "fileName",
    "type": "string",
    "default": "",
    "placeholder": "data.zip",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "compress"
        ],
        "outputFormat": [
          "zip"
        ]
      }
    },
    "description": "Name of the file to be compressed"
  },
  {
    "displayName": "Binary Property Output",
    "name": "binaryPropertyOutput",
    "type": "string",
    "default": "data",
    "displayOptions": {
      "show": {
        "outputFormat": [
          "zip"
        ],
        "operation": [
          "compress"
        ]
      }
    },
    "placeholder": "",
    "description": "Name of the binary property to which to write the data of the compressed files"
  },
  {
    "displayName": "Output Prefix",
    "name": "outputPrefix",
    "type": "string",
    "default": "data",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "compress"
        ],
        "outputFormat": [
          "gzip"
        ]
      }
    },
    "description": "Prefix use for all gzip compressed files"
  },
  {
    "displayName": "Output Prefix",
    "name": "outputPrefix",
    "type": "string",
    "default": "file_",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "decompress"
        ]
      }
    },
    "description": "Prefix use for all decompressed files"
  }
];
