const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  const html = await fetchText('https://geeks.babylonpress.org/');
  const css = await fetchText('https://geeks.babylonpress.org/assets/index-BnBQIIXY.css');
  const js = await fetchText('https://geeks.babylonpress.org/assets/index-nlXe0FiO.js');

  console.log('HTML length:', html.length);
  console.log('CSS length:', css.length);
  console.log('JS length:', js.length);

  console.log('Does JS have "/assets"?', js.includes('/assets'));
  console.log('Does CSS have "/assets" or "url"?', css.includes('/assets'), css.includes('url('));

  // Let's create public/games/geeks-vs-zombies
  const targetDir = path.join(__dirname, '../public/games/geeks-vs-zombies');
  const assetsDir = path.join(targetDir, 'assets');

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Update HTML to use relative paths ./assets/
  const updatedHtml = html
    .replace('src="/assets/', 'src="./assets/')
    .replace('href="/assets/', 'href="./assets/');

  fs.writeFileSync(path.join(targetDir, 'index.html'), updatedHtml, 'utf8');
  fs.writeFileSync(path.join(assetsDir, 'index-BnBQIIXY.css'), css, 'utf8');
  fs.writeFileSync(path.join(assetsDir, 'index-nlXe0FiO.js'), js, 'utf8');

  console.log('Successfully saved to:', targetDir);
}

run().catch(console.error);
