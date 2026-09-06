const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const urlModule = require('url');

function fetchWithRedirect(initialUrl, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    function get(currentUrl, redirectsLeft) {
      if (redirectsLeft <= 0) {
        return reject(new Error('Too many redirects'));
      }
      const parsed = new URL(currentUrl);
      const protocol = parsed.protocol === 'http:' ? http : https;
      
      const req = protocol.get(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.aigameshare.com/'
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, currentUrl).href;
          console.log(`Redirecting to: ${redirectUrl}`);
          return get(redirectUrl, redirectsLeft - 1);
        }
        
        let chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            finalUrl: currentUrl,
            buffer: Buffer.concat(chunks),
            text: Buffer.concat(chunks).toString('utf8')
          });
        });
      });
      req.on('error', reject);
    }
    
    get(initialUrl, maxRedirects);
  });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function downloadGame(gameName, gameId) {
  console.log(`\n================== Fetching ${gameName} (${gameId}) ==================`);
  const sessionApi = `https://www.aigameshare.com/api/games/${gameId}/play-session`;
  const sessionRes = await fetchWithRedirect(sessionApi);
  
  console.log(`Final URL: ${sessionRes.finalUrl}`);
  console.log(`Status: ${sessionRes.statusCode}, size: ${sessionRes.buffer.length}`);
  
  const baseUrl = sessionRes.finalUrl.endsWith('/') ? sessionRes.finalUrl : sessionRes.finalUrl + '/';
  const outDir = path.join(__dirname, '..', 'public', 'games', gameName);
  ensureDir(outDir);
  
  // Save index.html
  let indexHtml = sessionRes.text;
  
  // Clean cloudflare insights and sdk
  indexHtml = indexHtml.replace(/<script[^>]*static\.cloudflareinsights\.com[^>]*><\/script>/gi, '');
  indexHtml = indexHtml.replace(/<script[^>]*\/sdk\/v0\.js[^>]*><\/script>/gi, '<script>window.AIGS={track:()=>{},reportScore:()=>{},gameOver:()=>{}};</script>');
  
  fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);
  console.log(`Saved index.html (${indexHtml.length} bytes)`);
  
  // Extract all src and href resources
  const assetRegex = /(?:src|href|url)\s*=\s*["']([^"']+)["']/gi;
  let match;
  const assets = new Set();
  while ((match = assetRegex.exec(sessionRes.text)) !== null) {
    const assetPath = match[1];
    if (!assetPath.startsWith('http') && !assetPath.startsWith('data:') && !assetPath.startsWith('#') && !assetPath.startsWith('//')) {
      assets.add(assetPath.replace(/^\/+/, ''));
    }
  }
  
  // Also scan for JS imports / relative files
  console.log('Found assets:', Array.from(assets));
  
  for (const relPath of assets) {
    const fileUrl = new URL(relPath, baseUrl).href;
    try {
      const fileRes = await fetchWithRedirect(fileUrl);
      if (fileRes.statusCode === 200) {
        const destPath = path.join(outDir, relPath);
        ensureDir(path.dirname(destPath));
        fs.writeFileSync(destPath, fileRes.buffer);
        console.log(`Downloaded: ${relPath} (${fileRes.buffer.length} bytes)`);
        
        // If it's a JS file or CSS file, scan for further sub-imports
        if (relPath.endsWith('.js') || relPath.endsWith('.css')) {
          const subText = fileRes.text;
          const subMatches = subText.matchAll(/(?:from\s*['"]|import\s*['"]|import\s*\(['"]|src:\s*['"]|url\(['"]?)([^'")]+\.(?:js|png|webp|jpg|mp3|ogg|wav|json))['")]?/gi);
          for (const sm of subMatches) {
            const subRel = sm[1];
            if (!subRel.startsWith('http') && !subRel.startsWith('data:')) {
              const resolvedRel = path.normalize(path.join(path.dirname(relPath), subRel)).replace(/\\/g, '/');
              if (!assets.has(resolvedRel)) {
                assets.add(resolvedRel);
                console.log(`Found sub-asset: ${resolvedRel}`);
                try {
                  const subUrl = new URL(resolvedRel, baseUrl).href;
                  const subFileRes = await fetchWithRedirect(subUrl);
                  if (subFileRes.statusCode === 200) {
                    const subDest = path.join(outDir, resolvedRel);
                    ensureDir(path.dirname(subDest));
                    fs.writeFileSync(subDest, subFileRes.buffer);
                    console.log(`Downloaded sub-asset: ${resolvedRel} (${subFileRes.buffer.length} bytes)`);
                  }
                } catch (e) {
                  console.warn(`Failed sub-asset ${resolvedRel}:`, e.message);
                }
              }
            }
          }
        }
      } else {
        console.warn(`Failed ${relPath} status: ${fileRes.statusCode}`);
      }
    } catch (e) {
      console.warn(`Error downloading ${relPath}:`, e.message);
    }
  }
  
  // Download thumbnail from aigameshare.com if available
  try {
    const thumbRes = await fetchWithRedirect(`https://www.aigameshare.com/games/${gameName}/thumbnail.png`);
    if (thumbRes.statusCode === 200) {
      fs.writeFileSync(path.join(outDir, 'thumbnail.png'), thumbRes.buffer);
      console.log(`Saved thumbnail.png (${thumbRes.buffer.length} bytes)`);
    }
  } catch (e) {
    console.log('No direct thumbnail.png on main domain');
  }
}

async function run() {
  await downloadGame('volta', 'g-bdbf6a2c');
  await downloadGame('scribble-jump', 'g-sj-0001');
}

run().catch(console.error);
