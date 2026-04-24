/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Set/Set.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const SetProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Keep Only Set",
    "name": "keepOnlySet",
    "type": "boolean",
    "default": false,
    "description": "Whether only the values set on this node should be kept and all others removed"
  },
  {
    "displayName": "Values to Set",
    "name": "values",
    "placeholder": "Add Value",
    "type": "fixedCollection",
    "typeOptions": {
      "multipleValues": true,
      "sortable": true
    },
    "description": "The value to set",
    "default": {},
    "options": [
      {
        "name": "boolean",
        "displayName": "Boolean",
        "values": [
          {
            "displayName": "Name",
            "name": "name",
            "type": "string",
            "requiresDataPath": "single",
            "default": "propertyName",
            "description": "Name of the property to write data to. Supports dot-notation. Example: \"data.person[0].name\""
          },
          {
            "displayName": "Value",
            "name": "value",
            "type": "boolean",
            "default": false,
            "description": "The boolean value to write in the property"
          }
        ]
      },
      {
        "name": "number",
        "displayName": "Number",
        "values": [
          {
            "displayName": "Name",
            "name": "name",
            "type": "string",
            "default": "propertyName",
            "requiresDataPath": "single",
            "description": "Name of the property to write data to. Supports dot-notation. Example: \"data.person[0].name\""
          },
          {
            "displayName": "Value",
            "name": "value",
            "type": "number",
            "default": 0,
            "description": "The number value to write in the property"
          }
        ]
      },
      {
        "name": "string",
        "displayName": "String",
        "values": [
          {
            "displayName": "Name",
            "name": "name",
            "type": "string",
            "default": "propertyName",
            "requiresDataPath": "single",
            "description": "Name of the property to write data to. Supports dot-notation. Example: \"data.person[0].name\""
          },
          {
            "displayName": "Value",
            "name": "value",
            "type": "string",
            "default": "",
            "description": "The string value to write in the property"
          }
        ]
      }
    ]
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Dot Notation",
        "name": "dotNotation",
        "type": "boolean",
        "default": true,
        "description": "<p>By default, dot-notation is used in property names. This means that \"a.b\" will set the property \"b\" underneath \"a\" so { \"a\": { \"b\": value} }.<p></p>If that is not intended this can be deactivated, it will then set { \"a.b\": value } instead.</p>."
      }
    ]
  }
];
