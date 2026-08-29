import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { makeGrid } from '../core/grid.js';

// Wide enough that a bug and its neighbour are nearly always in adjoining cells,
// and small enough that a cell in a packed crowd holds a handful rather than a
// wave.
const CELL = 4;

// Everything the ring can grow to, and room outside it for a body shoved past the
// edge by a blast. Further out than that is filed in the rim cells, which is
// harmless: nothing lives out there.
const SPAN = CFG.arena.max + 20;

const grid = makeGrid(CELL, SPAN);

// Where each bug stands and how far it reaches, by the index a query hands back.
export const body = grid.body;

// Filled by whichever of the questions below was asked last, and read before the
// next one: `hits[0..n)` where `n` is what the question answered. Indices, not
// bugs — see core/grid.js for why.
export const hits = grid.hits;

export const bugAt = grid.item;

// Once a frame, before anything asks. A bug that dies during the frame stays in
// here until the next one, so every reader has to check `hp` for itself.
export const rebuild = () => grid.build(world.bugs);

// Bugs whose body may be touching the circle: the widest bug on the field is
// added to the reach, since a body stands further out than its centre.
export const touching = (x, z, r) => grid.near(x, z, r + grid.widest());
