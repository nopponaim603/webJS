const masks = new Map();

// The alpha a decal was drawn with, read once into a grid: the shape on the
// floor, in a form a hit test can ask about. Cached per texture — the textures
// are built once at load and never repainted.
export function maskOf(tex, size = 96) {
  let m = masks.get(tex);
  if (m) return m;

  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d');
  g.drawImage(tex.image, 0, 0, size, size);

  const px = g.getImageData(0, 0, size, size).data;
  const a = new Uint8Array(size * size);
  for (let i = 0; i < a.length; i++) a[i] = px[i * 4 + 3];

  m = { size, a };
  masks.set(tex, m);
  return m;
}

// `u` and `v` run -1 to 1 across the quad, the way a plane's own coordinates do.
// Outside that is outside the decal, which is the common case and answered
// first.
export function alphaAt(m, u, v) {
  if (u < -1 || u > 1 || v < -1 || v > 1) return 0;
  const x = Math.min(m.size - 1, (((u + 1) / 2) * m.size) | 0);
  const y = Math.min(m.size - 1, (((1 - v) / 2) * m.size) | 0);
  return m.a[y * m.size + x];
}
