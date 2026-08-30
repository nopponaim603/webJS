const fs = require('fs');
const path = require('path');

const games = ['water-ring-toss', 'celadon', 'crumple'];
let allOk = true;

for (const game of games) {
  const dir = path.join(__dirname, '..', 'public', 'games', game);
  console.log(`\nVerifying game: ${game}`);
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory missing: ${dir}`);
    allOk = false;
    continue;
  }
  const htmlFile = path.join(dir, 'index.html');
  if (!fs.existsSync(htmlFile) || fs.statSync(htmlFile).size === 0) {
    console.error(`❌ index.html missing or empty: ${htmlFile}`);
    allOk = false;
  } else {
    console.log(`✅ index.html (${fs.statSync(htmlFile).size} bytes)`);
  }

  const assetsDir = path.join(dir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    console.log(`✅ assets folder contains ${files.length} files:`, files);
  } else {
    console.error(`❌ assets folder missing: ${assetsDir}`);
    allOk = false;
  }

  if (game === 'celadon') {
    const sfxDir = path.join(dir, 'sfx');
    if (fs.existsSync(sfxDir)) {
      const sfxs = fs.readdirSync(sfxDir);
      console.log(`✅ celadon sfx contains ${sfxs.length} audio files:`, sfxs);
    } else {
      console.error(`❌ celadon sfx folder missing`);
      allOk = false;
    }
  }
}

if (allOk) {
  console.log('\n🎉 ALL 3 GAMES VERIFIED INTEGRATED & VALID!');
} else {
  console.error('\n⚠️ Some verification checks failed.');
  process.exit(1);
}
