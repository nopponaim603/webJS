const fs = require('fs');
const path = require('path');

function inspectJs(filePath, name) {
  console.log(`\n=== Inspecting ${name} ===`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Look for audio formats, models, images, fetch, font urls
  const extRegex = /['"][^'"]*?\.(mp3|ogg|wav|glb|gltf|bin|json|png|jpg|jpeg|webp|woff2|woff|ttf)['"]/gi;
  const matches = content.match(extRegex) || [];
  console.log('Referenced file assets:', Array.from(new Set(matches)));
  
  // Check for fetch / xhr
  const fetchRegex = /fetch\s*\(\s*['"][^'"]+['"]/gi;
  console.log('Fetch calls:', content.match(fetchRegex) || []);
  
  // Check for Web Audio API
  console.log('Has AudioContext:', /AudioContext|webkitAudioContext/i.test(content));
}

inspectJs(path.join(__dirname, '../public/games/water-ring-toss/assets/index-CE0Eqk-1.js'), 'Water Ring Toss');
inspectJs(path.join(__dirname, '../public/games/celadon/assets/index-ItWhrq6n.js'), 'Celadon');
inspectJs(path.join(__dirname, '../public/games/crumple/assets/index-DPhj8RWM.js'), 'Crumple');
