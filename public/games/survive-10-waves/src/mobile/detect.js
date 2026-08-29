// Imports nothing: the renderer asks about the device before anything else is
// built, and a cycle through the game would drag it in too early.
const forced = location.search.includes('touch');
const coarseOnly = navigator.maxTouchPoints > 0
  && (!window.matchMedia || !matchMedia('(any-pointer: fine)').matches);

export const touchDevice = forced || coarseOnly;
