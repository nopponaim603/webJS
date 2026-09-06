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

async function scrapeSilentViper() {
  console.log('--- Scraping SILENT VIPER ---');
  const targetDir = path.join(__dirname, '..', 'public', 'games', 'silent-viper');
  const base = 'https://gimugames.com/games/silent-viper/';

  // 1. Download HTML
  let html = await fetchText(base);
  
  // Remove google tag manager and telemetry to make it clean & fast offline
  html = html.replace(/<script>[\s\S]*?googletagmanager[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script>[\s\S]*?__GG_SLUG__[\s\S]*?<\/script>/gi, '');

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  console.log('Saved index.html');

  // 2. Main bundles and styles
  const assetsToDownload = [
    'assets/index-Dcqg96zk.js',
    'assets/three-DeYduSKo.js',
    'assets/index-BySPd-3i.css',
    'assets/Click-uImgn2Ye.mp3',
    'assets/failure-CjE8vo4n.mp3',
    'assets/GlassBreake-DyO2SVa2.mp3',
    'assets/NewStage-BUqWXoXj.mp3',
    'assets/Shoot-BLGQBli7.mp3',
    'assets/Tension-CMK6on2F.mp3'
  ];

  for (const rel of assetsToDownload) {
    const dest = path.join(targetDir, rel);
    try {
      await download(base + rel, dest);
      console.log('Downloaded:', rel);
    } catch (e) {
      console.error('Error downloading:', rel, e.message);
    }
  }

  // 3. Download thumbnail from gimugames
  const thumbUrl = 'https://gimugames.com/thumbs/silent-viper-v14.webp';
  const thumbDest = path.join(targetDir, 'thumbnail.webp');
  try {
    await download(thumbUrl, thumbDest);
    console.log('Downloaded thumbnail:', thumbDest);
  } catch (e) {
    console.error('Error downloading thumbnail:', e.message);
  }

  console.log('SILENT VIPER scraping completed.');
}

scrapeSilentViper();
