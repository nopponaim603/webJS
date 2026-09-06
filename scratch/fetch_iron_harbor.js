const https = require('https');
const fs = require('fs');
const path = require('path');

function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    }).on('error', reject);
  });
}

async function test() {
  const url1 = 'https://8faca679-5d6d-4108-9ec9-de0e120a28a2.frame.claudeusercontent.com/';
  const res1 = await fetch(url1);
  console.log('Frame URL status:', res1.status, 'len:', res1.data.length);
  fs.writeFileSync(path.join(__dirname, 'iron_harbor.html'), res1.data);

  const url2 = 'https://claude.ai/api/frame/8faca679-5d6d-4108-9ec9-de0e120a28a2';
  const res2 = await fetch(url2, { 'Referer': 'https://claude.ai/code/artifact/8faca679-5d6d-4108-9ec9-de0e120a28a2' });
  console.log('API frame status:', res2.status, 'len:', res2.data.length);
  if (res2.status === 200) {
    fs.writeFileSync(path.join(__dirname, 'iron_harbor_api.json'), res2.data);
  }
}

test().catch(console.error);
