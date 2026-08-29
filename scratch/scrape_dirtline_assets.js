const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'public', 'games', 'dirtline');
const base = 'https://dirtline.pages.dev/';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        return download(redirectUrl, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      try { fs.unlinkSync(dest); } catch (_) {}
      reject(err);
    });
  });
}

async function main() {
  const parts = ["engine","exhaust","fender_front","fender_rear","frame","shock","skidplate","swingarm","tail","tank","wheel"];
  const env = ["barrel","barrel_striped","boulder","conifer_large","conifer_small","crate","creosote_bush","deadwood","dead_shrub","flag_banner","log_pile","prickly_pear","rail_hazard","rock_cluster","saguaro","stump","surface_rock","tarp_tent","timber","trestle_bent","yucca"];
  
  const files = [];
  parts.forEach(p => files.push(`assets/bike/${p}.glb`));
  files.push('assets/rider/rider.glb');
  env.forEach(e => files.push(`assets/env/${e}.glb`));
  files.push('assets/sky.jpg');
  files.push('assets/sky/sky.jpg');

  console.log(`Downloading ${files.length} DIRT LINE assets...`);

  for (const f of files) {
    const dest = path.join(targetDir, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    try {
      await download(base + f, dest);
      console.log('Downloaded:', f);
    } catch (e) {
      console.warn(`Failed ${f}: ${e.message}`);
    }
  }
}

main().then(() => console.log('DIRT LINE Assets Download Finished!'));
