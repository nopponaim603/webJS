// A sector is a self-contained 15-wave mission: its own ground, its own run, its
// own coins and modules. The drone a sector pays at wave 15 crosses into the one
// after it and never flies here. `count` scales how many bugs a wave fields and
// `hp` how much killing each one takes — the roster and the levels it hatches at
// are the same everywhere, there are simply more of them and they are harder to
// put down the further out you go.
// `shot` is the face the wave board wears for it, and is covered until the
// sector is sighted: seeing the ground is part of what reaching one pays.
// It is a plain image path, so swapping in a real vista is a one-line change.
export const SECTORS = [
  { id: 'A', name: 'Broken Ground', terrain: null, count: 1, hp: 1,
    shot: 'assets/sectors/a.jpg' },
  { id: 'B', name: 'Hardpack Snow', terrain: 'snowfield', count: 1.2, hp: 1.2,
    shot: 'assets/sectors/b.jpg' },
  { id: 'C', name: 'Ferric Plain', terrain: 'ferric', count: 1.44, hp: 1.44,
    shot: 'assets/sectors/c.jpg' },
  { id: 'D', name: 'Nightglass', terrain: 'nightglass', count: 1.728, hp: 1.728,
    shot: 'assets/sectors/d.jpg' },
  { id: 'E', name: 'Dune Sea', terrain: 'dunes', count: 2.0736, hp: 2.0736,
    shot: 'assets/sectors/e.jpg' },
];
