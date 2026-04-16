// Auto-generated from n8n node: DynamicCredentialCheck
// Source: [n8n]/DynamicCredentialCheck/DynamicCredentialCheck.node.ts
// DO NOT EDIT MANUALLY - run scripts/migrate-n8n-nodes.mjs to regenerate

import type { AzmethNodeDefinition } from '../types';

export const dynamicCredentialCheckNode: AzmethNodeDefinition = {
  "displayName": "Check Credential Status",
  "name": "dynamicCredentialCheck",
  "icon": "fa:key",
  "group": "transform",
  "version": 1,
  "description": "Checks whether the triggering user has the required Dynamic credential configured. Routes to \"Ready\" or \"Not Ready\" and returns auth URLs when the credential is missing.",
  "defaults": {
    "name": "Check Credential Status"
  },
  "credentials": [],
  "properties": [],
  };
