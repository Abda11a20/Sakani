// scratch/get_all_steps.js
const fs = require('fs');

const text = fs.readFileSync('C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\722111f5-9ada-466f-a35f-373afbc5614b\\.system_generated\\logs\\transcript.jsonl', 'utf-8');

for (let i = 1; i <= 18; i++) {
  const match = text.match(new RegExp(`# (?:✅ )?${i}\\)\\s+([^\\n\\r]+)`));
  if (match) {
    console.log(`${i}. ${match[1]}`);
  }
}
