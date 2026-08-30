const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        return downloadFile(redirectUrl, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    });
    req.on('error', (err) => {
      try { fs.unlinkSync(dest); } catch (_) {}
      reject(err);
    });
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout for ${url}`));
    });
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        return fetchText(redirectUrl).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeWaterRingToss() {
  console.log('\n=== [1/3] Scraping Water Ring Toss Game ===');
  const targetDir = path.join(__dirname, '..', 'public', 'games', 'water-ring-toss');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });

  const baseUrl = 'https://projects.arkon.digital/threejs/water-ring-toss-game/';
  const html = await fetchText(baseUrl);
  
  // Clean HTML: Remove analytics / cloudflare and fix asset links to ./assets/...
  let cleanHtml = html
    .replace(/<script[^>]*cloudflareinsights[^>]*><\/script>/gi, '')
    .replace(/\/threejs\/water-ring-toss-game\/assets\//g, './assets/');

  // Find asset files referenced
  const jsMatch = html.match(/src="[^"]*assets\/([^"]+)"/);
  const cssMatch = html.match(/href="[^"]*assets\/([^"]+)"/);

  if (jsMatch) {
    const jsName = jsMatch[1];
    const jsUrl = `https://projects.arkon.digital/threejs/water-ring-toss-game/assets/${jsName}`;
    console.log(`Downloading JS: ${jsName}`);
    let jsText = await fetchText(jsUrl);
    
    // Find all referenced assets inside the JS bundle (models, audio, images, worker, wasm)
    const assetMatches = jsText.match(/['"][^'"]+\.(?:glb|gltf|bin|wasm|png|jpg|jpeg|svg|mp3|ogg|wav|hdr|exr|json)['"]/gi) || [];
    const discovered = new Set();
    for (const m of assetMatches) {
      const p = m.replace(/['"]/g, '');
      if (!p.startsWith('http') && !p.startsWith('data:') && !p.startsWith('blob:')) {
        discovered.add(p);
      }
    }
    console.log('Discovered assets in Water Ring Toss JS:', Array.from(discovered));

    for (const asset of discovered) {
      const cleanAsset = asset.replace(/^\.?\//, '').replace(/^assets\//, '');
      const assetUrl = `https://projects.arkon.digital/threejs/water-ring-toss-game/assets/${cleanAsset}`;
      const dest = path.join(targetDir, 'assets', cleanAsset);
      try {
        await downloadFile(assetUrl, dest);
        console.log(`  Downloaded: assets/${cleanAsset}`);
      } catch (e) {
        // Try root relative
        try {
          const rootUrl = `https://projects.arkon.digital/threejs/water-ring-toss-game/${cleanAsset}`;
          await downloadFile(rootUrl, dest);
          console.log(`  Downloaded: ${cleanAsset}`);
        } catch (e2) {
          console.warn(`  Failed asset: ${cleanAsset}`);
        }
      }
    }

    // Fix any absolute path in JS
    jsText = jsText.replace(/\/threejs\/water-ring-toss-game\/assets\//g, './assets/');
    fs.writeFileSync(path.join(targetDir, 'assets', jsName), jsText);
  }

  if (cssMatch) {
    const cssName = cssMatch[1];
    const cssUrl = `https://projects.arkon.digital/threejs/water-ring-toss-game/assets/${cssName}`;
    console.log(`Downloading CSS: ${cssName}`);
    let cssText = await fetchText(cssUrl);
    cssText = cssText.replace(/\/threejs\/water-ring-toss-game\/assets\//g, './assets/');
    fs.writeFileSync(path.join(targetDir, 'assets', cssName), cssText);
  }

  fs.writeFileSync(path.join(targetDir, 'index.html'), cleanHtml);
  console.log('Water Ring Toss Game saved successfully!');
}

async function scrapeCeladon() {
  console.log('\n=== [2/3] Scraping CELADON — The Long Ash ===');
  const targetDir = path.join(__dirname, '..', 'public', 'games', 'celadon');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });

  const baseUrl = 'https://winchxyz.github.io/celadon/';
  const html = await fetchText(baseUrl);
  
  let cleanHtml = html
    .replace(/<script[^>]*cloudflareinsights[^>]*><\/script>/gi, '');

  // Extract all assets in HTML
  const assetRefs = html.match(/(?:src|href)="(\.\/assets\/[^"]+)"/g) || [];
  const filesToDownload = [];
  for (const ref of assetRefs) {
    const m = ref.match(/(?:src|href)="\.\/assets\/([^"]+)"/);
    if (m) filesToDownload.push(m[1]);
  }

  for (const f of filesToDownload) {
    const url = `https://winchxyz.github.io/celadon/assets/${f}`;
    console.log(`Downloading Celadon file: ${f}`);
    const dest = path.join(targetDir, 'assets', f);
    if (f.endsWith('.js') || f.endsWith('.css')) {
      let content = await fetchText(url);
      
      // Look for more assets in JS/CSS
      const matches = content.match(/['"](?:\.\/assets\/|assets\/)?([^'"]+\.(?:glb|gltf|bin|wasm|png|jpg|jpeg|svg|mp3|ogg|wav|hdr|exr|json|woff2?|ttf))['"]/gi) || [];
      for (const raw of matches) {
        const p = raw.replace(/['"]/g, '').replace(/^\.?\/?assets\//, '').replace(/^\.\//, '');
        if (!p.startsWith('http') && !p.startsWith('data:')) {
          const subUrl = `https://winchxyz.github.io/celadon/assets/${p}`;
          const subDest = path.join(targetDir, 'assets', p);
          try {
            await downloadFile(subUrl, subDest);
            console.log(`  Downloaded Celadon asset: ${p}`);
          } catch (e) {
            try {
              const rootUrl = `https://winchxyz.github.io/celadon/${p}`;
              await downloadFile(rootUrl, subDest);
              console.log(`  Downloaded Celadon asset (root): ${p}`);
            } catch (e2) {}
          }
        }
      }
      fs.writeFileSync(dest, content);
    } else {
      await downloadFile(url, dest);
    }
  }

  fs.writeFileSync(path.join(targetDir, 'index.html'), cleanHtml);
  console.log('Celadon saved successfully!');
}

async function scrapeCrumple() {
  console.log('\n=== [3/3] Scraping Crumple ===');
  const targetDir = path.join(__dirname, '..', 'public', 'games', 'crumple');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });

  const baseUrl = 'https://scannertechs.com/games/crumple/';
  const html = await fetchText(baseUrl);
  
  let cleanHtml = html
    .replace(/<script[^>]*cloudflareinsights[^>]*><\/script>/gi, '');

  // Extract all assets in HTML
  const assetRefs = html.match(/(?:src|href)="(\.\/assets\/[^"]+)"/g) || [];
  const filesToDownload = [];
  for (const ref of assetRefs) {
    const m = ref.match(/(?:src|href)="\.\/assets\/([^"]+)"/);
    if (m) filesToDownload.push(m[1]);
  }

  for (const f of filesToDownload) {
    const url = `https://scannertechs.com/games/crumple/assets/${f}`;
    console.log(`Downloading Crumple file: ${f}`);
    const dest = path.join(targetDir, 'assets', f);
    if (f.endsWith('.js') || f.endsWith('.css')) {
      let content = await fetchText(url);
      
      // Look for sub-assets
      const matches = content.match(/['"](?:\.\/assets\/|assets\/)?([^'"]+\.(?:glb|gltf|bin|wasm|png|jpg|jpeg|svg|mp3|ogg|wav|hdr|exr|json|woff2?|ttf))['"]/gi) || [];
      for (const raw of matches) {
        const p = raw.replace(/['"]/g, '').replace(/^\.?\/?assets\//, '').replace(/^\.\//, '');
        if (!p.startsWith('http') && !p.startsWith('data:')) {
          const subUrl = `https://scannertechs.com/games/crumple/assets/${p}`;
          const subDest = path.join(targetDir, 'assets', p);
          try {
            await downloadFile(subUrl, subDest);
            console.log(`  Downloaded Crumple asset: ${p}`);
          } catch (e) {
            try {
              const rootUrl = `https://scannertechs.com/games/crumple/${p}`;
              await downloadFile(rootUrl, subDest);
              console.log(`  Downloaded Crumple asset (root): ${p}`);
            } catch (e2) {}
          }
        }
      }
      fs.writeFileSync(dest, content);
    } else {
      await downloadFile(url, dest);
    }
  }

  fs.writeFileSync(path.join(targetDir, 'index.html'), cleanHtml);
  console.log('Crumple saved successfully!');
}

async function main() {
  try {
    await scrapeWaterRingToss();
    await scrapeCeladon();
    await scrapeCrumple();
    console.log('\nAll 3 games downloaded successfully!');
  } catch (err) {
    console.error('Scraping error:', err);
  }
}

main();
