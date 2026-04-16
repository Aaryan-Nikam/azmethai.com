/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Amqp/Amqp.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const AmqpProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Queue / Topic",
    "name": "sink",
    "type": "string",
    "default": "",
    "placeholder": "topic://sourcename.something",
    "description": "Name of the queue of topic to publish to"
  },
  {
    "displayName": "Headers",
    "name": "headerParametersJson",
    "type": "json",
    "default": "",
    "description": "Header parameters as JSON (flat object). Sent as application_properties in amqp-message meta info."
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Container ID",
        "name": "containerId",
        "type": "string",
        "default": "",
        "description": "Will be used to pass to the RHEA Backend as container_id"
      },
      {
        "displayName": "Data as Object",
        "name": "dataAsObject",
        "type": "boolean",
        "default": false,
        "description": "Whether to send the data as an object"
      },
      {
        "displayName": "Reconnect",
        "name": "reconnect",
        "type": "boolean",
        "default": true,
        "description": "Whether to automatically reconnect if disconnected"
      },
      {
        "displayName": "Reconnect Limit",
        "name": "reconnectLimit",
        "type": "number",
        "default": 50,
        "description": "Maximum number of reconnect attempts"
      },
      {
        "displayName": "Send Property",
        "name": "sendOnlyProperty",
        "type": "string",
        "default": "",
        "description": "The only property to send. If empty the whole item will be sent."
      }
    ]
  }
];
