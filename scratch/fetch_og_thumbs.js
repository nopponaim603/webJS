const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchBuffer(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve);
      }
      if (res.statusCode !== 200) return resolve(null);
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
}

async function getThumbs() {
  const games = ['volta', 'scribble-jump'];
  for (const g of games) {
    const html = fs.readFileSync(path.join(__dirname, '..', 'scratch', `${g}_page.html`), 'utf8');
    const ogImg = html.match(/property="og:image"\s+content="([^"]+)"/i) || html.match(/name="twitter:image"\s+content="([^"]+)"/i);
    console.log(`${g} og:image:`, ogImg ? ogImg[1] : 'none');
    if (ogImg) {
      const buf = await fetchBuffer(ogImg[1]);
      if (buf) {
        fs.writeFileSync(path.join(__dirname, '..', 'public', 'games', g, 'thumbnail.png'), buf);
        console.log(`Saved thumbnail for ${g} (${buf.length} bytes)`);
      }
    }
  }
}

getThumbs().catch(console.error);
