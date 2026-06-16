const fs = require('fs');

const path = 'C:/Users/Juampo/.gemini/antigravity-ide/brain/d24d8e3b-7918-459f-8890-81f80f5437ad/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

let latestCode = null;

for (let line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
            for (let call of obj.tool_calls) {
                if (call.name === 'write_to_file' || call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
                    const args = call.arguments;
                    if (args && args.TargetFile && args.TargetFile.includes('AdminDashboard.jsx')) {
                        // For write_to_file:
                        if (args.CodeContent) {
                            // latestCode = args.CodeContent; // wait, I didn't write_to_file AdminDashboard.jsx
                        }
                        // For replace_file_content:
                        if (args.ReplacementContent) {
                            latestCode = args.ReplacementContent;
                            fs.writeFileSync('c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/recovered_snippet.txt', latestCode);
                        }
                        if (args.ReplacementChunks) {
                             fs.writeFileSync('c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/recovered_chunks.json', JSON.stringify(args.ReplacementChunks, null, 2));
                        }
                    }
                }
            }
        }
    } catch (e) {}
}

console.log("Done");
