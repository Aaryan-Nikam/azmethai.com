/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Amqp/AmqpTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const AmqpTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Queue / Topic",
    "name": "sink",
    "type": "string",
    "default": "",
    "placeholder": "topic://sourcename.something",
    "description": "Name of the queue of topic to listen to"
  },
  {
    "displayName": "Clientname",
    "name": "clientname",
    "type": "string",
    "default": "",
    "placeholder": "for durable/persistent topic subscriptions, example: \"n8n\"",
    "description": "Leave empty for non-durable topic subscriptions or queues"
  },
  {
    "displayName": "Subscription",
    "name": "subscription",
    "type": "string",
    "default": "",
    "placeholder": "for durable/persistent topic subscriptions, example: \"order-worker\"",
    "description": "Leave empty for non-durable topic subscriptions or queues"
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
        "displayName": "Convert Body To String",
        "name": "jsonConvertByteArrayToString",
        "type": "boolean",
        "default": false,
        "description": "Whether to convert JSON Body content ([\"body\"][\"content\"]) from Byte Array to string. Needed for Azure Service Bus."
      },
      {
        "displayName": "JSON Parse Body",
        "name": "jsonParseBody",
        "type": "boolean",
        "default": false,
        "description": "Whether to parse the body to an object"
      },
      {
        "displayName": "Messages per Cicle",
        "name": "pullMessagesNumber",
        "type": "number",
        "default": 100,
        "description": "Number of messages to pull from the bus for every cicle"
      },
      {
        "displayName": "Only Body",
        "name": "onlyBody",
        "type": "boolean",
        "default": false,
        "description": "Whether to return only the body property"
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
        "displayName": "Sleep Time",
        "name": "sleepTime",
        "type": "number",
        "default": 10,
        "description": "Milliseconds to sleep after every cicle"
      }
    ]
  }
];
