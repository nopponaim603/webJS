const fs = require('fs');
const path = require('path');

const chunkFile = path.join(__dirname, '..', 'public', 'games', 'attack-agi', '_next', 'static', 'immutable', 'chunks', '3semvlrhj63l1.js');
let code = fs.readFileSync(chunkFile, 'utf8');

// Replace function l() with robust assetPrefix resolver
const origFuncRegex = /function l\(\)\{let e=document\.currentScript;if\(!\(e instanceof HTMLScriptElement\)\)[\s\S]*?return t\.slice\(0,n\)\}/;

if (origFuncRegex.test(code)) {
  code = code.replace(origFuncRegex, `function l(){
    try {
      let e = document.currentScript;
      if (e && e.src && e.src.indexOf('/_next/') !== -1) {
        let t = new URL(e.src).pathname;
        let n = t.indexOf('/_next/');
        return t.slice(0, n);
      }
      return location.pathname.replace(/\\/[^\\/]*$/, '');
    } catch(err) {
      return '';
    }
  }`);
  fs.writeFileSync(chunkFile, code, 'utf8');
  console.log('Replaced function l() in 3semvlrhj63l1.js');
} else {
  console.log('origFuncRegex did not match!');
}

// Ensure index.html sets TURBOPACK_CHUNK_BASE_PATH to "./_next/" or current dir
const indexFile = path.join(__dirname, '..', 'public', 'games', 'attack-agi', 'index.html');
let html = fs.readFileSync(indexFile, 'utf8');

// Let's add a cache-buster query string to script tags in index.html to avoid browser cache
html = html.replace(/(src="(\.\/_next\/[^"]+\.js))(")/g, '$1?v=' + Date.now() + '$3');
fs.writeFileSync(indexFile, html, 'utf8');
console.log('Updated index.html with cache buster.');
