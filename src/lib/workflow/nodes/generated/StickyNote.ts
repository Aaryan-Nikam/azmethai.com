/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/StickyNote/StickyNote.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const StickyNoteProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Content",
    "name": "content",
    "type": "string",
    "required": true,
    "default": "## I'm a note \n**Double click** to edit me. [Guide](https://docs.n8n.io/workflows/sticky-notes/)"
  },
  {
    "displayName": "Height",
    "name": "height",
    "type": "number",
    "required": true,
    "default": 160
  },
  {
    "displayName": "Width",
    "name": "width",
    "type": "number",
    "required": true,
    "default": 240
  }
];
