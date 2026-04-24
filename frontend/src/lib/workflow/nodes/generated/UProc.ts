/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/UProc/UProc.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const UProcProperties: AzmethNodeProperty[] = [
                ...GroupDescription_1.groupOptions,
                ...ToolDescription_1.toolOperations,
                ...ToolDescription_1.toolParameters,
                {
                    displayName: 'Additional Options',
                    name: 'additionalOptions',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    displayOptions: {
                        show: {
                            group: [
                                'audio',
                                'communication',
                                'company',
                                'finance',
                                'geographic',
                                'image',
                                'internet',
                                'personal',
                                'product',
                                'security',
                                'text',
                            ],
                        },
                    },
                    options: [
                        {
                            displayName: 'Data Webhook',
                            name: 'dataWebhook',
                            type: 'string',
                            description: 'URL to send tool response when tool has resolved your request',
                            default: '',
                        },
                    ],
                },
            ];
