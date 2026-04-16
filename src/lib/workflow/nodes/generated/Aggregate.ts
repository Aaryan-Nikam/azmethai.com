// Auto-generated from n8n node: Aggregate
// Source: [n8n]/Transform/Aggregate/Aggregate.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const aggregateNode: AzmethNodeDefinition = {
  "displayName": "Aggregate",
  "name": "aggregate",
  "icon": "aggregate",
  "group": "transform",
  "version": 1,
  "description": "Combine a field from many items into a list in a single item",
  "defaults": {
    "name": "Aggregate"
  },
  "credentials": [],
  "properties": [
    {
      "displayName": "Aggregate",
      "name": "aggregate",
      "type": "options",
      "originalType": "options",
      "default": "aggregateIndividualFields",
      "options": [
        {
          "name": "Individual Fields",
          "value": "aggregateIndividualFields"
        },
        {
          "name": "All Item Data (Into a Single List)",
          "value": "aggregateAllItemData"
        }
      ]
    },
    {
      "displayName": "Fields To Aggregate",
      "name": "fieldsToAggregate",
      "type": "fixedCollection",
      "originalType": "fixedCollection",
      "default": {
        "fieldToAggregate": [
          {
            "fieldToAggregate": "",
            "renameField": false
          }
        ]
      },
      "placeholder": "Add Field To Aggregate",
      "options": [
        {
          "name": "fieldToAggregate"
        }
      ],
      "displayOptions": {
        "show": {
          "aggregate": [
            "aggregateIndividualFields"
          ]
        }
      },
      "typeOptions": {
        "multipleValues": true
      }
    },
    {
      "displayName": "Put Output in Field",
      "name": "destinationFieldName",
      "type": "string",
      "originalType": "string",
      "default": "data",
      "description": "The name of the output field to put the data in",
      "displayOptions": {
        "show": {
          "aggregate": [
            "aggregateAllItemData"
          ]
        }
      }
    },
    {
      "displayName": "Include",
      "name": "include",
      "type": "options",
      "originalType": "options",
      "default": "allFields",
      "options": [
        {
          "name": "All Fields",
          "value": "allFields"
        },
        {
          "name": "Specified Fields",
          "value": "specifiedFields"
        },
        {
          "name": "All Fields Except",
          "value": "allFieldsExcept"
        }
      ],
      "displayOptions": {
        "show": {
          "aggregate": [
            "aggregateAllItemData"
          ]
        }
      }
    },
    {
      "displayName": "Fields To Exclude",
      "name": "fieldsToExclude",
      "type": "string",
      "originalType": "string",
      "default": "",
      "placeholder": "e.g. email, name",
      "displayOptions": {
        "show": {
          "aggregate": [
            "aggregateAllItemData"
          ],
          "include": [
            "allFieldsExcept"
          ]
        }
      }
    },
    {
      "displayName": "Fields To Include",
      "name": "fieldsToInclude",
      "type": "string",
      "originalType": "string",
      "default": "",
      "placeholder": "e.g. email, name",
      "displayOptions": {
        "show": {
          "aggregate": [
            "aggregateAllItemData"
          ],
          "include": [
            "specifiedFields"
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
          "name": "mergeLists",
          "description": "Whether to merge the output into a single flat list (rather than a list of lists), if the field to aggregate is a list"
        },
        {
          "name": "includeBinaries",
          "description": "Whether to include the binary data in the new item"
        },
        {
          "name": "keepOnlyUnique",
          "description": "Whether to keep only unique binaries by comparing mime types, file types, file sizes and file extensions"
        },
        {
          "name": "keepMissing",
          "description": "Whether to add a null entry to the aggregated list when there is a missing or null value"
        }
      ]
    }
  ],
  };
