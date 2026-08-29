const TAU = Math.PI * 2;

export function segDist2(ax, az, bx, bz, px, pz) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  let t = len2 > 1e-12 ? ((px - ax) * dx + (pz - az) * dz) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + t * dx - px, cz = az + t * dz - pz;
  return cx * cx + cz * cz;
}

export function wrapPi(a) {
  return a - Math.round(a / TAU) * TAU;
}
