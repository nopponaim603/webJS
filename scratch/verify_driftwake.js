const fs = require('fs');
const path = require('path');

const gameDir = path.join(__dirname, '..', 'public', 'games', 'boat-roguelite-driftwake');
const files = [
  'index.html',
  'styles.css',
  'main.js',
  'sim.js',
  'render.js',
  'audio.js',
  'armament.js',
  'vendor/three.module.min.js',
  'vendor/three.core.min.js'
];

for (const f of files) {
  const filePath = path.join(gameDir, f);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing file: ${f}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n=== File: ${f} (${content.length} chars) ===`);
  
  const matches = content.match(/['"](\.[^'"]+\.[a-zA-Z0-9]+)['"]/g) || [];
  for (const m of new Set(matches)) {
    const clean = m.replace(/['"]/g, '');
    const resolved = path.resolve(path.dirname(filePath), clean);
    const exists = fs.existsSync(resolved);
    console.log(`  Reference: ${clean} -> Exists? ${exists} (${resolved})`);
  }
}
