// Unseeded, unlike rngFrom: these are rolled as play runs.
export const between = ([lo, hi]) => lo + Math.random() * (hi - lo);

export function rngFrom(seed) {
  let a = seed * 1831565813 + 1;
  return () => {
    a = Math.imul(a ^ (a >>> 15), 1 | a);
    a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a;
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  };
}
