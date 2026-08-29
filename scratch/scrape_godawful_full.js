const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'public', 'games', 'godawful');
const base = 'https://godawful.vercel.app/';

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
        return reject(new Error(`HTTP ${res.statusCode}`));
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

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Failed ${url}: ${res.statusCode}`));
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function runQueue(urls, concurrency = 16) {
  let index = 0;
  let success = 0;
  let failed = 0;

  async function worker() {
    while (index < urls.length) {
      const item = urls[index++];
      const dest = path.join(targetDir, item);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        success++;
        continue;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        await download(base + encodeURI(item), dest);
        success++;
        if (success % 20 === 0 || success === urls.length) {
          console.log(`Progress: ${success}/${urls.length} downloaded (${item})`);
        }
      } catch (e) {
        failed++;
        console.error(`Failed: ${item} (${e.message})`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  console.log(`Finished: ${success} success, ${failed} failed.`);
}

async function main() {
  console.log('Fetching manifests...');
  
  // 1. Models manifest
  const modelsDest = path.join(targetDir, 'models', 'manifest.json');
  fs.mkdirSync(path.dirname(modelsDest), { recursive: true });
  await download(base + 'models/manifest.json', modelsDest);
  const modelsJson = JSON.parse(fs.readFileSync(modelsDest, 'utf8'));

  // 2. Audio manifest
  const audioDest = path.join(targetDir, 'audio', 'v06', 'manifest.json');
  fs.mkdirSync(path.dirname(audioDest), { recursive: true });
  await download(base + 'audio/v06/manifest.json', audioDest);
  const audioJson = JSON.parse(fs.readFileSync(audioDest, 'utf8'));

  // 3. UI Portraits manifest
  const portraitsDest = path.join(targetDir, 'ui', 'portraits', 'manifest.json');
  fs.mkdirSync(path.dirname(portraitsDest), { recursive: true });
  await download(base + 'ui/portraits/manifest.json', portraitsDest);
  const portraitsJson = JSON.parse(fs.readFileSync(portraitsDest, 'utf8'));

  const fileList = new Set();

  // Add all 3D models
  if (modelsJson.models) {
    for (const m of modelsJson.models) {
      if (m.path) fileList.add(m.path);
    }
  }

  // Add all audio files
  if (audioJson.sounds) {
    for (const s of Object.values(audioJson.sounds)) {
      if (Array.isArray(s.files)) {
        s.files.forEach(f => fileList.add(f));
      }
    }
  }

  // Add all portraits
  for (const p of Object.values(portraitsJson)) {
    if (p.src) fileList.add(p.src);
    if (p.src2x) fileList.add(p.src2x);
  }

  console.log(`Total files to download from manifests: ${fileList.size}`);
  await runQueue([...fileList], 20);
}

main().catch(console.error);
