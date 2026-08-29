// The machine's own bench. Nothing here reaches the player's guns and nothing
// bought for those reaches the drone.
import { DRONE } from '../../ui/icons.js';

export const DRONE_MODULES = [
  {
    id: 'drHealth', name: 'Drone Plating',
    blurb: '[Drone] Raise the drone\'s maximum health',
    kind: 'drone', per: 0.40,
    icon: DRONE
  },
  {
    id: 'drSpeed', name: 'Drone Thrusters',
    blurb: '[Drone] The drone flies faster',
    kind: 'drone', per: 0.09,
    icon: '<path d="M3 8h9"/><path d="M3 16h9"/><path d="M12 6l8 6-8 6z"/>'
  },
  {
    id: 'drShield', name: 'Drone Shielding',
    blurb: '[Drone] The drone takes less damage from every hit',
    kind: 'drone', base: 0.05, cap: 0.80,
    icon: '<path d="M12 2.5l8 3.2v6.1c0 4.9-3.3 8.6-8 10.2-4.7-1.6-8-5.3-8-10.2V5.7z"/>'
          + '<path d="M13 8l-3 4.5h4L11 17"/>'
  },
  {
    id: 'drDamage', name: 'Drone Cannon',
    blurb: '[Drone] The whole gun: harder, faster, and further every level',
    // `per` lands the last level on 5000 damage, carrying 9 there over ten.
    // Reach is a distance rather than a multiple: first level to last, in even
    // steps, and it stops climbing where the table does.
    kind: 'drone', per: 0.8814, rate: 0.16, endless: 'per',
    reach: { base: 15, cap: 35 },
    icon: '<path d="M3 10.5h11v3H3z"/><path d="M14 12h4"/><path d="M18 8.5l3.5 3.5-3.5 3.5"/>'
  },
  {
    id: 'drVoid', name: 'Drone Singularity',
    blurb: '[Drone] Drags everything nearby into one point and burns the pile',
    // First level to last, in even steps: how far it reaches, and what the pile
    // burns for once it is gathered.
    kind: 'drone', base: 10, cap: 40,
    burn: { base: 300, cap: 10000 },
    cool: { base: 20, cap: 10 },
    icon: '<circle cx="12" cy="12" r="3.4"/><path d="M12 3a9 9 0 0 1 8.5 6"/>'
          + '<path d="M21 15a9 9 0 0 1-9 6"/><path d="M4 18A9 9 0 0 1 5 6"/>'
  },
  {
    id: 'drBomb', name: 'Drone Bombing Run',
    blurb: '[Drone] Flies a marked line across the field, laying bombs as it goes',
    // First level to last, in even steps: how far the line runs, how many
    // charges are laid down it, what one of them hits for, and how wide that
    // charge takes the ground.
    kind: 'drone', base: 20, cap: 40,
    drops: { base: 5, cap: 14 },
    hit: { base: 150, cap: 3000 },
    blast: { base: 3, cap: 6 },
    cool: { base: 20, cap: 10 },
    icon: '<path d="M4 5.5h3l1.5 4-1.5 4H4z"/><path d="M11 5.5h3l1.5 4-1.5 4h-3z"/>'
          + '<path d="M18 5.5h3l1.5 4-1.5 4h-3z"/><path d="M2 20h20"/>'
  },
  {
    id: 'drZap', name: 'Drone Zap Rounds',
    blurb: '[Drone] The drone\'s hits zap nearby enemies',
    kind: 'drone', per: 1,
    icon: '<path d="M13 2L6 13h5l-2 9 9-12h-5z"/>'
  },
  {
    id: 'drPierce', name: 'Drone Piercing Rounds',
    blurb: '[Drone] The drone\'s rounds pierce enemies, losing damage each time',
    kind: 'drone', base: 0.20, per: 0.06, cap: 0.90,
    icon: '<path d="M2 12h20"/><path d="M15 7l6 5-6 5"/><path d="M8 4v16"/>'
  },
  {
    id: 'drCrit', name: 'Drone Targeting',
    blurb: '[Drone] Raise the drone\'s critical hit chance',
    kind: 'drone', cap: 0.35,
    icon: '<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><circle cx="12" cy="12" r="3.2"/>'
  },
  {
    id: 'drSwarmDamage', name: 'Swarm Targeting',
    blurb: '[Drone] Harder hits for every other drone flying within 30 units',
    kind: 'drone', per: 0.05, cap: 1,
    icon: '<circle cx="12" cy="13" r="3.2"/><path d="M10 10.5L5.8 6.8"/><path d="M14 10.5l4.2-3.7"/>'
          + '<circle cx="4.2" cy="5.4" r="2.2"/><circle cx="19.8" cy="5.4" r="2.2"/>'
  },
  {
    id: 'drSwarmSpeed', name: 'Swarm Thrusters',
    blurb: '[Drone] More speed for every other drone flying within 30 units',
    kind: 'drone', per: 0.05, cap: 1,
    icon: '<circle cx="5" cy="6" r="2.2"/><circle cx="5" cy="18" r="2.2"/>'
          + '<path d="M7.2 7.2l4.3 3M7.2 16.8l4.3-3"/><path d="M12 7l8 5-8 5z"/>'
  },
  {
    id: 'drSwarmShield', name: 'Swarm Shielding',
    blurb: '[Drone] More damage blocked for every other drone flying within 30 units',
    // `roof` is how far a flight can carry the plating past the ceiling the
    // plating alone stops at, so a maxed Drone Shielding still has something
    // left to gain here — and a flight is still not untouchable.
    kind: 'drone', per: 0.05, cap: 1, roof: 0.90,
    icon: '<path d="M12 2.6l6.2 2.5v4.7c0 3.8-2.6 6.7-6.2 7.9-3.6-1.2-6.2-4.1-6.2-7.9V5.1z"/>'
          + '<circle cx="3.6" cy="19.4" r="2.2"/><circle cx="20.4" cy="19.4" r="2.2"/>'
  },
];
