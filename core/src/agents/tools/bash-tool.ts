import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { Tool, ToolResult, ToolDefinition } from '../../types/mantis.js';

const execAsync = promisify(exec);

export class BashTool implements Tool {
    name = 'bash';
    definition: ToolDefinition = {
        name: 'bash',
        description: 'Execute terminal bash commands. Use this to run CLI skills or interact with the file system. Use with caution.',
        input_schema: {
            type: 'object',
            properties: {
                command: {
                    type: 'string',
                    description: 'The precise bash command to execute in the terminal.'
                }
            },
            required: ['command']
        }
    };

    async execute(input: any): Promise<ToolResult> {
        const command = input.command;
        
        if (!command || typeof command !== 'string') {
            return {
                toolName: this.name,
                success: false,
                error: 'Invalid or missing command.'
            };
        }

        try {
            // Basic execution using exec. 
            // Warning: For non-sandboxed environments, relying entirely on AzmethAgent guardrails 
            // for input validation prior to this execution.
            const result = await execAsync(command, { timeout: 30000 });
            
            return {
                toolName: this.name,
                success: true,
                data: {
                    stdout: result.stdout.slice(0, 4000), // Trim output to prevent context overflow
                    stderr: result.stderr.slice(0, 4000)
                }
            };
        } catch (error: any) {
            return {
                toolName: this.name,
                success: false,
                error: `Command failed: ${error.message}\nStderr: ${error.stderr?.slice(0, 2000) || ''}`,
                data: {
                    stdout: error.stdout?.slice(0, 2000) || '',
                    stderr: error.stderr?.slice(0, 2000) || ''
                }
            };
        }
    }
}
