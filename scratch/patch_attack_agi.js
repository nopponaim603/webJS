const fs = require('fs');
const path = require('path');

const chunksDir = path.join(__dirname, '..', 'public', 'games', 'attack-agi', '_next', 'static', 'immutable', 'chunks');

for (const file of fs.readdirSync(chunksDir)) {
  if (file.endsWith('.js')) {
    const filePath = path.join(chunksDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check occurrences
    if (content.includes('/_next/')) {
      console.log('Found /_next/ in', file);
      // Replace "/_next/" with "./_next/"
      content = content.replaceAll('/_next/', './_next/');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Patched', file);
    }
  }
}

// Check index.html
const indexPath = path.join(__dirname, '..', 'public', 'games', 'attack-agi', 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Ensure window.TURBOPACK_CHUNK_BASE_PATH is set early in <head>
if (!indexHtml.includes('TURBOPACK_CHUNK_BASE_PATH')) {
  indexHtml = indexHtml.replace('<head>', '<head><script>window.TURBOPACK_CHUNK_BASE_PATH="./_next/";</script>');
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log('Injected TURBOPACK_CHUNK_BASE_PATH into index.html');
}

console.log('Patch complete.');
