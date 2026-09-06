const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const targetDir = path.join(__dirname, '..', 'public', 'games', 'boat-roguelite-driftwake');
const baseUrl = 'https://play.aigameshare.com/s/v1.1788700358.v7sql8grWMryzuDQiRcgcnoQ8akWZgPBPO9poj9TKlM/g/g-boat-roguelite-driftwake-0001/';
const releasePrefix = 'releases/2.4.0-88a05957bf782f43/';

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
    req.setTimeout(20000, () => {
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

async function scrapeDriftwake() {
  console.log('=== Downloading Boat Roguelite: Driftwake ===');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'vendor'), { recursive: true });

  // 1. Fetch raw index.html
  console.log('Fetching index.html...');
  const rawHtml = await fetchText(baseUrl);
  
  // Clean index.html:
  // - Remove /sdk/v0.js if any or keep simple play-guard
  // - Remove cloudflare analytics beacon
  // - Adjust relative paths: ./releases/2.4.0-88a05957bf782f43/styles.css -> ./styles.css
  // - Adjust relative paths: ./releases/2.4.0-88a05957bf782f43/main.js -> ./main.js
  let cleanHtml = rawHtml
    .replace(/<script[^>]*data-aigameshare-sdk[^>]*><\/script>/gi, '')
    .replace(/<script[^>]*cloudflareinsights[^>]*><\/script>/gi, '')
    .replace(/\.\/releases\/2\.4\.0-[a-z0-9]+\/styles\.css/g, './styles.css')
    .replace(/\.\/releases\/2\.4\.0-[a-z0-9]+\/main\.js/g, './main.js');

  fs.writeFileSync(path.join(targetDir, 'index.html'), cleanHtml, 'utf8');
  console.log('Saved index.html');

  // 2. Download JS & CSS files
  const filesToDownload = [
    { remote: releasePrefix + 'styles.css', local: 'styles.css' },
    { remote: releasePrefix + 'main.js', local: 'main.js' },
    { remote: releasePrefix + 'sim.js', local: 'sim.js' },
    { remote: releasePrefix + 'render.js', local: 'render.js' },
    { remote: releasePrefix + 'audio.js', local: 'audio.js' },
    { remote: releasePrefix + 'armament.js', local: 'armament.js' },
    { remote: releasePrefix + 'vendor/three.module.min.js', local: 'vendor/three.module.min.js' },
    { remote: releasePrefix + 'assets/hero-ship.json', local: 'assets/hero-ship.json' },
    { remote: releasePrefix + 'assets/upgrades-atlas.webp', local: 'assets/upgrades-atlas.webp' }
  ];

  for (const item of filesToDownload) {
    const fileUrl = baseUrl + item.remote;
    const dest = path.join(targetDir, item.local);
    console.log(`Downloading ${item.local}...`);
    await downloadFile(fileUrl, dest);
  }

  // 3. Download Thumbnail/Cover
  console.log('Downloading cover thumbnail...');
  const thumbUrl = 'https://www.aigameshare.com/api/games/g-boat-roguelite-driftwake-0001-cover-v2/thumbnail?v=2026-09-06%2006%3A59%3A31';
  try {
    await downloadFile(thumbUrl, path.join(targetDir, 'thumbnail.webp'));
  } catch (err) {
    console.warn('Thumbnail download error:', err.message);
  }

  console.log('Driftwake downloaded successfully!');
}

scrapeDriftwake().catch(console.error);
