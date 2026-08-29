export function canvasTex(THREE, fn, w = 256, h = 256) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function rust(g, x, y, r, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(122,62,28,${a})`);
  gr.addColorStop(1, 'rgba(80,40,20,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r, 0, 7);
  g.fill();
  for (let i = 0; i < 5; i++) {
    g.fillStyle = `rgba(140,70,30,${a * 0.5 * Math.random()})`;
    g.fillRect(x + (Math.random() - 0.5) * r, y + Math.random() * r, 2, 5 + Math.random() * 12);
  }
}

export function brushed(g, w, h, base) {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) {
    g.strokeStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    const y = Math.random() * h;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y + (Math.random() - 0.5) * 3);
    g.stroke();
  }
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.09})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  for (let i = 0; i < 5; i++) {
    rust(g, Math.random() * w, Math.random() * h, 12 + Math.random() * 24, 0.55);
  }
}

export function hazardStripes(g, w, h) {
  g.fillStyle = '#c9a227';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#15161a';
  for (let x = -h; x < w + h; x += 40) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 20, 0);
    g.lineTo(x + 20 - h, h);
    g.lineTo(x - h, h);
    g.closePath();
    g.fill();
  }
  for (let i = 0; i < 3; i++) {
    rust(g, Math.random() * w, Math.random() * h, 8 + Math.random() * 12, 0.5);
  }
}

export function makeMaterials(THREE, {
  metal = '#8a929a', dark = '#646b72', led = [0x073a44, 0x00e5ff],
} = {}) {
  return {
    metal: new THREE.MeshStandardMaterial({
      map: canvasTex(THREE, (g, w, h) => brushed(g, w, h, metal)),
      metalness: 0.5, roughness: 0.55,
    }),
    dark: new THREE.MeshStandardMaterial({
      map: canvasTex(THREE, (g, w, h) => brushed(g, w, h, dark)),
      metalness: 0.55, roughness: 0.6,
    }),
    hazard: new THREE.MeshStandardMaterial({
      map: canvasTex(THREE, hazardStripes, 512, 64),
      metalness: 0.4, roughness: 0.65,
    }),
    led: new THREE.MeshStandardMaterial({ color: led[0], emissive: led[1],
                                          emissiveIntensity: 1.4, metalness: 0.2, roughness: 0.4 }),
    beacon: new THREE.MeshStandardMaterial({ color: 0x330a0a, emissive: 0xff2222,
                                             emissiveIntensity: 1.4, metalness: 0.2, roughness: 0.4 }),
    soil: new THREE.MeshStandardMaterial({
      map: canvasTex(THREE, soilPaint), metalness: 0, roughness: 1,
    }),
  };
}

function soilPaint(g, w, h) {
  g.fillStyle = '#4c4e43';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(${90 + (Math.random() * 30 | 0)},${85 + (Math.random() * 25 | 0)},60,0.08)`;
    g.beginPath();
    g.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 18, 0, 7);
    g.fill();
  }
}

export function chamferBox(THREE, w, h, d, c = 0.02) {
  const cc = Math.min(c, w * 0.2, h * 0.2, d * 0.2);
  const hw = w / 2 - cc;
  const hh = h / 2 - cc;
  const s = new THREE.Shape();
  s.moveTo(-hw, -hh);
  s.lineTo(hw, -hh);
  s.lineTo(hw, hh);
  s.lineTo(-hw, hh);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d - 2 * cc, bevelEnabled: true, bevelThickness: cc, bevelSize: cc,
    bevelSegments: 1, curveSegments: 1,
  });
  g.translate(0, 0, -(d - 2 * cc) / 2);
  return g;
}

export function ringSeg(THREE, rIn, rOut, a0, a1, depth) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, a0, a1, false);
  s.absarc(0, 0, rIn, a1, a0, true);
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02,
    bevelSegments: 1, curveSegments: 10,
  });
  g.rotateX(-Math.PI / 2);
  return g;
}
