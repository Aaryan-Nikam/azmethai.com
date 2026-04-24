/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/ReadBinaryFiles/ReadBinaryFiles.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const ReadBinaryFilesProperties: AzmethNodeProperty[] = [
  {
    "displayName": "File Selector",
    "name": "fileSelector",
    "type": "string",
    "default": "",
    "required": true,
    "placeholder": "*.jpg",
    "description": "Pattern for files to read"
  },
  {
    "displayName": "Property Name",
    "name": "dataPropertyName",
    "type": "string",
    "default": "data",
    "required": true,
    "description": "Name of the binary property to which to write the data of the read files"
  }
];
