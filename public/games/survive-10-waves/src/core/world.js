// Imports nothing, so anything may depend on it without a cycle.
export const world = {
  state: {
    mode: 'menu',
    time: 0,
    kills: 0,
    coins: 0,
    earned: 0,
    waveKills: 0,
    waveEarned: 0,
    // What the wave's losses cost to put right, and how many machines were
    // lost: the repair comes off the take on the screen after it.
    waveRepair: 0,
    waveLost: 0,
    repaired: 0,
    played: 0,
    waveTime: 0,
    waveTimes: {},
    hurtBy: {},
    dealtBy: {},
    deaths: {},
    phase: 1,
    phases: 1,
    phasePlan: [],
    bossPhase: 0,
    phaseWait: 0,
    wave: 1,
    spawnTimer: 1,
    quota: 0,
    spawned: 0,
    cleared: false,
    levels: {},
    told: {},
    keys: {},
    drones: 0,
    // What each machine has left, in the order they fly. A slot with nothing in
    // it is one that was broken: it comes back whole on the next wave.
    droneHp: [],
    best: 0,
  },
  player: null,
  bugs: [],
  corpses: [],
  debug: { freezeBugs: false, invuln: false, noSpawn: false,
           showPaths: false, drawWalls: false, infiniteCharges: false,
           acidBoxes: false, grazeZones: false, autoHeal: false, fixedStep: 0, zoomOut: 1,
           infiniteEnergy: false },
  hooks: {
    damagePlayer() {},
    onPlayerDamage() {},
    onKill() {},
    onDeath() {},
    startWave() {},
    openModules(n) {},
  },
};

export const state = world.state;
