const fs = require('fs');
const path = require('path');
const https = require('https');

const baseUrl = 'https://play.aigameshare.com/s/v1.1788700358.v7sql8grWMryzuDQiRcgcnoQ8akWZgPBPO9poj9TKlM/g/g-boat-roguelite-driftwake-0001/releases/2.4.0-88a05957bf782f43/';
const targetDir = path.join(__dirname, '..', 'public', 'games', 'boat-roguelite-driftwake', 'vendor');

function download(relPath) {
  return new Promise((resolve, reject) => {
    const url = baseUrl + relPath;
    const dest = path.join(targetDir, '..', relPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading vendor/three.core.min.js...');
  await download('vendor/three.core.min.js');
  console.log('Successfully saved vendor/three.core.min.js!');
  
  const content = fs.readFileSync(path.join(targetDir, 'three.core.min.js'), 'utf8');
  console.log('Length:', content.length);
  
  const imports = Array.from(content.matchAll(/from\s*['"]([^'"]+)['"]/g), m => m[1]);
  const dynamicImports = Array.from(content.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g), m => m[1]);
  console.log('Imports in three.core.min.js:', imports, dynamicImports);
}

main().catch(console.error);
