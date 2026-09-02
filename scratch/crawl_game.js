const fs = require('fs');
const path = require('path');

const baseUrl = 'https://iskra.graphics';
const visited = new Set();
const toVisit = ['/404', '/overprint/src/main.js'];

async function crawl() {
  const allFiles = new Map();

  while (toVisit.length > 0) {
    const relativeUrl = toVisit.pop();
    if (visited.has(relativeUrl)) continue;
    visited.add(relativeUrl);

    try {
      const fullUrl = baseUrl + (relativeUrl.startsWith('/') ? relativeUrl : '/' + relativeUrl);
      console.log('Fetching:', fullUrl);
      const res = await fetch(fullUrl);
      if (!res.ok) {
        console.error('Failed:', fullUrl, res.status);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      allFiles.set(relativeUrl, buffer);

      if (relativeUrl.endsWith('.js') || relativeUrl.endsWith('.html') || relativeUrl === '/404') {
        const text = buffer.toString('utf-8');
        
        // Find JS imports
        const importRegex = /(?:from\s+['"]([^'"]+)['"]|import\s*\(['"]([^'"]+)['"]\))/g;
        let match;
        while ((match = importRegex.exec(text)) !== null) {
          const target = match[1] || match[2];
          if (!target) continue;
          let resolved = '';
          if (target.startsWith('.')) {
            resolved = path.posix.normalize(path.posix.dirname(relativeUrl) + '/' + target);
          } else if (target.startsWith('/')) {
            resolved = target;
          }
          if (resolved && !visited.has(resolved)) {
            toVisit.push(resolved);
          }
        }

        // Find assets regex
        const assetRegex = /['"]([^'"]+\.(?:mp3|wav|ogg|png|jpg|jpeg|svg|json|wasm|ttf|woff2?|vert|frag|glsl))['"]/g;
        while ((match = assetRegex.exec(text)) !== null) {
          const target = match[1];
          if (!target || target.startsWith('http')) continue;
          let resolved = '';
          if (target.startsWith('.')) {
            resolved = path.posix.normalize(path.posix.dirname(relativeUrl) + '/' + target);
          } else if (target.startsWith('/')) {
            resolved = target;
          } else {
            resolved = path.posix.normalize(path.posix.dirname(relativeUrl) + '/' + target);
          }
          if (resolved && !visited.has(resolved)) {
            toVisit.push(resolved);
          }
        }

        // Find any other script/link/image refs
        const htmlRegex = /(?:src|href)=['"]([^'"]+)['"]/g;
        while ((match = htmlRegex.exec(text)) !== null) {
          const target = match[1];
          if (target && target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/api')) {
            if (!visited.has(target)) toVisit.push(target);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching', relativeUrl, err.message);
    }
  }

  console.log('Discovery completed. Total downloaded files:', allFiles.size);
  for (const [filePath, buf] of allFiles.entries()) {
    console.log(`- ${filePath} (${buf.length} bytes)`);
  }
}

crawl();
