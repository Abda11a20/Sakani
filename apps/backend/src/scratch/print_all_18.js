// scratch/print_all_18.js
const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\722111f5-9ada-466f-a35f-373afbc5614b\\.system_generated\\logs\\transcript.jsonl', 'utf-8');

const matches = content.match(/# ✅ \d+\)[^\n]+/g);
if (matches) {
  console.log('--- ALL CHECKLIST HEADINGS FOUND IN TRANSCRIPT ---');
  // Print unique headings
  const unique = Array.from(new Set(matches));
  unique.forEach((item) => console.log(item));
}
