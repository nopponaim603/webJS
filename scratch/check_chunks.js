const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const turbo = await fetchText('https://attackagi.lucasbai.com/_next/static/immutable/chunks/turbopack-09ib0bp5dbqe3.js');
  // find createElement or src or chunks
  const scriptRegex = /createElement\(['"]script['"]\)[^;]+;/g;
  console.log('script creation:', turbo.match(scriptRegex));
  
  // check where static/immutable/chunks is referenced
  let pos = 0;
  while ((pos = turbo.indexOf('static/', pos)) !== -1) {
    console.log('static/ found at:', turbo.slice(Math.max(0, pos - 50), pos + 100));
    pos += 7;
  }
}

run();
