// Auto-generated from n8n node: SplitOut
// Source: [n8n]/Transform/SplitOut/SplitOut.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const splitOutNode: AzmethNodeDefinition = {
  "displayName": "Split Out",
  "name": "splitOut",
  "icon": "splitOut",
  "group": "transform",
  "version": 1,
  "description": "Turn a list inside item(s) into separate items",
  "defaults": {
    "name": "Split Out"
  },
  "credentials": [],
  "properties": [
    {
      "displayName": "Fields To Split Out",
      "name": "fieldToSplitOut",
      "type": "string",
      "originalType": "string",
      "default": "",
      "required": true,
      "description": "The name of the input fields to break out into separate items. Separate multiple field names by commas. For binary data, use $binary.",
      "placeholder": "Drag fields from the left or type their names",
      "hint": "Use $binary to split out the input item by binary data"
    },
    {
      "displayName": "Include",
      "name": "include",
      "type": "options",
      "originalType": "options",
      "default": "noOtherFields",
      "description": "Whether to copy any other fields into the new items",
      "options": [
        {
          "name": "No Other Fields",
          "value": "noOtherFields"
        },
        {
          "name": "All Other Fields",
          "value": "allOtherFields"
        },
        {
          "name": "Selected Other Fields",
          "value": "selectedOtherFields"
        }
      ]
    },
    {
      "displayName": "Fields To Include",
      "name": "fieldsToInclude",
      "type": "string",
      "originalType": "string",
      "default": "",
      "description": "Fields in the input items to aggregate together",
      "placeholder": "e.g. email, name",
      "displayOptions": {
        "show": {
          "include": [
            "selectedOtherFields"
          ]
        }
      }
    },
    {
      "displayName": "Options",
      "name": "options",
      "type": "collection",
      "originalType": "collection",
      "default": {},
      "placeholder": "Add Field",
      "options": [
        {
          "name": "disableDotNotation",
          "description": "Whether to disallow referencing child fields using \"{{expression}}\" in the field name"
        },
        {
          "name": "destinationFieldName",
          "description": "The field in the output under which to put the split field contents"
        },
        {
          "name": "includeBinary",
          "description": "Whether to include the binary data in the new items"
        }
      ]
    }
  ],
  };
