import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world, state } from '../core/world.js';
import { updateZoom, setZoomMax, setFlightZoom, followCamera, render, blank,
         viewZoom } from '../engine/view.js';
import { onPause, onMute, onFirstInput, onKonami, releaseInput } from '../engine/input.js';
import * as mixer from '../ui/mixer.js';
import * as volume from '../ui/volume.js';
import * as debugmenu from '../debug/menu.js';
import * as debugdraw from '../debug/draw.js';
import * as acidbox from '../debug/acidbox.js';
import * as grazezone from '../debug/grazezone.js';
import { audio, listener } from '../engine/audio.js';
import { music } from '../engine/music.js';
import * as hud from '../ui/hud.js';
import * as gunrack from '../ui/gunrack.js';
import * as minimap from '../ui/minimap.js';
import * as arena from '../arena/ground.js';
import * as collapse from '../fx/collapse.js';
import * as walls from '../arena/walls.js';
import * as scatter from '../arena/scatter.js';
import * as fx from '../fx/spatter.js';
import * as stains from '../fx/stains.js';
import * as acid from '../fx/acid.js';
import * as blast from '../fx/blast.js';
import * as shockwave from '../fx/shockwave.js';
import * as gunmods from '../gunmods/index.js';
import * as jetbomb from '../weapons/jetbomb.js';
import * as fire from '../fx/fire.js';
import * as wake from '../fx/wake.js';
import * as spawnwarn from '../fx/spawnwarn.js';
import * as lane from '../fx/lane.js';
import * as floaters from '../ui/floaters.js';
import * as bullets from '../weapons/bullets.js';
import * as grenades from '../weapons/grenades.js';
import * as laser from '../weapons/laser.js';
import * as spit from '../bug/spit.js';
import * as spikes from '../bug/spikes.js';
import * as napalm from '../weapons/napalm.js';
import * as divelane from '../fx/divelane.js';
import * as shield from '../fx/shield.js';
import * as healthbars from '../ui/healthbars.js';
import * as pounce from '../bug/pounce.js';
import * as fling from '../bug/fling.js';
import * as singularity from '../allies/singularity.js';
import * as dronebomb from '../allies/dronebomb.js';
import * as dronebeam from '../allies/dronebeam.js';
import * as slam from '../bug/slam.js';
import * as bossfall from './bossfall.js';
import * as flyby from './flyby.js';
import * as bossdrop from './bossdrop.js';
import * as bombs from '../bug/bombs.js';
import * as drone from '../allies/drone.js';
import * as boomerangs from '../bug/boomerangs.js';
import * as coins from './coins.js';
import * as bugs from '../bug/roster.js';
import * as corpses from '../bug/corpses.js';
import * as combat from './combat.js';
import * as player from '../character/player.js';
import * as graze from '../character/graze.js';
import * as grazering from '../fx/grazering.js';
import * as motes from '../fx/bankmotes.js';
import * as bugcharge from '../fx/bugcharge.js';
import * as jetpack from '../character/jetpack.js';
import * as charge from '../weapons/charge.js';
import * as mobile from '../mobile/index.js';
import * as modules from '../modules/index.js';
import * as moduleScreen from '../modules/screen.js';
import * as extraction from './extraction.js';
import * as special from './special.js';
import * as watchtower from './watchtower.js';
import * as menuscene from './menuscene.js';
import * as story from '../ui/story.js';
import * as movetip from '../ui/movetip.js';
import * as bubble from '../ui/bubble.js';
import * as note from '../ui/note.js';
import * as reload from '../ui/reload.js';
import * as exitguard from '../ui/exitguard.js';
import * as buttons from '../ui/buttons.js';
import * as fullscreen from '../ui/fullscreen.js';
import * as credits from '../ui/credits.js';
import * as progress from './progress.js';
import * as run from './run.js';
import * as loading from '../core/loading.js';
import * as perf from '../core/perf.js';
import * as bench from '../debug/bench.js';
import * as drops from '../items/drops.js';
import * as aura from '../items/aura.js';
import * as effects from '../items/effects.js';
import * as effectbar from '../ui/effectbar.js';

// Modes that stop the world rather than only the simulation. Load-bearing:
// updateEffects runs napalm, which damages the player, so a mode left off this
// list burns health behind whatever screen it put up.
const FROZEN = new Set(['paused', 'story']);

const clock = new THREE.Clock();
let hudTick = 0;
let blanked = false;

// blast before fx: a scorch is laid down as the flash clears.
function updateEffects(dt) {
  wake.update(dt);
  lane.update(dt);
  blast.update(dt);
  bombs.update(dt);
  laser.update(dt);
  dronebeam.update(dt);
  spawnwarn.update(dt);
  napalm.update(dt);
  fire.update(dt);
  divelane.update(dt);
  shield.update(dt);
  aura.update(dt);
  healthbars.update();
  acid.update(dt);
  fx.update(dt);
  shockwave.update(dt);
  gunmods.update(dt);
}

function togglePause() {
  if (state.mode === 'playing') {
    run.setMode('paused'); hud.showOverlay('pause'); releaseInput();
    fullscreen.suspend();
  } else if (state.mode === 'paused') {
    run.setMode('playing'); hud.hideOverlays(); gunrack.endRackEdit();
    fullscreen.resume();
  }
}

function wireHooks() {
  world.hooks.damagePlayer = (amount, o) => player.damage(world.player, amount, o);
  world.hooks.startWave = (n) => run.startWave(Math.max(1, Math.round(n)), true);
  world.hooks.openModules = run.openModules;
  world.hooks.onKill = run.killed;
  world.hooks.onDeath = run.died;

  world.hooks.onPlayerDamage = (amount) => {
    hud.flashHurt(amount);
    hud.sync(world.player.health);
  };
}

function stepPlaying(dt) {
  state.time += dt;
  state.played += dt;
  state.waveTime += dt;

  listener.x = world.player.pos.x;
  listener.z = world.player.pos.z;
  listener.reach = viewZoom();
  player.update(world.player, dt);
  graze.step(dt);
  grazering.update(dt);
  motes.update(dt);
  bugcharge.update();
  drone.update(dt);
  bullets.update(dt);
  jetbomb.update(dt);
  grenades.update(dt);
  spit.update(dt);
  spit.updateMarks(dt);
  spikes.update(dt);
  pounce.updateMarks(dt);
  fling.updateMarks(dt);
  singularity.update(dt);
  dronebomb.update(dt);
  slam.updateMarks(dt);
  slam.updateCombos(dt);
  bossfall.update(dt);
  flyby.update(dt);
  if (bossdrop.update(dt)) run.dropTaken();
  boomerangs.update(dt);
  coins.update(dt);
  perf.begin('bugs'); bugs.update(dt); perf.end();
  perf.begin('corpses'); corpses.update(dt); perf.end();
  perf.begin('combat'); combat.resolve(); combat.update(dt); perf.end();
}

function frame() {
  requestAnimationFrame(frame);
  // A benchmark wants the cost of a step, not of a second: pinning the step is
  // what makes two runs the same run and a millisecond worth reading.
  const dt = world.debug.fixedStep || Math.min(clock.getDelta(), 0.05);

  music.update(dt);

  const padCharged = extraction.update(dt);

  setZoomMax(modules.zoomMax());
  setFlightZoom(state.mode === 'playing' && !!world.player && jetpack.flying(world.player));
  updateZoom(dt);
  hud.updateBanner(dt);
  gunrack.updateTip(dt);
  movetip.update();
  effectbar.update();
  note.update(dt);
  bubble.update(dt);
  moduleScreen.update(dt);

  if (world.player) gunrack.syncGuns(CFG.guns, world.player.gun);
  hud.syncDrones();
  perf.begin('minimap'); minimap.update(dt); perf.end();

  if (state.mode === 'playing') {
    perf.begin('sim');
    stepPlaying(dt);
    run.stepWave(dt, padCharged);
    // Taken and used on the spot: what it is and how long it has left is said
    // by the readout, rather than by a screen the fight has to wait behind.
    const found = drops.update(dt);
    if (found) effects.use(world.player, found);
    perf.end();

    const pl = world.player;
    const readout = charge.readout(pl);
    hud.syncGun(readout);
    hud.syncEnergy();
    mobile.sync(pl, readout);

    grenades.aimRing(readout.gun.projectile === 'grenade', pl.pos, pl.aim);

    hudTick += dt;
    if (hudTick > 0.1) {
      hudTick = 0;
      hud.sync(world.player.health);
    }
  } else if (state.mode === 'menu') {
    menuscene.update(dt);
  } else if (state.mode === 'story') {
    story.update(dt);
  }

  if (state.mode !== 'playing') { jetpack.hush(world.player); collapse.hush(); }

  if (!FROZEN.has(state.mode)) {
    perf.begin('fx');
    updateEffects(dt); floaters.update(dt); scatter.update(dt);
    collapse.update(dt);
    arena.update(dt);
    perf.end();
  }
  debugmenu.update(dt);
  debugdraw.update();
  acidbox.update(dt);
  grazezone.update(dt);
  if (state.mode === 'playing') {
    // A scene that has the camera does not ride the player's altitude with it:
    // a jetpack still falling out of the sky would carry the shot down with it.
    const rise = bossfall.running() || flyby.running() ? 0 : jetpack.altitude(world.player);
    followCamera(flyby.aim(bossfall.aim(world.player.pos)), dt, rise);
    hud.placeRing();
  }
  watchtower.update(dt);

  // Before the draw and outside it: what settled this frame has to be in the
  // ground by the time the floor is drawn, or it is gone for a frame.
  stains.flush();

  if (state.mode === 'modules' || state.mode === 'loading') {
    // Nothing to see: both screens cover the canvas completely.
    if (!blanked) { blank(); blanked = true; }
  } else {
    blanked = false;
    perf.begin('render'); render(); perf.end();
  }
  perf.frame();
}

export function boot() {
  arena.build();
  walls.build();
  scatter.build();
  blast.warmup();
  fire.warmup();
  window.__game = world;
  bench.install();
  world.player = player.create();
  wireHooks();

  hud.onButtons({ resume: togglePause, quit: run.quitToMenu,
                  play: run.continueGame, erase: run.newGame,
                  music: () => music.toggleMute() });
  moduleScreen.init({
    retry: () => run.startWave(state.wave),
    next: () => { if (state.cleared) run.startWave(state.wave + 1); },
    pick: (wave) => run.startWave(wave, true),
    sector: run.switchSector,
    reset: run.resetSector,
    quit: run.quitToMenu,
    fresh: run.newGame,
    // Coins spent on the upgrade screen survive a reload there, not just once
    // the next wave starts.
    buy: () => moduleScreen.markSaved(progress.save()),
  });
  // The same for the rack: a gun moved at the bench is part of the run from
  // there, not from the moment the next wave starts.
  gunrack.onRackEdit(() => {
    if (state.mode === 'modules') moduleScreen.markSaved(progress.save());
  });
  mixer.init();
  volume.init();
  reload.init();
  exitguard.init();
  credits.init();
  buttons.init();
  fullscreen.init();
  mobile.init({ pause: togglePause });
  debugmenu.init();
  onPause(togglePause);
  onKonami(watchtower.toggle);
  onMute(() => music.toggleMute());
  onFirstInput(() => audio.resume());

  addEventListener('visibilitychange', () => {
    if (document.hidden && state.mode === 'playing') togglePause();
  });

  run.resetGame();
  run.setMode('menu');
  hud.showOverlay('menu');
  hud.showRun(progress.load());
  menuscene.enter();

  const firstTrack = music.preload();
  if (firstTrack) music.fetchWhole(firstTrack);

  loading.onProgress(hud.loadProgress);
  // Before loadReady, and after the assets: the pad draws itself once to warm
  // up, and the loading screen is what hides that frame.
  loading.onReady(() => extraction.warmup());
  loading.onReady(hud.loadReady);
  loading.onReady(() => music.warm());
  loading.onReady(() => special.warm());
  loading.seal();

  frame();
}
