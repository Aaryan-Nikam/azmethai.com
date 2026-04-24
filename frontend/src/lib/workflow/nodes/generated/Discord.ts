/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Discord/Discord.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const DiscordProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Webhook URL",
    "name": "webhookUri",
    "type": "string",
    "required": true,
    "default": "",
    "placeholder": "https://discord.com/api/webhooks/ID/TOKEN"
  },
  {
    "displayName": "Content",
    "name": "text",
    "type": "string",
    "typeOptions": {
      "maxValue": 2000
    },
    "default": "",
    "placeholder": "Hello World!"
  },
  {
    "displayName": "Additional Fields",
    "name": "options",
    "type": "collection",
    "placeholder": "Add Option",
    "default": {},
    "options": [
      {
        "displayName": "Allowed Mentions",
        "name": "allowedMentions",
        "type": "json",
        "typeOptions": {
          "alwaysOpenEditWindow": true,
          "editor": "code"
        },
        "default": ""
      },
      {
        "displayName": "Attachments",
        "name": "attachments",
        "type": "json",
        "typeOptions": {
          "alwaysOpenEditWindow": true,
          "editor": "code"
        },
        "default": ""
      },
      {
        "displayName": "Avatar URL",
        "name": "avatarUrl",
        "type": "string",
        "default": ""
      },
      {
        "displayName": "Components",
        "name": "components",
        "type": "json",
        "typeOptions": {
          "alwaysOpenEditWindow": true,
          "editor": "code"
        },
        "default": ""
      },
      {
        "displayName": "Embeds",
        "name": "embeds",
        "type": "json",
        "typeOptions": {
          "alwaysOpenEditWindow": true,
          "editor": "code"
        },
        "default": ""
      },
      {
        "displayName": "Flags",
        "name": "flags",
        "type": "number",
        "default": ""
      },
      {
        "displayName": "JSON Payload",
        "name": "payloadJson",
        "type": "json",
        "typeOptions": {
          "alwaysOpenEditWindow": true,
          "editor": "code"
        },
        "default": ""
      },
      {
        "displayName": "Username",
        "name": "username",
        "type": "string",
        "default": "",
        "placeholder": "User"
      },
      {
        "displayName": "TTS",
        "name": "tts",
        "type": "boolean",
        "default": false,
        "description": "Whether this message be sent as a Text To Speech message"
      }
    ]
  }
];
