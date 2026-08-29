// Every sound the game loads, and how loud it sits. Files are trimmed and
// normalised to about -1.5 dBFS by tools/gen_sfx.mjs, so `gain` alone sets the
// mix.
export const SFX = {
  sfx: {
    // `maxVoices` is how many copies of one sample may sound at once. Every one
    // of these arrives faster than it decays — the gun is a second long and
    // fires ten times a second, a wave dies all at once, a magnet takes a pile
    // in a single frame — so without a ceiling a sample sums into itself until
    // it is a tone and the bus compressor is pumping on it. Stealing the oldest
    // copy of the same sample is inaudible; letting it crowd the pool is not.
    shoot:     { url: 'sounds/gunshot-1.wav', gain: 0.14, maxVoices: 6 },
    shotgun:   { url: 'sounds/shotgun.mp3',   gain: 0.20, maxVoices: 4 },
    // The gun modules. Every one of these sounds under a gun that is already
    // firing, so they are quieter than the shot itself and capped hard: a
    // module is meant to be heard, not to take the mix over from the weapon.
    rf_rail:    { url: 'sounds/rf_rail.mp3',    gain: 0.22, maxVoices: 3 },
    rf_seeker:  { url: 'sounds/rf_seeker.mp3',  gain: 0.09, maxVoices: 3, minGap: 0.07 },
    sg_slug:    { url: 'sounds/sg_slug.mp3',    gain: 0.22, maxVoices: 3 },
    lz_prism:   { url: 'sounds/lz_prism.mp3',   gain: 0.14, maxVoices: 2 },
    lz_rift:    { url: 'sounds/lz_rift.mp3',    gain: 0.12, maxVoices: 2 },
    ln_well:    { url: 'sounds/ln_well.mp3',    gain: 0.09, maxVoices: 2 },
    ln_emp:     { url: 'sounds/ln_emp.mp3',     gain: 0.16, maxVoices: 3 },
    hit:       { url: 'sounds/hit.mp3',       gain: 0.10, maxVoices: 6 },
    // One key for the whole death chorus: a wave wiped in one blast is four
    // cries, not thirty layered into a roar.
    kill:         { url: 'sounds/kill.mp3',         gain: 0.07, gapKey: 'kill', maxVoices: 4 },
    kill_grunt:   { url: 'sounds/kill_grunt.mp3',   gain: 0.14, gapKey: 'kill', maxVoices: 4 },
    kill_runner:  { url: 'sounds/kill_runner.mp3',  gain: 0.22, gapKey: 'kill', maxVoices: 4 },
    kill_tank:    { url: 'sounds/kill_tank.mp3',    gain: 0.08, gapKey: 'kill', maxVoices: 4 },
    kill_spitter: { url: 'sounds/kill_spitter.mp3', gain: 0.12, gapKey: 'kill', maxVoices: 4 },
    spit:         { url: 'sounds/spit.mp3',         gain: 0.20, maxVoices: 4 },
    coin:         { url: 'sounds/coin.mp3',         gain: 0.14, maxVoices: 14 },
    spitHit:      { url: 'sounds/spithit.mp3',      gain: 0.16, maxVoices: 4 },
    bugAttack: { url: 'sounds/bugattack.mp3', gain: 0.18, maxVoices: 4 },
    hurt1:     { url: 'sounds/huh1.mp3',      gain: 0.17, minGap: 0.42, gapKey: 'hurt' },
    hurt2:     { url: 'sounds/huh2.mp3',      gain: 0.27, minGap: 0.42, gapKey: 'hurt' },
    hurt3:     { url: 'sounds/huh3.mp3',      gain: 0.22, minGap: 0.42, gapKey: 'hurt' },
    hurt4:     { url: 'sounds/huh4.mp3',      gain: 0.17, minGap: 0.42, gapKey: 'hurt' },
    hurtHeavy: { url: 'sounds/hurt_heavy.mp3', gain: 0.30, minGap: 0.9, gapKey: 'hurt' },
    zap:       { url: 'sounds/zap.mp3',       gain: 0.06, maxVoices: 4 },
    // The drone's arc. Its own sound and its own limiter, since a flight of six
    // arcing at once must not sound like one machine.
    zapDrone:  { url: 'sounds/zap_drone.mp3', gain: 0.07, maxVoices: 4 },
    crit:      { url: 'sounds/crit.mp3',      gain: 0.09, maxVoices: 4 },
    dry:       { url: 'sounds/dry.mp3',       gain: 0.11 },
    launch:    { url: 'sounds/launch.mp3',    gain: 0.20 },
    explode:   { url: 'sounds/explode.mp3',   gain: 0.26, maxVoices: 4 },
    dash:      { url: 'sounds/dash.mp3',      gain: 0.18 },
    // A held chord rather than a hit, and 6 dB denser than spawn at the same
    // peak, so it is mixed well under the transients or it buries the pad
    // assembly it plays over. It also has to outlive that assembly's fifty
    // voices, which is what `hold` buys.
    wave:      { url: 'sounds/wave.mp3',      gain: 0.15, hold: true },
    // Sustained rather than a hit, so it carries far more energy than its peak
    // suggests and sits lower than the transients. Breaches arrive in batches
    // and three rumbles at once is mud, so near-simultaneous ones collapse.
    // Five seconds long, so the gap is half its length: a batch breaching three
    // holes at once is one rumble, and a later batch layers rather than restarts.
    spawn:     { url: 'sounds/spawn.mp3',     gain: 0.22, minGap: 2.5 },
    spawnBlast: { url: 'sounds/spawn_blast.mp3', gain: 0.32 },
    // A foot the size of a car landing. Twice a stride for as long as the boss
    // is alive, so it sits far under the transients it plays alongside and is
    // gapped against the pair of feet that land together.
    stomp:     { url: 'sounds/spawn_blast.mp3', gain: 0.13, minGap: 0.1 },
    // The drone's voice. It chatters while it is idle and pipes up on every
    // change of mind, so it sits well under the guns and is gapped against
    // itself — a flight of them must not turn into a chorus.
    // Every cue has a few turns of phrase, rolled per utterance, so a flight of
    // them never speaks in chorus. The count lives in `CFG.drone.voice`.
    droneIdle1:    { url: 'sounds/drone_idle.mp3',     gain: 0.10, minGap: 0.5, gapKey: 'drone' },
    droneIdle2:    { url: 'sounds/drone_idle2.mp3',    gain: 0.10, minGap: 0.5, gapKey: 'drone' },
    droneIdle3:    { url: 'sounds/drone_idle3.mp3',    gain: 0.10, minGap: 0.5, gapKey: 'drone' },
    droneAttack1:  { url: 'sounds/drone_attack.mp3',   gain: 0.16, minGap: 0.3, gapKey: 'drone' },
    droneAttack2:  { url: 'sounds/drone_attack2.mp3',  gain: 0.16, minGap: 0.3, gapKey: 'drone' },
    droneAttack3:  { url: 'sounds/drone_attack3.mp3',  gain: 0.16, minGap: 0.3, gapKey: 'drone' },
    droneSwitch1:  { url: 'sounds/drone_switch.mp3',   gain: 0.12, minGap: 0.3, gapKey: 'drone' },
    droneSwitch2:  { url: 'sounds/drone_switch2.mp3',  gain: 0.12, minGap: 0.3, gapKey: 'drone' },
    droneSwitch3:  { url: 'sounds/drone_switch3.mp3',  gain: 0.12, minGap: 0.3, gapKey: 'drone' },
    droneHurt1:    { url: 'sounds/drone_hurt.mp3',     gain: 0.16, minGap: 0.25 },
    droneHurt2:    { url: 'sounds/drone_hurt2.mp3',    gain: 0.16, minGap: 0.25 },
    // Held: it runs the length of the flyby's approach, and the voice limiter
    // drops the oldest one-shot first.
    droneArrive:   { url: 'sounds/drone_arrive.mp3',   gain: 0.20, hold: true },
    storyType: { url: 'sounds/story_type.mp3', gain: 0.06 },
    storyLine: { url: 'sounds/story_line.mp3', gain: 0.14 },
    // Every button in the game, the briefing's included. The hover fires on a
    // sweep across a row, so it is gapped and sits well under the press.
    uiHover:   { url: 'sounds/ui_hover.mp3',   gain: 0.08, minGap: 0.04 },
    uiClick:   { url: 'sounds/ui_click.mp3',   gain: 0.20 },
    // The tree is 180-odd nodes packed tight, so its hover is quieter and gapped
    // harder than the buttons': crossing the wheel must not machine-gun.
    treeHover: { url: 'sounds/tree_hover.mp3', gain: 0.06, minGap: 0.07 },
    treeBuy:   { url: 'sounds/tree_buy.mp3',   gain: 0.26 },
    uiDeny:    { url: 'sounds/ui_deny.mp3',    gain: 0.16 },
    // Travel opening, heard once a save and never again: the plate presented,
    // the plate driven home, and the board's bolt withdrawing. Louder than the
    // bench's own buttons on purpose — nothing else is competing with them.
    travelCard: { url: 'sounds/travel_card.mp3', gain: 0.30 },
    travelFly:  { url: 'sounds/travel_fly.mp3',  gain: 0.26 },
    travelOpen: { url: 'sounds/travel_open.mp3', gain: 0.34 },
    // A sector opening, heard once a sector: the loudest thing the bench says,
    // because it is the one thing on it a whole run was played for.
    sectorOpen: { url: 'sounds/sector_open.mp3', gain: 0.42 },
    // Arriving in a sector already open, which is every switch after the first.
    // Under sectorOpen on purpose: the ceremony belongs to the sector that was
    // earned, not to walking back into one.
    sectorGo:   { url: 'sounds/sector_go.mp3',   gain: 0.30 },
    // A machine building itself. Nothing here is the extraction pad's alone —
    // anything that later unfolds out of the ground speaks with these.
    // `rigPiece` fires once a part and fifty times an assembly, so it sits far
    // under everything else and is pitched per part rather than gapped.
    // Two weights of one action, pitched per kind of part: twelve ring segments
    // sound like twelve of the same thing, and a lamp never sounds like a slab.
    // The same sample retriggered every 20ms stops being that sample and
    // becomes a tone, so each voice is gapped — but only just under the rate
    // the pieces themselves arrive at, so a part you can see land is a part you
    // hear land. Only pieces from two groups arriving at once are dropped.
    // Three voices, not for variety's sake: the big ring lands while the plates
    // are still landing, and two pieces arriving together on one voice is one
    // piece heard.
    rigHeavy:  { url: 'sounds/rig_heavy.mp3',  gain: 0.08, minGap: 0.028 },
    rigPiece:  { url: 'sounds/rig_piece.mp3',  gain: 0.07, minGap: 0.028 },
    rigSmall:  { url: 'sounds/rig_small.mp3',  gain: 0.05, minGap: 0.024 },
    // The two dozen ring lamps are the biggest group and land across everything
    // else, so they get their own key rather than taking the fittings' slots.
    rigLamp:   { url: 'sounds/rig_small.mp3',  gain: 0.03, minGap: 0.024 },
    rigLock:   { url: 'sounds/rig_lock.mp3',   gain: 0.20 },
    // A gun landing in the rack at the end of its flight across the bench. The
    // flight is the reward, so this is the one bench sound allowed some weight.
    gunRack:   { url: 'sounds/gun_rack.mp3',   gain: 0.28 },
    // The near miss. Heard often once Nerve is deep, so it sits well under the
    // attack that caused it — the attack is the event, this is the aftertaste.
    graze:     { url: 'sounds/graze.mp3',      gain: 0.42, minGap: 0.1, maxVoices: 3 },
    // The guns filling. Rare by design — three near misses inside five seconds —
    // so it is allowed to sit on top of whatever else is sounding.
    charged:   { url: 'sounds/charged.mp3',    gain: 0.5, minGap: 0.3 },
    bank:      { url: 'sounds/bank.mp3',       gain: 0.3, minGap: 0.05, maxVoices: 3 },
    // Taking anything off the floor: one cue for every item there will ever be,
    // since what was picked up is the card's business rather than the sound's.
    itemTake:  { url: 'sounds/item_take.mp3',  gain: 0.34 },
    rigFold:   { url: 'sounds/rig_fold.mp3',   gain: 0.16, minGap: 0.03 },
    // One recording, three registrations: a key is what the rate limiter counts
    // against, so a slab and a lamp pulling back at the same moment need keys
    // of their own or one of them is never heard.
    rigStowBig:   { url: 'sounds/rig_stow.mp3', gain: 0.10, minGap: 0.024 },
    rigStow:      { url: 'sounds/rig_stow.mp3', gain: 0.10, minGap: 0.024 },
    rigStowSmall: { url: 'sounds/rig_stow.mp3', gain: 0.09, minGap: 0.024 },
    rigStowLamp:  { url: 'sounds/rig_stow.mp3', gain: 0.07, minGap: 0.024 },
    // Held for as long as the player stands on the pad, so this is the level it
    // climbs to rather than the one it starts at. A flat bed on purpose: the
    // swell and the pitch climb are both driven, not baked into the sample.
    padCharge: { url: 'sounds/pad_charge.mp3', gain: 0.04 },
    // Held for as long as the player is off the ground, and the only sound that
    // plays under their own guns for minutes at a time, so it sits well down.
    // `seamless` says the file was cut to run round on itself: the whole of it
    // is the loop, rather than the tail end of it.
    jetpack: { url: 'sounds/jetpack.mp3', gain: 0.06, seamless: true },
    jetpackOn: { url: 'sounds/jetpack_on.mp3', gain: 0.09 },
    jetpackOff: { url: 'sounds/jetpack_off.mp3', gain: 0.11 },
    jetMine: { url: 'sounds/jet_mine.mp3', gain: 0.14 },
    jetLock: { url: 'sounds/jet_lock.mp3', gain: 0.13 },
    // The pack's own refusal. Heard on a key the player expected to work, so it
    // sits above the gun's dry click rather than under it.
    jetDeny: { url: 'sounds/jet_deny.mp3', gain: 0.15 },
    jetDive: { url: 'sounds/jet_dive.mp3', gain: 0.22 },
    // The loudest thing the player owns, and rare enough to be allowed to be.
    jetStrike: { url: 'sounds/jet_strike.mp3', gain: 0.34 },
    // The wave clock running out. One deep note under the fight rather than a
    // siren over it, and four seconds long, so it has to survive the voice
    // limiter until it has finished saying so.
    collapseAlarm: { url: 'sounds/collapse_alarm.mp3', gain: 0.38, hold: true },
    // Struck once a beat for the whole close, so it is gapped against itself and
    // held: its tail is longer than the gap, and the voice limiter must not cut
    // one ping short to make room for the next.
    collapseSonar: { url: 'sounds/collapse_sonar.mp3', gain: 0.30, hold: true },
    // Ridden for as long as the ring is closing, which is a minute and a half at
    // the widest, and its level is driven rather than baked. `seamless`: cut to
    // run round on itself. Its gain is far above the one-shots' because the
    // files here are levelled on their peak, and a bed with no transients in it
    // carries seven or eight dB less body than a sample that has some at the
    // same peak — it is quieter than the number looks.
    collapseRumble: { url: 'sounds/collapse_rumble.mp3', gain: 0.34, seamless: true },
  },
};
