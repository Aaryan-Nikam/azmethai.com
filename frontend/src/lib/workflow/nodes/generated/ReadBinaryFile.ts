/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/ReadBinaryFile/ReadBinaryFile.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const ReadBinaryFileProperties: AzmethNodeProperty[] = [
  {
    "displayName": "File Path",
    "name": "filePath",
    "type": "string",
    "default": "",
    "required": true,
    "placeholder": "/data/example.jpg",
    "description": "Path of the file to read"
  },
  {
    "displayName": "Property Name",
    "name": "dataPropertyName",
    "type": "string",
    "default": "data",
    "required": true,
    "description": "Name of the binary property to which to write the data of the read file"
  }
];
