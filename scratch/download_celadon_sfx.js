const fs = require('fs');
const path = require('path');
const https = require('https');

const sfxDir = path.join(__dirname, '..', 'public', 'games', 'celadon', 'sfx');
fs.mkdirSync(sfxDir, { recursive: true });

const sfxList = [
  'wheel.ogg',
  'kiln.ogg',
  'room.ogg',
  'water.ogg',
  'click.ogg',
  'thud.ogg',
  'splash.ogg',
  'shatter.ogg',
  'chime.ogg'
];

function download(file) {
  return new Promise((resolve, reject) => {
    const url = `https://winchxyz.github.io/celadon/sfx/${file}`;
    const dest = path.join(sfxDir, file);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => {
        out.close(() => {
          console.log(`Downloaded sfx: ${file} (${fs.statSync(dest).size} bytes)`);
          resolve();
        });
      });
    }).on('error', reject);
  });
}

async function main() {
  for (const sfx of sfxList) {
    try {
      await download(sfx);
    } catch (e) {
      console.warn(`Failed sfx: ${sfx}`, e.message);
    }
  }
  console.log('Celadon audio sfx download complete!');
}

main();
