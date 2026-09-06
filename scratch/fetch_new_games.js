const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    }).on('error', reject);
  });
}

async function main() {
  const games = ['volta', 'scribble-jump'];
  for (const game of games) {
    const res = await fetchUrl(`https://www.aigameshare.com/games/${game}`);
    console.log(`=== ${game} === status: ${res.status}`);
    fs.writeFileSync(path.join(__dirname, `${game}_page.html`), res.data);
    
    // Find game ID or play session URL
    const match = res.data.match(/\/api\/games\/([a-zA-Z0-9_-]+)\/play-session/) || res.data.match(/gameId["']?:\s*["']([^"']+)["']/);
    console.log(`${game} match:`, match ? match[0] : 'None');
  }
}

main().catch(console.error);
