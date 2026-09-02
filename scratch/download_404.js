const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), 'public', 'games', 'overprint-404');
const srcDir = path.join(targetDir, 'src');

if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });

const filesToFetch = [
  { url: 'https://iskra.graphics/404', dest: path.join(targetDir, 'index.html'), isHtml: true },
  { url: 'https://iskra.graphics/overprint/src/main.js', dest: path.join(srcDir, 'main.js') },
  { url: 'https://iskra.graphics/overprint/src/game.js', dest: path.join(srcDir, 'game.js') },
  { url: 'https://iskra.graphics/overprint/src/render.js', dest: path.join(srcDir, 'render.js') },
  { url: 'https://iskra.graphics/overprint/src/entities.js', dest: path.join(srcDir, 'entities.js') },
  { url: 'https://iskra.graphics/overprint/src/level.js', dest: path.join(srcDir, 'level.js') },
  { url: 'https://iskra.graphics/overprint/src/hud.js', dest: path.join(srcDir, 'hud.js') },
  { url: 'https://iskra.graphics/overprint/src/audio.js', dest: path.join(srcDir, 'audio.js') },
  { url: 'https://iskra.graphics/overprint/src/touch.js', dest: path.join(srcDir, 'touch.js') },
  { url: 'https://iskra.graphics/overprint/src/brand.js', dest: path.join(srcDir, 'brand.js') },
  { url: 'https://iskra.graphics/overprint/src/board.js', dest: path.join(srcDir, 'board.js') },
  { url: 'https://iskra.graphics/overprint/src/micro.js', dest: path.join(srcDir, 'micro.js') },
  { url: 'https://iskra.graphics/overprint/src/net.js', dest: path.join(srcDir, 'net.js') },
  { url: 'https://iskra.graphics/overprint/src/dev.js', dest: path.join(srcDir, 'dev.js') },
  { url: 'https://iskra.graphics/overprint/src/util.js', dest: path.join(srcDir, 'util.js') }
];

async function downloadAll() {
  for (const item of filesToFetch) {
    console.log('Downloading:', item.url);
    const res = await fetch(item.url);
    if (!res.ok) {
      console.error('Failed to download:', item.url, res.status);
      continue;
    }
    let text = await res.text();
    if (item.isHtml) {
      // update script src from /overprint/src/main.js to ./src/main.js
      text = text.replace('/overprint/src/main.js', './src/main.js');
      // remove cloudflare insights script
      text = text.replace(/<script type="module" src="https:\/\/static\.cloudflareinsights\.com[^>]*><\/script>/g, '');
    }
    fs.writeFileSync(item.dest, text, 'utf-8');
    console.log('Saved to:', item.dest, '(' + text.length + ' bytes)');
  }
  console.log('Done downloading game files!');
}

downloadAll();
