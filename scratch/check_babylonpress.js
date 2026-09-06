const https = require('https');

function check(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ url, status: res.statusCode, length: data.length, data }));
    }).on('error', err => resolve({ url, error: err.message }));
  });
}

async function run() {
  const res1 = await check('https://babylonpress.org/');
  console.log('babylonpress.org:', res1.status, res1.error, res1.length);
  if (res1.data) {
    console.log(res1.data.slice(0, 500));
  }
}

run();
