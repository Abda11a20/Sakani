// scratch/find_checklist.js
const fs = require('fs');
const readline = require('readline');

async function searchTranscript() {
  const fileStream = fs.createReadStream('C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\722111f5-9ada-466f-a35f-373afbc5614b\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('Checklist') || line.includes('الخطوة') || line.includes('ستيب')) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'USER_INPUT' || (parsed.content && parsed.content.includes('1)'))) {
          console.log('--- FOUND ---');
          console.log(parsed.content || JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  }
}

searchTranscript();
