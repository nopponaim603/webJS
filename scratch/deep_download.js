const https = require('https');
const fs = require('fs');
const path = require('path');

const games = [
  {
    slug: 'coin-pusher-3d-copper-cascade',
    gameId: 'g-coin-pusher-3d-copper-cascade-0001'
  },
  {
    slug: 'dragon-roguelite-skywake',
    gameId: 'g-dragon-roguelite-skywake-0001'
  },
  {
    slug: 'grapple-knight-storm-siege',
    gameId: 'g-grapple-knight-storm-siege-0001'
  },
  {
    slug: 'ink-warden',
    gameId: 'g-ink-warden-0001'
  }
];

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      let chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve({ status: res.statusCode, data: Buffer.concat(chunks), headers: res.headers }));
    }).on('error', reject);
  });
}

function getSessionUrl(gameId) {
  return new Promise((resolve, reject) => {
    https.get(`https://www.aigameshare.com/api/games/${gameId}/play-session`, (res) => {
      if (res.headers.location) {
        resolve(res.headers.location);
      } else {
        reject(new Error('No redirect location for ' + gameId));
      }
    }).on('error', reject);
  });
}

function extractImports(code) {
  const imports = [];
  // match import ... from '...' and import '...'
  const fromMatches = code.matchAll(/from\s*['"]([^'"]+)['"]/g);
  for (const m of fromMatches) imports.push(m[1]);
  const bareMatches = code.matchAll(/import\s*['"]([^'"]+)['"]/g);
  for (const m of bareMatches) imports.push(m[1]);
  return Array.from(new Set(imports));
}

async function downloadRecursive(sessionBaseUrl, targetDir, currentRelFile, visited = new Set()) {
  if (visited.has(currentRelFile)) return;
  visited.add(currentRelFile);

  const cleanRel = currentRelFile.startsWith('./') ? currentRelFile.slice(2) : currentRelFile.startsWith('/') ? currentRelFile.slice(1) : currentRelFile;
  const fileUrl = new URL(currentRelFile, sessionBaseUrl).toString();
  console.log(`Downloading: ${cleanRel} from ${fileUrl}`);

  const res = await fetchBuffer(fileUrl);
  if (res.status !== 200) {
    console.error(`Failed ${cleanRel}: status ${res.status}`);
    return;
  }

  const dest = path.join(targetDir, cleanRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, res.data);
  console.log(`Saved ${cleanRel} (${res.data.length} bytes)`);

  if (cleanRel.endsWith('.js')) {
    const code = res.data.toString('utf8');
    const imports = extractImports(code);
    for (const imp of imports) {
      if (!imp.startsWith('http') && !imp.startsWith('data:')) {
        // Resolve relative to current file's directory
        const nextRel = path.posix.join(path.posix.dirname(cleanRel), imp);
        await downloadRecursive(sessionBaseUrl, targetDir, nextRel, visited);
      }
    }
  }
}

async function main() {
  for (const item of games) {
    console.log(`\n================ Checking & Deep Downloading ${item.slug} ================`);
    const targetDir = path.join(__dirname, '..', 'public', 'games', item.slug);
    const sessionUrl = await getSessionUrl(item.gameId);
    console.log(`Session URL: ${sessionUrl}`);

    const indexRes = await fetchBuffer(sessionUrl);
    const html = indexRes.data.toString('utf8');
    const scriptMatches = Array.from(html.matchAll(/src="([^"]+)"/g)).map(m => m[1]);
    const linkMatches = Array.from(html.matchAll(/href="([^"]+)"/g)).map(m => m[1]);

    const entryAssets = [...scriptMatches, ...linkMatches].filter(u => {
      return !u.startsWith('http') && !u.startsWith('data:') && u !== '/sdk/v0.js';
    });

    const visited = new Set();
    for (const asset of entryAssets) {
      await downloadRecursive(sessionUrl, targetDir, asset, visited);
    }
  }
  console.log('\nAll games deep downloaded successfully!');
}

main();
