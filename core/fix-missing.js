import { spawnSync } from 'child_process';
import { writeFileSync, mkdirSync, appendFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';

let attempts = 0;
while (attempts < 100) {
    attempts++;
    console.log(`Attempt ${attempts}...`);
    const result = spawnSync('npx', ['tsx', 'src/entry.ts', 'gateway'], { encoding: 'utf-8', timeout: 6000 });

    const output = (result.stderr || '') + (result.stdout || '');
    if (output.includes('ERR_MODULE_NOT_FOUND')) {
        const match = output.match(/Cannot find module ['"]([^'"]+)['"]/);
        if (match && match[1]) {
            const missingFile = match[1].replace(/\.js$/, '.ts');
            console.log(`Missing file: ${missingFile}`);
            if (!existsSync(dirname(missingFile))) {
                mkdirSync(dirname(missingFile), { recursive: true });
            }
            writeFileSync(missingFile, 'export {};\nexport default {};\n');
            continue;
        }
    }

    if (output.includes('does not provide an export named')) {
        const match = output.match(/The requested module ['"]([^'"]+)['"] does not provide an export named ['"]([^'"]+)['"]/);
        if (match && match[1] && match[2]) {
            const fileMatch = output.match(/Failed to start CLI: ([^\n:]+\.ts):\d+/);
            if (fileMatch && fileMatch[1]) {
                const requestingFile = fileMatch[1].trim();
                const resolvedFile = resolve(dirname(requestingFile), match[1]).replace(/\.js$/, '.ts');
                console.log(`Missing export: ${match[2]} in ${resolvedFile}`);
                if (!existsSync(dirname(resolvedFile))) {
                    mkdirSync(dirname(resolvedFile), { recursive: true });
                }
                appendFileSync(resolvedFile, `\nexport const ${match[2]} = undefined as any;\n`);
                continue;
            } else {
                console.log("Failed to extract requesting file from output:", output);
                break;
            }
        }
    }

    console.log('Success or different error:');
    console.log(output);
    break;
}
