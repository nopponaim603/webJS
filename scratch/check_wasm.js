const fs = require('fs');
const path = require('path');
const dir = 'public/games/coin-pusher-3d-copper-cascade';

for (const f of fs.readdirSync(dir)) {
  const full = path.join(dir, f);
  if (fs.statSync(full).isFile() && (f.endsWith('.js') || f.endsWith('.mjs'))) {
    const text = fs.readFileSync(full, 'utf8');
    const wasm = text.match(/[\w\-\.\/]+\.wasm/gi);
    if (wasm) console.log(f, 'references wasm:', wasm);
    const fetches = text.match(/fetch\s*\([^)]+\)/gi);
    if (fetches) console.log(f, 'references fetch:', fetches);
  }
}
