const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'public', 'games', 'attack-agi');
const chunksDir = path.join(baseDir, '_next', 'static', 'immutable', 'chunks');

const oldName = '3semvlrhj63l1.js';
const newName = '3semvlrhj63l1_v2.js';

// Rename file
const oldPath = path.join(chunksDir, oldName);
const newPath = path.join(chunksDir, newName);
if (fs.existsSync(oldPath)) {
  fs.renameSync(oldPath, newPath);
  console.log('Renamed', oldName, 'to', newName);
}

// Update turbopack
const turboPath = path.join(chunksDir, 'turbopack-09ib0bp5dbqe3.js');
let turboCode = fs.readFileSync(turboPath, 'utf8');
turboCode = turboCode.replaceAll('3semvlrhj63l1.js', '3semvlrhj63l1_v2.js');
fs.writeFileSync(turboPath, turboCode, 'utf8');
console.log('Updated turbopack with new chunk name');

// Update index.html
const indexPath = path.join(baseDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replaceAll('3semvlrhj63l1.js', '3semvlrhj63l1_v2.js');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Updated index.html with new chunk name');
