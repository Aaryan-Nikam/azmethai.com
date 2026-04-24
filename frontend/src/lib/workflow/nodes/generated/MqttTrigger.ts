/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/MQTT/MqttTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const MqttTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Topics",
    "name": "topics",
    "type": "string",
    "default": "",
    "description": "Topics to subscribe to, multiple can be defined with comma. Wildcard characters are supported (+ - for single level and # - for multi level). By default all subscription used QoS=0. To set a different QoS, write the QoS desired after the topic preceded by a colom. For Example: topicA:1,topicB:2"
  },
  {
    "displayName": "Options",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "JSON Parse Body",
        "name": "jsonParseBody",
        "type": "boolean",
        "default": false,
        "description": "Whether to try parse the message to an object"
      },
      {
        "displayName": "Only Message",
        "name": "onlyMessage",
        "type": "boolean",
        "default": false,
        "description": "Whether to return only the message property"
      }
    ]
  }
];
