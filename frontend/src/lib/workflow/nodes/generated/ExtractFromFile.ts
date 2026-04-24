// Auto-generated from n8n node: ExtractFromFile
// Source: [n8n]/Files/ExtractFromFile/ExtractFromFile.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const extractFromFileNode: AzmethNodeDefinition = {
  "displayName": "Extract from File",
  "name": "extractFromFile",
  "icon": "[object Object]",
  "group": "input",
  "version": [
    1,
    1.1
  ],
  "description": "Convert binary data to JSON",
  "defaults": {
    "name": "Extract from File"
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
          "name": "Extract From CSV",
          "value": "csv",
          "description": "Transform a CSV file into output items"
        },
        {
          "name": "Extract From HTML",
          "value": "html",
          "description": "Transform a table in an HTML file into output items"
        },
        {
          "name": "Extract From ICS",
          "value": "fromIcs",
          "description": "Transform a ICS file into output items"
        },
        {
          "name": "Extract From JSON",
          "value": "fromJson",
          "description": "Transform a JSON file into output items"
        },
        {
          "name": "Extract From ODS",
          "value": "ods",
          "description": "Transform an ODS file into output items"
        },
        {
          "name": "Extract From PDF",
          "value": "pdf",
          "description": "Extracts the content and metadata from a PDF file"
        },
        {
          "name": "Extract From RTF",
          "value": "rtf",
          "description": "Transform a table in an RTF file into output items"
        },
        {
          "name": "Extract From Text File",
          "value": "text",
          "description": "Extracts the content of a text file"
        },
        {
          "name": "Extract From XML",
          "value": "xml",
          "description": "Extracts the content of an XML file"
        },
        {
          "name": "Extract From XLS",
          "value": "xls",
          "description": "Transform an Excel file into output items"
        },
        {
          "name": "Extract From XLSX",
          "value": "xlsx",
          "description": "Transform an Excel file into output items"
        },
        {
          "name": "Move File to Base64 String",
          "value": "binaryToPropery",
          "description": "Convert a file into a base64-encoded string"
        }
      ],
      "noDataExpression": true
    }
  ],
  };
