// One entry a gun module. The four roots carry a whole weapon between them —
// `stats` is the rates its levels raise, `climbs` the numbers it walks to — and
// everything else hangs off one of them as a branch of its own.

export const GUN_MODULES = [
  {
    id: 'rfGun', name: 'Rifle Upgrade',
    blurb: '[Gun] Upgrade the rifle',
    kind: 'gun', endless: 'power',
    stats: { power: 0.65, rate: 0.16, cap: 0.16, recov: 0.16 },
    icon: '<path d="M3 10h15v3H3z"/><path d="M18 11.5h3.5"/><path d="M7 13l-1.5 4"/><path d="M12 6.5l2 3-3 1 2 3"/>'
  },
  {
    id: 'lnGun', name: 'Launcher Upgrade',
    blurb: '[Gun] Upgrade the launcher',
    kind: 'gun', endless: 'power',
    stats: { power: 0.65, rate: 0.16, cap: 0.0718, recov: 0.0987, throw: 0.06, blast: 0.06 },
    icon: '<path d="M3 12h11v4H3z"/><path d="M14 13.5h4"/><path d="M7 16l-1.5 3.5"/>'
          + '<path d="M4.5 9c4-5.5 12-5.5 16 0"/>'
  },
  {
    id: 'sgGun', name: 'Shotgun',
    blurb: '[Gun] Unlock and upgrade the shotgun',
    kind: 'gun', unlocks: true, endless: 'power',
    stats: { power: 0.65, rate: 0.17, cap: 0.17, recov: 0.17, spread: 0.05 },
    climbs: { pellets: 20 },
    icon: '<path d="M3 10h12v4H3z"/><path d="M15 10.8h6"/><path d="M15 13.2h6"/><path d="M8 14l-1.5 3.5"/>'
  },
  {
    id: 'lzGun', name: 'Laser Lance',
    blurb: '[Gun] Unlock and upgrade the lance',
    kind: 'gun', unlocks: true, endless: 'power',
    stats: { power: 1.035, recov: 0.17, width: 0.10 },
    icon: '<path d="M2 12h13"/><path d="M15 9.5h5v5h-5z"/><path d="M6 9v6M10 8.5v7"/>'
  },
  {
    id: 'rfPierce', name: 'Piercing Rounds',
    blurb: 'Rifle rounds pierce enemies, losing damage each time',
    kind: 'gun', base: 0.20, per: 0.06, cap: 0.90,
    icon: '<path d="M2 12h20"/><path d="M15 7l6 5-6 5"/><path d="M8 4v16"/>'
  },
  {
    id: 'rfChain', name: 'Chain Bullets',
    blurb: 'Rifle hits arc to nearby enemies',
    kind: 'gun', per: 1,
    icon: '<path d="M13 2L6 13h5l-2 9 9-12h-5z"/>'
  },
  {
    id: 'lzBounce', name: 'Ricochet Lance',
    blurb: 'The lance ricochets off walls',
    kind: 'gun', per: 1,
    icon: '<path d="M4 4l14 7.5"/><path d="M18 11.5L4 19"/><path d="M19.5 2.5v19"/>'
  },
  {
    id: 'lnCount', name: 'Extra Grenade',
    blurb: 'Fire more grenades a shot, up to five',
    kind: 'gun', per: 0.4,
    icon: '<circle cx="7" cy="15" r="2.6"/><circle cx="12" cy="9" r="2.6"/><circle cx="17" cy="15" r="2.6"/>'
  },
  {
    id: 'napalm', name: 'Napalm Grenades',
    blurb: 'Grenades leave a pool that burns for a share of their damage',
    kind: 'gun', base: 0.05, cap: 0.70,
    icon: '<path d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z"/><path d="M12 13c1 1.4 1.6 2.2 1.6 3a1.6 1.6 0 0 1-3.2 0c0-.8.6-1.6 1.6-3z"/>'
  },
  {
    id: 'sgKnock', name: 'Impact Pellets',
    blurb: 'Shotgun pellets shove what they hit',
    kind: 'gun', per: 1,
    icon: '<path d="M4 12h8"/><path d="M12 8l5 4-5 4"/><path d="M19 6v12"/>'
  },
  {
    id: 'sgPierce', name: 'Piercing Shells',
    blurb: 'Pellets pierce enemies, keeping all their damage at the last level',
    kind: 'gun', base: 0.15, per: 0.085, cap: 1,
    icon: '<path d="M2 6h19"/><path d="M2 12h19"/><path d="M2 18h19"/>'
          + '<path d="M13 3.5v17"/><path d="M18 3.5v17"/>'
  },
  {
    id: 'sgReach', name: 'Shotgun Range',
    blurb: 'Pellets carry further, out to 45 units',
    // Units, not a multiplier: the whole point of the module is the number.
    kind: 'gun', base: 20, cap: 45,
    icon: '<path d="M2 12h5"/><path d="M9.5 12h3"/><path d="M15 12h2.5"/>'
          + '<path d="M18.5 8l3.5 4-3.5 4"/><path d="M4 6v12"/>'
  },
  {
    id: 'rfRail', name: 'Rail Slug',
    blurb: 'Every tenth rifle round fires a slug instead, piercing through '
         + 'everything in a straight line',
    kind: 'gun',
    icon: '<path d="M2 7.5h20"/><path d="M2 16.5h20"/>'
          + '<path d="M5 12h9"/><path d="M14 9l4 3-4 3z"/>'
  },
  {
    id: 'rfSeeker', name: 'Seeker Flechettes',
    blurb: 'Some rifle rounds split into homing darts that arc over cover and '
         + 'strike what the shot could not reach',
    kind: 'gun',
    icon: '<path d="M2.5 19.5c6.5-1 11-5.5 12.5-13"/>'
          + '<path d="M15.5 3.5l3.5 3.5-5.4 1.4z"/>'
          + '<path d="M3 12.5c4.5-.5 7.5-2.5 9-5.5" opacity=".55"/>'
  },
  {
    id: 'sgSlug', name: 'Breaching Slug',
    blurb: 'Every 5 shells the shotgun fires a solid slug instead of a spread, '
         + 'bursting back into pellets where it stops',
    kind: 'gun',
    icon: '<path d="M3 12h9"/><path d="M12 8.4c2.6 0 4.6 1.6 4.6 3.6S14.6 15.6 12 15.6z"/>'
          + '<path d="M18.5 12H22"/><path d="M6 8.6v6.8M9 9.4v5.2" opacity=".5"/>'
  },
  {
    id: 'lzPrism', name: 'Prism Array',
    blurb: 'The lens splits what comes out of it. One wind-up, spread across a '
         + 'fan of beams instead of spent on one',
    kind: 'gun',
    icon: '<path d="M2 12h6"/><path d="M8 6.5l5.5 5.5L8 17.5z"/>'
          + '<path d="M13.5 12h8.5"/><path d="M12.6 9.6L21 5.5M12.6 14.4L21 18.5"/>'
  },
  {
    id: 'lzRift', name: 'Rift Lance',
    blurb: 'The line the beam cut does not close. For a moment everything near '
         + 'it is dragged onto the cut and burns there',
    kind: 'gun',
    icon: '<path d="M12 2.5c-1.6 4-1.6 15 0 19 1.6-4 1.6-15 0-19z"/>'
          + '<path d="M5 8.5l3.6 2.4M5 15.5l3.6-2.4M19 8.5l-3.6 2.4M19 15.5l-3.6-2.4"/>'
  },
  {
    id: 'lnWell', name: 'Gravity Well',
    blurb: 'Some shells implode first, pulling nearby enemies into one point '
         + 'before the blast',
    kind: 'gun',
    icon: '<circle cx="12" cy="12" r="2.4"/>'
          + '<path d="M12 3.5A8.5 8.5 0 0 1 20.5 12"/>'
          + '<path d="M20.5 12A8.5 8.5 0 0 1 12 20.5" opacity=".7"/>'
          + '<path d="M12 20.5A8.5 8.5 0 0 1 3.5 12" opacity=".5"/>'
          + '<path d="M8.4 12l3.6-3.6M12 15.6L15.6 12"/>'
  },
  {
    id: 'lnEmp', name: 'EMP Shells',
    blurb: 'Some shells leave a field that slows enemies inside it and arcs '
         + 'damage between them',
    kind: 'gun',
    icon: '<circle cx="12" cy="12" r="8.6"/>'
          + '<path d="M12.8 6.5L9 12.4h3l-1 5.1 4-6h-3z"/>'
          + '<path d="M3.4 12h-2.2M22.8 12h-2.2M12 3.4V1.2M12 22.8v-2.2" opacity=".5"/>'
  },
];
