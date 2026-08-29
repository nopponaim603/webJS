// What the bench sells for the body rather than for a gun: how fast it moves,
// how much it can take, what it can see, and the moves it is handed.

export const PLAYER_MODULES = [
  {
    id: 'speed', name: 'Speed Boost',
    blurb: 'Run faster',
    per: 0.09,
    icon: '<path d="M3 7h13"/><path d="M3 12h17"/><path d="M3 17h11"/>'
  },
  {
    id: 'foresight', name: 'Foresight',
    blurb: 'Predict enemy attacks, and see more of the fight',
    kind: 'sight',
    icon: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/>'
          + '<circle cx="12" cy="12" r="2.6"/>'
  },
  {
    id: 'nerve', name: 'Nerve',
    blurb: 'Stand still on the edge of an enemy attack to instantly recover HP and '
         + 'gun charges, plus 0.5% more HP for each near miss still banked from the '
         + 'last 10 seconds',
    band: 3, hold: 0.6,
    share: { base: 0.01, cap: 0.04 },
    charge: { base: 0.15, cap: 0.40 },
    icon: '<path d="M2.5 5.5c6 1.6 11 5.6 14.5 11"/><circle cx="16.5" cy="6.5" r="2.8"/>'
  },
  {
    id: 'reflex', name: 'Reflex',
    blurb: 'Dash out of an attack at the last moment to instantly recover HP and '
         + 'gun charges, plus 0.5% more HP for each near miss still banked from the '
         + 'last 10 seconds',
    window: 0.15, reach: 7,
    share: { base: 0.01, cap: 0.04 },
    charge: { base: 0.15, cap: 0.40 },
    icon: '<path d="M2 8h6"/><path d="M2 12h4"/><path d="M2 16h6"/>'
        + '<path d="M11 5l7 7-7 7"/>'
  },
  {
    id: 'adrenaline', name: 'Adrenaline',
    blurb: 'Increase fire rate and damage, and instantly recover gun charges, '
         + 'when you collect 5 charges from Nerve and Reflex',
    chain: 5, within: 10,
    rate: { base: 0.15, cap: 0.70 },
    seconds: { base: 3, cap: 7 },
    charge: { base: 0.50, cap: 1.00 },
    hurt: { base: 0.10, cap: 0.40 },
    icon: '<path d="M1.5 13h4l2.2-6 3.2 11 2.6-8 1.8 4.5 1.7-2.5h5.5"/>'
  },
  {
    id: 'crit', name: 'Crit Boost',
    blurb: 'Raise your critical hit chance',
    kind: 'crit', cap: 0.35,
    icon: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>'
  },
  {
    id: 'health', name: 'Health Boost',
    blurb: 'Raise your maximum health',
    kind: 'health', per: 0.40, endless: 'per',
    icon: '<path d="M12 21C12 21 4 15.5 4 10.5A4.5 4.5 0 0 1 12 8.6 4.5 4.5 0 0 1 20 10.5'
          + 'C20 15.5 12 21 12 21z"/>'
  },
  {
    id: 'shield', name: 'Shield Module',
    blurb: 'Take less damage from every hit',
    kind: 'shield', base: 0.05, cap: 0.80,
    icon: '<path d="M12 2.5l8 3.2v6.1c0 4.9-3.3 8.6-8 10.2-4.7-1.6-8-5.3-8-10.2V5.7z"/>'
          + '<path d="M8.5 12l2.6 2.6 4.4-4.8"/>'
  },
  {
    id: 'dash', name: 'Dash Module',
    blurb: 'Press Shift to dash. Costs energy. Invincible for a brief moment',
    // The first level hands over the move itself; the rest make it cheaper, so
    // a full tank goes further rather than filling any faster.
    kind: 'dash', per: 0.10,
    invuln: { base: 0.5, cap: 1.5 },
    icon: '<path d="M13 2L5 13h5l-1 9 9-12h-5z"/><path d="M20 4v16" opacity=".5"/>'
  },
  {
    id: 'cell', name: 'Power Cell',
    blurb: 'A bigger battery behind the dash and the jetpack, and a faster refill',
    kind: 'dash', per: 0.08, regen: 0.06,
    icon: '<path d="M4 8h13v8H4z"/><path d="M17 10.5h3v3h-3z"/>'
          + '<path d="M11 9.5l-2.5 3.5H12l-2 2.5" opacity=".7"/>'
  },
  {
    id: 'jetpack', name: 'Jetpack',
    blurb: 'Press Space to fly. Nothing on the ground can reach you, and every '
         + 'level burns less getting there',
    kind: 'dash', per: 0.16,
    icon: '<path d="M8 3h8v11H8z"/><path d="M10 14l-1.5 7"/><path d="M14 14l1.5 7"/>'
  },
  {
    id: 'jetBomb', name: 'Drop Charge',
    blurb: '[Jetpack] Lift off to leave a charge that explodes after 2 seconds, '
         + 'causing area damage. Costs energy',
    kind: 'dash', base: 500, cap: 3000,
    radius: { base: 1, cap: 10 },
    cost: { base: 3, cap: 15 },
    icon: '<circle cx="12" cy="13" r="6"/><path d="M12 7V3"/><path d="M9.5 3h5"/>'
  },
  {
    id: 'jetStrike', name: 'Thunder Drop',
    blurb: '[Jetpack] While in the air, press E and click to perform a thunder '
         + 'drop, causing area damage and pushing enemies outward',
    kind: 'dash', base: 1000, cap: 100000,
    cast: { base: 14, cap: 40 },
    reach: { base: 6, cap: 30 },
    icon: '<path d="M13 2L7 12h4l-1 10 7-12h-4z"/>'
          + '<path d="M3 20h4M17 20h4" opacity=".6"/>'
  },
  {
    id: 'jetKick', name: 'Kickstart',
    blurb: '[Thunder Drop] Increase fire rate for a short time after a Thunder '
         + 'Drop is performed',
    // Both numbers on the same ramp as the rest of the bench: what the first
    // level buys is the move being worth firing out of at all, and the last one
    // makes the window long enough to spend a rack in.
    kind: 'dash', base: 0.10, cap: 0.50,
    seconds: { base: 1, cap: 4 },
    icon: '<path d="M12 2.5L7 11h4l-1 7 6-9h-4z"/>'
          + '<path d="M19.4 12.4a7.5 7.5 0 0 1-13.6 3.9" opacity=".6"/>'
          + '<path d="M19.6 9v3.6H16" opacity=".6"/>'
  },
];
