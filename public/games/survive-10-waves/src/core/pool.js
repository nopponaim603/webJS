// Pooled effects live in the scene whether or not they are being used, and the
// renderer's matrix walk does not care whether a thing is visible: it recomposes
// and remultiplies a matrix for every object it meets. With a horde on the field
// that is thirteen thousand idle sparks and splats being posed for nobody, which
// costs more than everything actually on screen. So an idle member takes itself
// off matrix duty and is put back on it when it is spawned.
//
// This only works because the scene itself is pinned — see engine/view.js. Three
// forces the whole walk if the root recomposes.
export function makePool(factory, reset) {
  const free = [], live = [];
  return {
    live,
    spawn(...args) {
      const o = free.pop() || factory();
      reset(o, ...args);
      o.mesh.visible = true;
      o.mesh.matrixAutoUpdate = true;
      live.push(o);
      return o;
    },
    release(i) {
      const o = live[i];
      o.mesh.visible = false;
      o.mesh.matrixAutoUpdate = false;
      live[i] = live[live.length - 1];
      live.pop();
      free.push(o);
    },
    // For an owner that holds its object across frames rather than sweeping the
    // live list by index.
    releaseObject(o) {
      const i = live.indexOf(o);
      if (i >= 0) this.release(i);
    },
    clear() { while (live.length) this.release(live.length - 1); },
  };
}
