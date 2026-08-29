const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'public', 'games', 'survive-10-waves');
const base = 'https://www.survive10waves.com/';

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

function findReferencesInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileRel = path.relative(targetDir, filePath).replace(/\\/g, '/');
  const fileDir = path.dirname(fileRel);
  const refs = [];

  // 1. import ... from '...' and export ... from '...'
  const moduleMatches = [
    ...content.matchAll(/(?:import|export)\s+(?:[^'"]*from\s+)?['"]([^'"]+)['"]/g),
    ...content.matchAll(/import\(['"]([^'"]+)['"]\)/g)
  ];

  for (const m of moduleMatches) {
    let spec = m[1];
    if (spec === 'three') {
      refs.push('vendor/three/three.module.js');
    } else if (spec.startsWith('three/addons/')) {
      refs.push('vendor/three/addons/' + spec.slice('three/addons/'.length));
    } else if (spec.startsWith('./') || spec.startsWith('../')) {
      const resolved = path.normalize(path.join(fileDir, spec)).replace(/\\/g, '/');
      refs.push(resolved);
    }
  }

  // 2. String paths like 'assets/...', 'models/...', 'src/...', 'sounds/...', 'music/...'
  const stringMatches = [
    ...content.matchAll(/['"]((?:assets|models|sounds|music|src|vendor)\/[^'"]+\.[a-zA-Z0-9]+)['"]/g)
  ];

  for (const m of stringMatches) {
    let spec = m[1].replace(/^\.?\//, '');
    if (!spec.includes('${') && !spec.startsWith('http')) {
      refs.push(spec);
    }
  }

  return refs;
}

async function main() {
  console.log('--- Scanning SURVIVE 10 WAVES for all missing files ---');
  let iteration = 0;

  while (true) {
    iteration++;
    console.log(`\nScan iteration #${iteration}...`);
    
    // Find all files currently on disk
    const allFiles = [];
    function walk(d) {
      for (const f of fs.readdirSync(d)) {
        const full = path.join(d, f);
        if (fs.statSync(full).isDirectory()) walk(full);
        else allFiles.push(full);
      }
    }
    walk(targetDir);

    const neededRefs = new Set();
    for (const f of allFiles) {
      if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css') || f.endsWith('.json')) {
        const refs = findReferencesInFile(f);
        refs.forEach(r => neededRefs.add(r));
      }
    }

    const missing = [];
    for (const r of neededRefs) {
      const dest = path.join(targetDir, r);
      if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
        missing.push(r);
      }
    }

    console.log(`Found ${neededRefs.size} total referenced files. Missing: ${missing.length}`);
    if (missing.length === 0) {
      console.log('🎉 No more missing files! SURVIVE 10 WAVES is completely self-contained.');
      break;
    }

    for (const m of missing) {
      const dest = path.join(targetDir, m);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        await download(base + encodeURI(m), dest);
        console.log('✅ Downloaded:', m);
      } catch (e) {
        console.error('❌ Failed:', m, e.message);
      }
    }
  }
}

main().catch(console.error);
