const fs = require('fs');
const path = require('path');
const https = require('https');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        return download(redirectUrl, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed ${url}: HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      try { fs.unlinkSync(dest); } catch (_) {}
      reject(err);
    });
  });
}

async function scrapeDirtline() {
  console.log('--- Scraping DIRT LINE ---');
  const targetDir = path.join(__dirname, '..', 'public', 'games', 'dirtline');
  const base = 'https://dirtline.pages.dev/';

  const initialFiles = [
    '',
    'vendor/three.min.js'
  ];

  for (const f of initialFiles) {
    const dest = path.join(targetDir, f === '' ? 'index.html' : f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    try {
      await download(base + f, dest);
      console.log('Downloaded:', f || 'index.html');
    } catch (e) {
      console.error('Error downloading:', f, e.message);
    }
  }

  // Read index.html and find all referenced asset files (e.g. ./assets/... or assets/...)
  const indexPath = path.join(targetDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    const assetMatches = [
      ...content.matchAll(/["'](?:\.\/|\/)?(assets\/[^"']+)["']/g)
    ];

    const uniqueAssets = [...new Set(assetMatches.map(m => m[1]))];
    console.log('Discovered DIRT LINE assets in index.html:', uniqueAssets);

    for (const a of uniqueAssets) {
      const dest = path.join(targetDir, a);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        await download(base + a, dest);
        console.log('Downloaded asset:', a);
      } catch (e) {
        console.error('Error downloading asset:', a, e.message);
      }
    }
  }
}

scrapeDirtline().then(() => console.log('DIRT LINE Scrape Finished!'));
