const https = require('https');
const fs = require('fs');

const baseUrl = 'https://play.aigameshare.com/s/v1.1788700358.v7sql8grWMryzuDQiRcgcnoQ8akWZgPBPO9poj9TKlM/g/g-boat-roguelite-driftwake-0001/';
const jsUrl = baseUrl + 'releases/2.4.0-88a05957bf782f43/main.js';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function checkAsset(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, length: parseInt(res.headers['content-length'] || '0', 10), type: res.headers['content-type'] });
    }).on('error', () => resolve({ status: 500 }));
  });
}

async function run() {
  const visited = new Set();
  const files = [
    'main.js',
    'sim.js',
    'armament.js',
    'render.js',
    'vendor/three.module.min.js',
    'assets/hero-ship.json',
    'audio.js',
    'styles.css'
  ];

  const candidateAssets = new Set([
    'assets/upgrades-atlas.webp',
    'assets/hero-ship.json'
  ]);

  for (const f of files) {
    const fileUrl = baseUrl + 'releases/2.4.0-88a05957bf782f43/' + f;
    const { status, data } = await get(fileUrl);
    if (status === 200) {
      // Find anything like path/name.ext or strings in quotes
      const matches = data.match(/['"`]([a-zA-Z0-9_\-\./]+\.(?:webp|png|jpg|jpeg|svg|mp3|ogg|wav|json|glb|gltf|woff2?|ttf|css|js))['"`]/gi) || [];
      for (const m of matches) {
        const clean = m.replace(/['"`]/g, '').replace(/^\.\//, '');
        if (!clean.startsWith('http') && !clean.startsWith('//')) {
          candidateAssets.add(clean);
        }
      }
    }
  }

  console.log('Candidate assets:', Array.from(candidateAssets));

  for (const asset of candidateAssets) {
    const assetUrl = baseUrl + 'releases/2.4.0-88a05957bf782f43/' + asset;
    const info = await checkAsset(assetUrl);
    console.log(`Asset: ${asset} -> Status: ${info.status} (${info.type}, ${info.length}b)`);
    
    // Also check relative to root
    if (info.status !== 200) {
      const rootUrl = baseUrl + asset;
      const rootInfo = await checkAsset(rootUrl);
      console.log(`  Root test: ${asset} -> Status: ${rootInfo.status} (${rootInfo.type}, ${rootInfo.length}b)`);
    }
  }
}

run();
