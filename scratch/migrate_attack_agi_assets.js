const fs = require('fs');
const path = require('path');

const gameDir = path.join(__dirname, '..', 'public', 'games', 'attack-agi');
const oldNextDir = path.join(gameDir, '_next');
const newAssetsDir = path.join(gameDir, 'game_assets');

// 1. Rename _next directory to game_assets
if (fs.existsSync(oldNextDir)) {
  if (fs.existsSync(newAssetsDir)) {
    fs.rmSync(newAssetsDir, { recursive: true, force: true });
  }
  fs.renameSync(oldNextDir, newAssetsDir);
  console.log('Renamed _next to game_assets');
}

// 2. Walk and replace in all files in game_assets
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.html') || f.endsWith('.json')) {
      let content = fs.readFileSync(full, 'utf8');
      let modified = false;

      if (content.includes('_next')) {
        content = content.replaceAll('_next', 'game_assets');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Replaced _next in', path.relative(gameDir, full));
      }
    }
  }
}

walk(newAssetsDir);

// 3. Update index.html
const indexPath = path.join(gameDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Replace all _next with game_assets
html = html.replaceAll('_next', 'game_assets');

// Replace TURBOPACK_CHUNK_BASE_PATH
html = html.replace(/TURBOPACK_CHUNK_BASE_PATH\s*=\s*["'][^"']+["']/, 'TURBOPACK_CHUNK_BASE_PATH="./game_assets/"');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Updated index.html with game_assets');

// 4. Ensure 3semvlrhj63l1.js (and _v2) has safe getAssetPrefix
const chunksDir = path.join(newAssetsDir, 'static', 'immutable', 'chunks');
for (const file of fs.readdirSync(chunksDir)) {
  if (file.includes('3sem')) {
    const chunkPath = path.join(chunksDir, file);
    let code = fs.readFileSync(chunkPath, 'utf8');
    // Ensure function l() never throws InvariantError
    const fixedFunc = `function l(){
      try {
        let e = document.currentScript;
        if (e && e.src && e.src.indexOf('/game_assets/') !== -1) {
          let t = new URL(e.src).pathname;
          let n = t.indexOf('/game_assets/');
          return t.slice(0, n);
        }
        return location.pathname.replace(/\\/[^\\/]*$/, '');
      } catch(err) {
        return '';
      }
    }`;
    
    // Replace any remaining InvariantError check in l()
    const regex = /function l\(\)\{[\s\S]*?return t\.slice\(0,n\)\}/;
    if (regex.test(code)) {
      code = code.replace(regex, fixedFunc);
      fs.writeFileSync(chunkPath, code, 'utf8');
      console.log('Fixed function l() in', file);
    }
  }
}

console.log('Migration to game_assets complete.');
