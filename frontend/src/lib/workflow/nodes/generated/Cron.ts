/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Cron/Cron.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const CronProperties: AzmethNodeProperty[] = [
                {
                    displayName: 'This workflow will run on the schedule you define here once you <a data-key="activate">activate</a> it.<br><br>For testing, you can also trigger it manually: by going back to the canvas and clicking ‘execute workflow’',
                    name: 'notice',
                    type: 'notice',
                    default: '',
                },
                {
                    displayName: 'Trigger Times',
                    name: 'triggerTimes',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                        multipleValueButtonText: 'Add Time',
                    },
                    default: {},
                    description: 'Triggers for the workflow',
                    placeholder: 'Add Cron Time',
                    options: n8n_workflow_1.NodeHelpers.cronNodeOptions,
                },
            ];
