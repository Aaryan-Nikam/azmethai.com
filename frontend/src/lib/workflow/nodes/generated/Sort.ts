// Auto-generated from n8n node: Sort
// Source: [n8n]/Transform/Sort/Sort.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const sortNode: AzmethNodeDefinition = {
  "displayName": "Sort",
  "name": "sort",
  "icon": "sort",
  "group": "transform",
  "version": 1,
  "description": "Change items order",
  "defaults": {
    "name": "Sort"
  },
  "credentials": [],
  "properties": [
    {
      "displayName": "Type",
      "name": "type",
      "type": "options",
      "originalType": "options",
      "default": "simple",
      "description": "The type of sorting to perform",
      "options": [
        {
          "name": "Simple",
          "value": "simple"
        },
        {
          "name": "Random",
          "value": "random"
        },
        {
          "name": "Code",
          "value": "code"
        }
      ]
    },
    {
      "displayName": "Fields To Sort By",
      "name": "sortFieldsUi",
      "type": "fixedCollection",
      "originalType": "fixedCollection",
      "default": {},
      "description": "The fields of the input items to sort by",
      "placeholder": "Add Field To Sort By",
      "options": [
        {
          "name": "sortField"
        }
      ],
      "displayOptions": {
        "show": {
          "type": [
            "simple"
          ]
        }
      },
      "typeOptions": {
        "multipleValues": true
      }
    },
    {
      "displayName": "Code",
      "name": "code",
      "type": "string",
      "originalType": "string",
      "default": "{{expression}}",
      "description": "Javascript code to determine the order of any two items",
      "displayOptions": {
        "show": {
          "type": [
            "code"
          ]
        }
      },
      "typeOptions": {
        "alwaysOpenEditWindow": true,
        "editor": "jsEditor",
        "rows": 10
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
        }
      ],
      "displayOptions": {
        "show": {
          "type": [
            "simple"
          ]
        }
      }
    }
  ],
  };
