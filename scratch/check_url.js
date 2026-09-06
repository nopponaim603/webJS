const fs = require('fs');
const text = fs.readFileSync('public/games/coin-pusher-3d-copper-cascade/releases/1.2.2-1550b4b918f99305/vendor/rapier-0.19.0.mjs', 'utf8');
const idx = text.indexOf('rapier_wasm3d_bg.wasm');
console.log(text.slice(idx - 60, idx + 100));
