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
  const code1 = await fetchText('https://attackagi.lucasbai.com/_next/static/immutable/chunks/08vz7z_kx2jli.js');
  console.log('AudioContext found in 08vz7z:', code1.includes('AudioContext'));
  console.log('GLTFLoader in 08vz7z:', code1.includes('GLTFLoader'));
  console.log('BoxGeometry in 08vz7z:', code1.includes('BoxGeometry'));
  const m1 = code1.match(/["'][^"']+\.(?:mp3|wav|ogg|glb|gltf|png|jpg|webp)["']/g);
  console.log('Literals in 08vz7z:', m1);

  const code2 = await fetchText('https://attackagi.lucasbai.com/_next/static/immutable/chunks/12nl8lmfu0g_h.js');
  console.log('AudioContext found in 12nl:', code2.includes('AudioContext'));
  console.log('GLTFLoader in 12nl:', code2.includes('GLTFLoader'));
  console.log('BoxGeometry in 12nl:', code2.includes('BoxGeometry'));
  const m2 = code2.match(/["'][^"']+\.(?:mp3|wav|ogg|glb|gltf|png|jpg|webp)["']/g);
  console.log('Literals in 12nl:', m2);
}

run();
