// A purse runs into six figures by the end of a sector, and a wall of digits is
// counted rather than read. Grouped in threes wherever a coin count is shown.
// Not toLocaleString: the separator would be whatever the player's machine says,
// and half the game's numbers would be punctuated the other way round.
export const coins = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
