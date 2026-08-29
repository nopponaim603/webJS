import * as THREE from 'three';

let TEX = null;

function texture() {
  if (TEX) return TEX;
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);

  grd.addColorStop(0.00, 'rgba(255,255,255,1)');
  grd.addColorStop(0.12, 'rgba(255,255,255,0.75)');
  grd.addColorStop(0.32, 'rgba(255,255,255,0.28)');
  grd.addColorStop(0.62, 'rgba(255,255,255,0.07)');
  grd.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  TEX = new THREE.CanvasTexture(cv);
  return TEX;
}

export function attachGlow(group, type, span, height) {
  if (!type.glow) return null;
  const sprite = makeGlow(type.glow.color, span * type.glow.size, 1);
  sprite.position.set(0, height * 0.45, -span * 0.32);
  group.add(sprite);
  return sprite;
}

export function makeGlow(color, size, opacity = 0.9) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  sprite.scale.setScalar(size);
  return sprite;
}
