/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Function/Function.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const FunctionProperties: AzmethNodeProperty[] = [
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
      "codeAutocomplete": "function",
      "editor": "code",
      "rows": 10
    },
    "type": "string",
    "default": "// Code here will run only once, no matter how many input items there are.\n// More info and help:https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.function/\n// Tip: You can use luxon for dates and $jmespath for querying JSON structures\n\n// Loop over inputs and add a new field called 'myNewField' to the JSON of each one\nfor (item of items) {\n  item.json.myNewField = 1;\n}\n\n// You can write logs to the browser console\nconsole.log('Done!');\n\nreturn items;",
    "description": "The JavaScript code to execute",
    "noDataExpression": true
  }
];
