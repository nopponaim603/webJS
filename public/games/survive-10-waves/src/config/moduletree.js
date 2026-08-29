// Where every module sits: which one it hangs off, at what level of it, how
// many levels it sells, and what has to be true before the branch is on the
// board at all. What each module does is src/modules/catalog/'s business, and
// what a node costs is where it sits rather than which module it belongs to —
// see `modulePrice` and the walk in modules/layout.js.
export const MODULE_TREE = {
  moduleTree: [
    // A gun's own levels are what open the branches hanging off it, so
    // levelling the weapon is what buys the next thing it can be taught rather
    // than only what makes the last thing bigger.
    { id: 'rfGun', levels: 10 },
    { id: 'rfPierce', levels: 10,
      needs: { mod: 'rfGun', level: 5 } },
    { id: 'rfChain', levels: 10,
      needs: { mod: 'rfGun', level: 2 } },
    { id: 'rfRail', levels: 10,
      needs: { mod: 'rfGun', level: 7 } },
    { id: 'rfSeeker', levels: 10,
      needs: { mod: 'rfGun', level: 2 } },
    { id: 'lnGun', levels: 10 },
    { id: 'lnCount', levels: 10,
      needs: { mod: 'lnGun', level: 2 } },
    { id: 'napalm', levels: 10,
      needs: { mod: 'lnGun', level: 5 } },
    { id: 'lnWell', levels: 8,
      needs: { mod: 'lnGun', level: 7 } },
    { id: 'lnEmp', levels: 8,
      needs: { mod: 'lnGun', level: 2 } },
    { id: 'sgGun', levels: 10 },
    { id: 'sgKnock', levels: 8,
      needs: { mod: 'sgGun', level: 7 } },
    { id: 'sgPierce', levels: 10,
      needs: { mod: 'sgGun', level: 2 } },
    { id: 'sgReach', levels: 10,
      needs: { mod: 'sgGun', level: 2 } },
    { id: 'sgSlug', levels: 8,
      needs: { mod: 'sgGun', level: 5 } },
    // Not on the board for the first seven waves of any sector: the lance is
    // what surviving to wave 8 pays, so it arrives as something new rather than
    // as one more thing to save for from the start.
    { id: 'lzGun', levels: 10, gate: 'wave8' },
    { id: 'lzBounce', levels: 5,
      needs: { mod: 'lzGun', level: 3 } },
    { id: 'lzPrism', levels: 6,
      needs: { mod: 'lzGun', level: 3 } },
    { id: 'lzRift', levels: 8,
      needs: { mod: 'lzGun', level: 7 } },
    { id: 'foresight', levels: 4 },
    { id: 'crit', levels: 10,
      needs: { mod: 'foresight', level: 2 } },
    { id: 'speed', levels: 10 },
    // On the board from the first tree screen and drawn beside the node it hangs
    // off, locked until that node is bought: a player who has never seen a tree
    // is shown there is somewhere to spend past the one in front of them.
    // `flip` draws it on Power Cell's side of the speed chain rather than the
    // jetpack's, where the two of them sit together and nothing has to reach
    // across it. Drawing only — price is on the walk.
    { id: 'dash', levels: 10, shown: true, flip: true,
      needs: { mod: 'speed', level: 1 } },
    { id: 'cell', levels: 10,
      needs: { mod: 'speed', level: 3 } },
    { id: 'jetpack', levels: 10,
      needs: { mod: 'speed', level: 7 } },
    { id: 'jetBomb', levels: 10,
      needs: { mod: 'jetpack', level: 4 } },
    { id: 'jetStrike', levels: 10,
      needs: { mod: 'jetpack', level: 7 } },
    { id: 'jetKick', levels: 10,
      needs: { mod: 'jetStrike', level: 2 } },
    { id: 'health', levels: 10 },
    { id: 'shield', levels: 10,
      needs: { mod: 'health', level: 4 } },
    // What these two hand over is a rule, not a number, so there is nothing to
    // climb. What pays for stringing them together is Adrenaline, above them.
    { id: 'nerve', levels: 10,
      needs: { mod: 'health', level: 2 } },
    { id: 'reflex', levels: 10,
      needs: { mod: 'health', level: 3 } },
    { id: 'adrenaline', levels: 10,
      needs: { mod: 'health', level: 4 } },
    // The whole drone branch is behind the drone itself: nothing here is on the
    // board until a sector the player can fly one in.
    { id: 'drHealth', levels: 10, gate: 'drone' },
    { id: 'drSpeed', levels: 10,
      needs: { mod: 'drHealth', level: 2 } },
    { id: 'drShield', levels: 10,
      needs: { mod: 'drHealth', level: 5 } },
    { id: 'drDamage', levels: 10,
      needs: { mod: 'drHealth', level: 1 } },
    { id: 'drCrit', levels: 10,
      needs: { mod: 'drHealth', level: 4 } },
    { id: 'drVoid', levels: 10,
      needs: { mod: 'drDamage', level: 8 } },
    { id: 'drZap', levels: 10,
      needs: { mod: 'drDamage', level: 3 } },
    { id: 'drBomb', levels: 10,
      needs: { mod: 'drDamage', level: 5 } },
    { id: 'drPierce', levels: 10,
      needs: { mod: 'drDamage', level: 4 } },
    { id: 'drSwarmSpeed', levels: 10,
      needs: { mod: 'drSpeed', level: 2 } },
    { id: 'drSwarmShield', levels: 10,
      needs: { mod: 'drShield', level: 2 } },
    { id: 'drSwarmDamage', levels: 10,
      needs: { mod: 'drCrit', level: 2 } },
  ],
};
