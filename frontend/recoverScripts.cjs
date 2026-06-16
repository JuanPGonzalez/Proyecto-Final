const fs = require('fs');

const path = 'C:/Users/Juampo/.gemini/antigravity-ide/brain/d24d8e3b-7918-459f-8890-81f80f5437ad/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

let index = 0;
for (let line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
            for (let call of obj.tool_calls) {
                if (call.name === 'write_to_file' || call.name === 'write_to_file') {
                    const args = call.arguments;
                    if (args && args.CodeContent) {
                        fs.writeFileSync(`c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/recovered_script_${index++}.cjs`, args.CodeContent);
                    }
                }
            }
        }
    } catch (e) {}
}

console.log("Done extracting " + index + " files");
