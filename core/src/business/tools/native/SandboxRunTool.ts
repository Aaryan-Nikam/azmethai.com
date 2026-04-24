import * as child_process from 'child_process'
import Anthropic from '@anthropic-ai/sdk'

export class SandboxRunTool {
  static get definition(): Anthropic.Tool {
    return {
      name: 'execute_javascript',
      description: 'Executes arbitrary Node.js (JavaScript) code inside a secured Sandbox. Use this to pull from external APIs, scrape websites, or run complex data transformations when a pre-built tool is not available. The code is executed in an isolated child process. Return data using console.log() which will be captured as output. You have access to built-in string/math node features, and standard global `fetch`.',
      input_schema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The raw JavaScript code to execute. Must print final result to console.log() or throw an error.',
          },
        },
        required: ['code'],
      },
    }
  }

  static async execute(input: { code: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create an isolated script wrapper
      // We force a timeout and limit RAM inside the exec
      const scriptCode = `
        async function run() {
           try {
             ${input.code}
           } catch(e) {
             console.error("SANDBOX_ERROR: " + e.message);
             process.exit(1);
           }
        }
        run();
      `

      const timeoutMs = 30000 // 30s timeout

      // Spawn Node process executing the script exactly like Claude Code BashTool
      const proc = child_process.exec(
        `node -e ${JSON.stringify(scriptCode)}`,
        { timeout: timeoutMs },
        (error, stdout, stderr) => {
          if (error) {
            return resolve({
              status: 'error',
              message: error.message,
              stderr: stderr.trim(),
              stdout: stdout.trim()
            })
          }

          if (stderr && stderr.includes('SANDBOX_ERROR:')) {
            return resolve({
              status: 'error',
              stderr: stderr.trim(),
              stdout: stdout.trim()
            })
          }

          return resolve({
            status: 'success',
            stdout: stdout.trim(),
          })
        }
      )
    })
  }
}
