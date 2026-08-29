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

async function scrapeSurvive() {
  console.log('--- Scraping SURVIVE 10 WAVES ---');
  const targetDir = path.join(__dirname, '..', 'public', 'games', 'survive-10-waves');
  const base = 'https://www.survive10waves.com/';

  const initialFiles = [
    '',
    'assets/favicons/apple-icon-57x57.png',
    'assets/favicons/apple-icon-60x60.png',
    'assets/favicons/apple-icon-72x72.png',
    'assets/favicons/apple-icon-76x76.png',
    'assets/favicons/apple-icon-114x114.png',
    'assets/favicons/apple-icon-120x120.png',
    'assets/favicons/apple-icon-144x144.png',
    'assets/favicons/apple-icon-152x152.png',
    'assets/favicons/apple-icon-180x180.png',
    'assets/favicons/android-icon-192x192.png',
    'assets/favicons/favicon-32x32.png',
    'assets/favicons/favicon-96x96.png',
    'assets/favicons/favicon-16x16.png',
    'assets/favicons/manifest.json',
    'assets/logo/wordmark.png',
    'assets/testimonials/sheet.webp',
    'assets/og-image.jpg',
    'vendor/three/three.module.js',
    'src/ui/testimonials.js',
    'src/config/testimonials.js',
    'src/config/avatars.js',
    'src/config/tracks.js',
    'src/main.js',
    'mod-tip.css',
    'mod-screen.css',
    'stale.css',
    'rack.css',
    'controls.css',
    'volume.css',
    'scrollbar.css',
    'travel.css',
    'menu.css',
    'testimonials.css',
    'story.css',
    'credits.css',
    'item-hud.css',
    'index.css',
    'touch.css'
  ];

  const downloaded = new Set();
  const queue = [...initialFiles];

  while (queue.length > 0) {
    const fileRel = queue.shift();
    if (downloaded.has(fileRel)) continue;
    downloaded.add(fileRel);

    const dest = path.join(targetDir, fileRel === '' ? 'index.html' : fileRel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    try {
      await download(base + (fileRel.startsWith('/') ? fileRel.slice(1) : fileRel), dest);
      console.log('Downloaded:', fileRel || 'index.html');

      // If this is a JS, CSS, or JSON file, parse for further imports/fetches
      if (dest.endsWith('.js') || dest.endsWith('.html') || dest.endsWith('.css') || dest.endsWith('.json')) {
        const text = fs.readFileSync(dest, 'utf8');

        // Regex for JS imports: import ... from './something.js' or import('./something.js')
        const importMatches = [
          ...text.matchAll(/import\s+(?:[^'"]*from\s+)?['"]([^'"]+)['"]/g),
          ...text.matchAll(/import\(['"]([^'"]+)['"]\)/g)
        ];

        for (const match of importMatches) {
          let spec = match[1];
          if (spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/')) {
            // resolve relative to current file's directory
            const currentDirRel = path.dirname(fileRel);
            let resolvedRel = path.normalize(path.join(currentDirRel, spec)).replace(/\\/g, '/');
            if (resolvedRel.startsWith('/')) resolvedRel = resolvedRel.slice(1);
            if (!downloaded.has(resolvedRel) && !queue.includes(resolvedRel)) {
              queue.push(resolvedRel);
            }
          } else if (spec.startsWith('three/addons/')) {
            const resolvedRel = 'vendor/three/addons/' + spec.slice('three/addons/'.length);
            if (!downloaded.has(resolvedRel) && !queue.includes(resolvedRel)) {
              queue.push(resolvedRel);
            }
          }
        }

        // Regex for quoted assets: models/*.glb, audio/*.mp3, assets/*, etc.
        const assetMatches = [
          ...text.matchAll(/['"]((?:assets|models|audio|sound|textures|src|vendor)\/[^'"]+\.[a-zA-Z0-9]+)['"]/g),
          ...text.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)
        ];

        for (const match of assetMatches) {
          let spec = match[1].replace(/^\.?\//, '');
          if (!spec.startsWith('http') && !spec.startsWith('data:') && !spec.startsWith('#')) {
            const currentDirRel = path.dirname(fileRel);
            let resolvedRel = spec;
            if (spec.startsWith('./') || spec.startsWith('../')) {
              resolvedRel = path.normalize(path.join(currentDirRel, spec)).replace(/\\/g, '/');
            }
            if (!downloaded.has(resolvedRel) && !queue.includes(resolvedRel)) {
              queue.push(resolvedRel);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error downloading:', fileRel, e.message);
    }
  }

  // Clean index.html (remove external analytics / beacon)
  const indexPath = path.join(targetDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace(/<script[^>]*simpleanalyticscdn[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script[^>]*cloudflareinsights[^>]*><\/script>/gi, '');
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('Cleaned analytics from SURVIVE 10 WAVES index.html');
  }
}

scrapeSurvive().then(() => console.log('SURVIVE 10 WAVES Scrape Finished!'));
