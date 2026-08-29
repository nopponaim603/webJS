// The ground a trap claims, drawn once as a soft-edged shape: a hand-drawn
// wobble and a blurred rim read as scorched earth, where a clean circle reads
// as a decal.
export function wobble(rnd, amp) {
  const H = [2, 3, 5, 7].map((k) => ({ k, a: amp * (0.4 + rnd() * 0.9), ph: rnd() * 7 }));
  return (t) => H.reduce((r, h) => r + h.a * Math.sin(t * h.k + h.ph), 1);
}

// Blurred onto a clean canvas, not over itself: compositing a blurred copy on
// top of the sharp original leaves the hard edge showing through.
export function softly(cv, g, blur) {
  if (g.filter === undefined) return;
  const copy = document.createElement('canvas');
  copy.width = cv.width;
  copy.height = cv.height;
  copy.getContext('2d').drawImage(cv, 0, 0);

  g.clearRect(0, 0, cv.width, cv.height);
  g.filter = `blur(${blur}px)`;
  g.drawImage(copy, 0, 0);
  g.filter = 'none';
}

// Every cell count must divide the square, or the field will not wrap.
export function fieldOf(rnd, cells) {
  const grids = cells.map((n) => {
    const g = new Float32Array(n * n);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    return { n, g };
  });
  const ease = (t) => t * t * (3 - 2 * t);
  return (u, v) => {
    let sum = 0, total = 0, amp = 1;
    for (const { n, g } of grids) {
      const fx = u * n, fy = v * n;
      const ix = Math.floor(fx), iy = Math.floor(fy);
      const x0 = ((ix % n) + n) % n, y0 = ((iy % n) + n) % n;
      const x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
      const tx = ease(fx - ix), ty = ease(fy - iy);
      const a = g[y0 * n + x0] + (g[y0 * n + x1] - g[y0 * n + x0]) * tx;
      const b = g[y1 * n + x0] + (g[y1 * n + x1] - g[y1 * n + x0]) * tx;
      sum += (a + (b - a) * ty) * amp;
      total += amp;
      amp *= 0.5;
    }
    return sum / total;
  };
}
