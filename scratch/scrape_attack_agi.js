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
      fs.mkdirSync(path.dirname(dest), { recursive: true });
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

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeAttackAGI() {
  console.log('--- Scraping Attack AGI ---');
  const targetDir = path.join(__dirname, '..', 'public', 'games', 'attack-agi');
  const base = 'https://attackagi.lucasbai.com';

  // 1. Fetch HTML
  let html = await fetchText(base + '/');
  
  // 2. Extract CSS files
  const cssMatches = [...html.matchAll(/href="(\/_next\/static\/immutable\/chunks\/[^"]+\.css)"/g)].map(m => m[1]);
  // 3. Extract Font files
  const fontMatches = [...html.matchAll(/href="(\/_next\/static\/immutable\/media\/[^"]+)"/g)].map(m => m[1]);
  // 4. Extract Script files
  const scriptMatches = [...html.matchAll(/src="(\/_next\/static\/immutable\/chunks\/[^"]+\.js)"/g)].map(m => m[1]);
  // 5. Favicon
  const faviconMatches = [...html.matchAll(/href="(\/favicon[^"]+)"/g)].map(m => m[1]);

  console.log('Found CSS:', cssMatches);
  console.log('Found Fonts:', fontMatches);
  console.log('Found Scripts:', scriptMatches);
  console.log('Found Favicon:', faviconMatches);

  const allFiles = [...new Set([...cssMatches, ...fontMatches, ...scriptMatches, ...faviconMatches])];

  for (const rel of allFiles) {
    const cleanRel = rel.split('?')[0];
    const dest = path.join(targetDir, cleanRel.replace(/^\//, ''));
    try {
      await download(base + rel, dest);
      console.log('Downloaded:', cleanRel);
    } catch (e) {
      console.error('Error downloading:', rel, e.message);
    }
  }

  // Check CSS files for additional font/image references
  for (const cssRel of cssMatches) {
    const cleanRel = cssRel.split('?')[0];
    const cssPath = path.join(targetDir, cleanRel.replace(/^\//, ''));
    if (fs.existsSync(cssPath)) {
      let cssContent = fs.readFileSync(cssPath, 'utf8');
      const urlMatches = [...cssContent.matchAll(/url\((['"]?)(.*?)\1\)/g)].map(m => m[2]);
      for (const u of urlMatches) {
        if (!u.startsWith('data:') && !u.startsWith('http')) {
          let assetUrl = u;
          if (!assetUrl.startsWith('/')) {
            assetUrl = path.posix.join('/_next/static/immutable/chunks', u);
          }
          const assetDest = path.join(targetDir, assetUrl.replace(/^\//, ''));
          if (!fs.existsSync(assetDest)) {
            try {
              await download(base + assetUrl, assetDest);
              console.log('Downloaded CSS asset:', assetUrl);
            } catch (e) {
              console.error('Error downloading CSS asset:', assetUrl, e.message);
            }
          }
        }
      }
      
      // Make css urls relative if needed:
      // Replace /_next/ with ../../ in css if it references root
      cssContent = cssContent.replace(/\/([^\s\)\'"]+)/g, (match, p1) => {
        if (p1.startsWith('_next/')) {
          // css is in _next/static/immutable/chunks/
          return '../../' + p1.replace('_next/static/immutable/', '');
        }
        return match;
      });
      fs.writeFileSync(cssPath, cssContent, 'utf8');
    }
  }

  // Now rewrite paths in html to be relative:
  // /_next/ -> ./_next/
  // /favicon -> ./favicon
  let relHtml = html;
  relHtml = relHtml.replaceAll('/_next/', './_next/');
  relHtml = relHtml.replaceAll('/favicon.ico', './favicon.ico');
  
  // Also check if self.__next_f references "/_next/":
  relHtml = relHtml.replaceAll('\\"/_next/', '\\"./_next/');

  fs.writeFileSync(path.join(targetDir, 'index.html'), relHtml, 'utf8');
  console.log('Saved converted relative index.html');

  // Also check turbopack-09ib0bp5dbqe3.js and make sure chunk references work
  const turboPath = path.join(targetDir, '_next', 'static', 'immutable', 'chunks', 'turbopack-09ib0bp5dbqe3.js');
  if (fs.existsSync(turboPath)) {
    let turboCode = fs.readFileSync(turboPath, 'utf8');
    // Check if turbopack references otherChunks
    console.log('Turbopack code length:', turboCode.length);
  }

  console.log('Attack AGI scraping completed successfully.');
}

scrapeAttackAGI();
