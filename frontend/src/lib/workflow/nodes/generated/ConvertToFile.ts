// Auto-generated from n8n node: ConvertToFile
// Source: [n8n]/Files/ConvertToFile/ConvertToFile.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const convertToFileNode: AzmethNodeDefinition = {
  "displayName": "Convert to File",
  "name": "convertToFile",
  "icon": "[object Object]",
  "group": "input",
  "version": [
    1,
    1.1
  ],
  "description": "Convert JSON data to binary data",
  "defaults": {
    "name": "Convert to File"
  },
  "credentials": [],
  "properties": [
    {
      "displayName": "Operation",
      "name": "operation",
      "type": "options",
      "originalType": "options",
      "default": "csv",
      "options": [
        {
          "name": "Convert to CSV",
          "value": "csv",
          "description": "Transform input data into a CSV file"
        },
        {
          "name": "Convert to HTML",
          "value": "html",
          "description": "Transform input data into a table in an HTML file"
        },
        {
          "name": "Convert to ICS",
          "value": "iCal",
          "description": "Converts each input item to an ICS event file"
        },
        {
          "name": "Convert to JSON",
          "value": "toJson",
          "description": "Transform input data into a single or multiple JSON files"
        },
        {
          "name": "Convert to ODS",
          "value": "ods",
          "description": "Transform input data into an ODS file"
        },
        {
          "name": "Convert to RTF",
          "value": "rtf",
          "description": "Transform input data into a table in an RTF file"
        },
        {
          "name": "Convert to Text File",
          "value": "toText",
          "description": "Transform input data string into a file"
        },
        {
          "name": "Convert to XLS",
          "value": "xls",
          "description": "Transform input data into an Excel file"
        },
        {
          "name": "Convert to XLSX",
          "value": "xlsx",
          "description": "Transform input data into an Excel file"
        },
        {
          "name": "Move Base64 String to File",
          "value": "toBinary",
          "description": "Convert a base64-encoded string into its original file format"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
