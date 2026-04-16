/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/FunctionItem/FunctionItem.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const FunctionItemProperties: AzmethNodeProperty[] = [
  {
    "displayName": "A newer version of this node type is available, called the ‘Code’ node",
    "name": "notice",
    "type": "notice",
    "default": ""
  },
  {
    "displayName": "JavaScript Code",
    "name": "functionCode",
    "typeOptions": {
      "alwaysOpenEditWindow": true,
      "codeAutocomplete": "functionItem",
      "editor": "code",
      "rows": 10
    },
    "type": "string",
    "default": "// Code here will run once per input item.\n// More info and help: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.functionitem/\n// Tip: You can use luxon for dates and $jmespath for querying JSON structures\n\n// Add a new field called 'myNewField' to the JSON of the item\nitem.myNewField = 1;\n\n// You can write logs to the browser console\nconsole.log('Done!');\n\nreturn item;",
    "description": "The JavaScript code to execute for each item",
    "noDataExpression": true
  }
];
