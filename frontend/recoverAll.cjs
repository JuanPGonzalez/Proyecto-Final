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
                if (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
                    const args = call.arguments;
                    if (args && args.TargetFile) {
                        if (args.ReplacementContent) {
                            fs.writeFileSync(`c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/recovered_snippet_${index++}.txt`, args.ReplacementContent);
                        }
                        if (args.ReplacementChunks) {
                             fs.writeFileSync(`c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/recovered_chunks_${index++}.json`, JSON.stringify(args.ReplacementChunks, null, 2));
                        }
                    }
                }
            }
        }
    } catch (e) {}
}

console.log("Done extracting " + index + " files");
