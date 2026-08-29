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
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
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

async function scrapeGodawful() {
  console.log('--- Scraping GODAWFUL ---');
  const targetDir = path.join(__dirname, '..', 'public', 'games', 'godawful');
  const base = 'https://godawful.vercel.app/';
  const files = [
    '',
    'favicon.ico',
    'icons/favicon-32.png',
    'icons/favicon-16.png',
    'icons/apple-touch-icon.png',
    'manifest.webmanifest',
    'og.png',
    'assets/index-veSTcgDR.js',
    'assets/three-BrZzQYGd.js',
    'assets/postfx-CsvJI_1G.js',
    'assets/index-B4xaA4UR.css'
  ];

  for (const f of files) {
    const dest = path.join(targetDir, f === '' ? 'index.html' : f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    try {
      await download(base + f, dest);
      console.log('Downloaded:', f || 'index.html');
    } catch (e) {
      console.error('Error downloading', f, e.message);
    }
  }

  // Check downloaded JS for other asset links
  const jsPath = path.join(targetDir, 'assets', 'index-veSTcgDR.js');
  if (fs.existsSync(jsPath)) {
    const content = fs.readFileSync(jsPath, 'utf8');
    // search for asset paths like assets/xxx or models/xxx or sounds/xxx
    const matches = content.match(/["'](?:\.\/|\/)?assets\/[^"']+["']/g) || [];
    const uniqueAssets = [...new Set(matches.map(m => m.replace(/["']/g, '').replace(/^\.?\//, '')))];
    console.log('Found additional asset references in JS:', uniqueAssets);
    for (const a of uniqueAssets) {
      const dest = path.join(targetDir, a);
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        try {
          await download(base + a, dest);
          console.log('Downloaded referenced asset:', a);
        } catch (e) {
          console.error('Could not download referenced asset:', a, e.message);
        }
      }
    }
  }

  // Clean index.html to remove counter.dev analytics
  const indexPath = path.join(targetDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace(/<script src="https:\/\/cdn\.counter\.dev\/script\.js"[^>]*><\/script>/gi, '');
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('Cleaned counter.dev from index.html');
  }
}

scrapeGodawful().then(() => console.log('GODAWFUL Scrape Finished!'));
