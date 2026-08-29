import { CFG } from '../config/index.js';
import { world, state } from '../core/world.js';
import { camera, camOffset, setZoomMax, followZoomMax, framesDrawn } from '../engine/view.js';
import { releaseInput } from '../engine/input.js';
import { audio } from '../engine/audio.js';
import { music } from '../engine/music.js';
import * as hud from '../ui/hud.js';
import * as arenaSize from '../arena/size.js';
import { current as terrainNow } from '../arena/themes/index.js';
import * as swap from '../arena/themes/swap.js';
import * as bugs from '../bug/roster.js';
import * as bossfall from './bossfall.js';
import * as teardown from './teardown.js';
import * as flyby from './flyby.js';
import * as special from './special.js';
import * as bossdrop from './bossdrop.js';
import * as drone from '../allies/drone.js';
import * as coins from './coins.js';
import * as waves from './waves.js';
import { bossesAt } from './waveplan.js';
import * as combat from './combat.js';
import * as player from '../character/player.js';
import * as energy from '../character/energy.js';
import * as firing from '../weapons/firing.js';
import * as loadout from '../weapons/loadout.js';
import * as modules from '../modules/index.js';
import * as moduleScreen from '../modules/screen.js';
import * as rackcoach from '../ui/rackcoach.js';
import * as extraction from './extraction.js';
import * as ledger from './ledger.js';
import * as menuscene from './menuscene.js';
import * as story from '../ui/story.js';
import * as movetip from '../ui/movetip.js';
import * as bubble from '../ui/bubble.js';
import * as progress from './progress.js';
import * as sector from './sector.js';
import * as drops from '../items/drops.js';
import * as effects from '../items/effects.js';
import * as aura from '../items/aura.js';
import { track, waveTag, slug } from '../core/track.js';

export function setMode(mode) {
  state.mode = mode;
  document.body.dataset.mode = mode;

  if (mode === 'playing') {
    music.resume();
    music.target = CFG.music.play;
    special.resume();
    return;
  }
  special.pause();
  // Whatever the fight was sounding goes with the fight, not on for another
  // two seconds over a pause screen.
  audio.hush();
  if (mode === 'paused') music.pause();
  else if (mode === 'menu') music.menu();
  else if (mode === 'modules') music.target = CFG.music.play * 0.55;
}

let clearDelay = 0;
let deathWait = 0;

// Every way out of a round takes down the same list; the counters that time the
// end of one are the only part of it that lives here.
export function clearRound() {
  clearDelay = 0;
  deathWait = 0;
  teardown.round();
}

export function resetGame() {
  menuscene.leave();
  music.unpin();
  story.hide();
  state.told = {};
  clearRound();
  ledger.reset();
  ledger.forgetDeaths();

  Object.assign(state, { time: 0, kills: 0, coins: 0, earned: 0, repaired: 0, wave: 1,
                         spawnTimer: 0.8, cleared: false, keys: {}, best: 0,
                         drones: sector.drones(), droneHp: [],
                         played: 0, waveTime: 0, waveTimes: {} });
  modules.reset();
  player.reset(world.player);
  camera.position.copy(world.player.pos).add(camOffset);
  hud.sync(world.player.health);
}

// Autoplay only lets these through inside the click that started play, so both
// menu buttons have to call it themselves.
function unlockAudio() {
  music.start();
  audio.resume();
}

// A new game is every sector at once now, drones and unlocks included, which is
// why the button behind it asks first.
export function newGame() {
  track('run_started');
  progress.forgetAll();
  sector.wipe();
  moduleScreen.forgetBoard();
  movetip.forget();
  rackcoach.forget();
  resetGame();
  unlockAudio();
  startWave(1, true);
}

export function continueGame() {
  const run = progress.load();
  if (!run) { newGame(); return; }
  track('run_continued');
  resetGame();
  progress.apply(run);
  hud.sync(world.player.health);
  moduleScreen.markSaved(progress.save());
  unlockAudio();
  hud.hideOverlays();
  setMode('modules');
  moduleScreen.resume(state.wave, state.cleared);
}

// Sectors are separate runs, not a filter over one: the one being left is put
// away whole, and the one arrived at is picked up where it stopped — or begun,
// if it has never been played.
export function switchSector(id) {
  if (id === sector.current()) return;
  progress.save();
  sector.go(id);
  resetGame();
  const run = progress.load();
  if (run) progress.apply(run);
  hud.sync(world.player.health);
  moduleScreen.markSaved(progress.save());
  setMode('modules');
  moduleScreen.resume(state.wave, state.cleared);
}

// One sector taken back to nothing: its run, its tree, its records and the
// clears that came out of it. Any sector may be taken back — a sector opens the
// next one once and for all, so what is behind you is never holding a later one
// up. See game/sector.js.
export function resetSector() {
  const id = sector.current();
  track(`sector_${slug(id)}_reset`);
  progress.forget(id);
  sector.forget(id);
  loadout.reset();
  resetGame();
  moduleScreen.markSaved(progress.save());
  setMode('modules');
  moduleScreen.resume(state.wave, state.cleared);
}

export function quitToMenu() {
  progress.save();
  clearRound();
  releaseInput();
  setMode('menu');
  hud.showOverlay('menu');
  hud.showRun(progress.load());
  menuscene.enter();
}

// The debug jump kit: stop on the upgrade screen with the wave still ahead,
// the way a resumed run does.
export function openModules(n) {
  state.wave = Math.max(1, Math.round(n));
  state.cleared = false;
  clearRound();
  ledger.reset();
  ledger.forgetDeaths();
  hud.hideOverlays();
  releaseInput();
  world.player.health = modules.maxHealth();
  setMode('modules');
  moduleScreen.resume(state.wave);
}

// Two frames, not one: the first only queues the paint, and the build that
// follows blocks long enough that a bar which never appeared reads as a freeze.
const painted = () => new Promise((done) => {
  requestAnimationFrame(() => requestAnimationFrame(done));
});

// Resolves once the loop has actually drawn, so an overlay is never taken away
// from a canvas that still holds the frame from before it went up.
function drawn() {
  const from = framesDrawn();
  return new Promise((done) => {
    let guard = 0;
    const check = () => ((framesDrawn() > from || ++guard > 10)
      ? done() : requestAnimationFrame(check));
    requestAnimationFrame(check);
  });
}

// The ground belongs to the sector, not to the wave: it is only ever crossed by
// arriving somewhere else.
const groundReady = () => sector.terrain() === terrainNow();

// The load is quick; building the arena is not, and it cannot be interrupted.
// So the bar reaches the end, says what it is doing, and is on screen before
// the main thread goes away.
async function loadTerrain(n, heal, said) {
  setMode('loading');
  releaseInput();
  hud.hideOverlays();
  moduleScreen.hide();
  hud.showTerrainLoad();
  await painted();

  await swap.preload(sector.terrain(), (t) => hud.terrainProgress(t * 0.7));
  hud.terrainProgress(1, 'BUILDING TERRAIN');
  await painted();

  swap.apply(sector.terrain());
  startWave(n, heal, said);
  await drawn();
  hud.hideTerrainLoad();
}

// `said` is the story coming back: the screen re-enters this and a beat that
// repeats would otherwise put itself straight back up.
export function startWave(n, heal = false, said = false) {
  if (!said && story.pending(`before:${n}`)) {
    swap.preload(sector.terrain());
    tellStory(`before:${n}`, () => startWave(n, heal, true));
    // After the screen is up, not before: putting one up clears the round, and
    // clearing a round hands the deck back.
    if (special.due(n)) special.hush();
    return;
  }
  // The wave waits on its ground: swapping terrain under a wave already running
  // would rebuild the arena around live bugs.
  if (!groundReady()) {
    loadTerrain(n, heal, said);
    return;
  }
  clearRound();
  hud.hideOverlays();

  state.waveTime = 0;
  waves.beginWave(n);
  // Standing on a wave says the ones before it are done, so the record is kept
  // here as well as on the clear: it can never sit behind the run.
  state.best = Math.max(state.best, n - 1);
  arenaSize.goTo(n);
  loadout.sync();
  if (heal) world.player.health = modules.maxHealth();

  energy.fill(world.player);

  firing.refillGuns(world.player);

  // Every wave starts the same way: the pad puts you down in the middle of the
  // map, wherever the last one left you.
  world.player.pos.set(0, 0, 0);
  world.player.vel.set(0, 0, 0);
  setZoomMax(modules.zoomMax());
  followZoomMax();
  camera.position.copy(world.player.pos).add(camOffset);
  // Every machine picks up on the health it landed the last wave with; a slot
  // whose machine was broken has nothing to pick up and flies out whole.
  for (let i = 0; i < state.drones; i++) {
    const d = drone.add(false, i);
    const left = state.droneHp[i];
    if (left > 0) d.hp = Math.min(d.hpMax, left);
    state.droneHp[i] = Math.round(d.hp);
  }

  setMode('playing');
  music.forWave(n);
  // Before the pad is delivered: the script pulls the ring in, and a pad placed
  // against the old radius would be left standing outside it.
  if (special.due(n)) special.begin();
  extraction.deliver(world.player.pos);
  progress.save();
  track(`${waveTag(n)}_reached`);
  hud.sync(world.player.health);
  hud.banner(`WAVE ${n}`);
}

const worstHurt = () => Object.entries(state.hurtBy)
  .sort((a, b) => b[1] - a[1]).map(([who]) => who)[0];

function report(cleared) {
  const deaths = Object.values(state.deaths).reduce((n, d) => n + d, 0);
  if (!cleared) {
    track(`${waveTag(state.wave)}_failed`);
    if (worstHurt()) track(`killed_by_${slug(worstHurt())}`);
    return;
  }
  track(`${waveTag(state.wave)}_cleared`);
  if (state.wave !== CFG.mission.waves) return;
  track('mission_complete');
  if (deaths === 0) track('mission_flawless');
}

// The screen takes the mode while it is up, so nothing steps behind it.
function takeScreen(key, then) {
  releaseInput();
  setMode('story');
  hud.showOverlay('story');
  story.show(key, then);
}

// Between waves: there is no round left to keep.
function tellStory(key, then) {
  clearRound();
  takeScreen(key, then);
}

// Inside a round: the coins, the corpses and the cleared banner all have to still
// be there when play comes back, so nothing is taken down.
function interlude(key, then) {
  takeScreen(key, () => {
    hud.hideOverlays();
    setMode('playing');
    if (then) then();
  });
}

const raisePad = () => extraction.show(world.player.pos);

// The second screen of the moment the drop closes, put up from here rather than
// chained onto the first so the drone can be flown through the gap between them.
function debrief(wave) {
  const key = `after:${wave}/debrief`;
  if (story.pending(key)) interlude(key);
}

// Read whether or not the first screen was shown, so a run that was quit or lost
// part way through the moment tells the rest of it on the next attempt instead of
// losing it.
function afterCongrats(wave) {
  if (flyby.due()) flyby.begin();
  else debrief(wave);
}

function afterClear() {
  const beat = `after:${state.wave}`;
  if (story.pending(beat)) interlude(beat, raisePad);
  else raisePad();
}

export const rewardOf = (n) => CFG.mission.rewards[n] || 'key';

// It flies out the wave it was won on and no further, so it says where it will
// be waiting rather than leaving the player to find that on the wave board.
function handOver() {
  const d = drone.add();
  const to = sector.next();
  if (to) bubble.say(d, `COME FIND ME IN SECTOR ${to}`);
}

// The boss's drop is what closes a finale wave, so the beat that belongs to the
// wave is read the moment it is picked up rather than waiting on the pad. A
// drone flies out with you from the moment you reach it; whether you keep it is
// settled on the way off the wave.
export function dropTaken() {
  const wave = state.wave;
  state.keys[wave] = true;
  if (rewardOf(wave) === 'drone' && !sector.won(wave)) handOver();
  progress.save();
  const beat = `after:${wave}`;
  if (story.pending(beat)) interlude(beat, () => afterCongrats(wave));
  else afterCongrats(wave);
}

// Clearing the wave is what pays it, not reaching the drop: a finale carried off
// a wave that then went wrong is not kept. The drone the horizon pays flies for
// the next sector, so `state.drones` does not move here.
function collect(wave) {
  if (!CFG.mission.rewards[wave] || !sector.markClear(wave)) return;
  if (wave === CFG.mission.horizon) track(`sector_${slug(sector.current())}_cleared`);
}

// A machine broken is a machine bought again. The wave pays the flight the share
// of the take its own damage earned, and every machine that did not come back
// leaves that share of it behind: half the flight lost is half the flight's
// share gone. Charged whether the wave was cleared or not — what was picked up
// on the way is banked as it is touched, so a wave you died on has still paid.
function chargeRepairs() {
  const flight = Math.max(1, state.drones);
  // Never more than the flight it had: the line reads off the same figure the
  // charge does, so what is said is what is paid.
  const lost = Math.min(state.waveLost, flight);
  state.waveLost = lost;
  state.waveRepair = 0;
  if (!lost) return;

  // Off what this wave paid, never off the purse: the cost of a machine is a
  // share of the work it was part of, and a full purse does not raise it.
  const share = state.waveEarned * ledger.flightShare();
  state.waveRepair = Math.round(share * (lost / flight));
  const paid = Math.min(state.coins, state.waveRepair);
  state.coins -= paid;
  state.repaired += paid;
}

export function endWave(cleared) {
  clearDelay = 0;
  deathWait = 0;
  extraction.hide();
  flyby.clear();
  special.clear();
  hud.extractPrompt(false);
  // Nothing an item bought outlives the wave it was found on.
  effects.clear(world.player);
  aura.clear();

  if (cleared) coins.bank(); else coins.forfeit();
  chargeRepairs();
  // A retried wave adds to its own total, the way its deaths do, so the per-wave
  // times always sum back to the run.
  state.waveTimes[state.wave] = (state.waveTimes[state.wave] || 0) + state.waveTime;
  state.waveTime = 0;
  state.cleared = cleared;
  // Health is carried from wave to wave and across a quit; only dying gives it
  // back, so the wave that killed you is retried from full. The flight is kept
  // the same way and given back the same way — a slot with nothing written
  // against it flies out whole.
  if (!cleared) {
    world.player.health = modules.maxHealth();
    state.droneHp = [];
  }
  if (cleared) {
    state.best = Math.max(state.best, state.wave);
    collect(state.wave);
  }
  releaseInput();
  moduleScreen.markSaved(progress.save());
  report(cleared);

  hud.hideOverlays();
  setMode('modules');
  moduleScreen.show(state.wave, cleared);
}

export function killed(type, at, bug) {
  state.kills++;
  state.waveKills++;
  special.fell(at, bug);

  if (type.burst) combat.burst(type, at, bug);
  if (type.finale) { bossfall.begin(at); bossdrop.drop(at, rewardOf(state.wave)); }
  // A scripted carrier drops what it was sent out holding, and drops it every
  // time: the roll is for bugs the wave did not pick out by hand.
  else if (bug && bug.gift) special.gift(at, bug.gift);
  // The scripted wave hands out what its script says and nothing besides. A
  // lucky roll in the middle of it would undercut the few it is built around.
  else if (!special.active()) drops.rollOn(bug, at);
}

export function died() {
  ledger.died();
  arenaSize.startSink(false);
  extraction.show(world.player.pos);
  hud.extractPrompt(false);
  deathWait = CFG.extraction.deathWait;
}

// What the wave itself is doing while it is played: dying, spawning, being
// called, and the walk to the pad that ends it.
// The clock is the wave's other opponent: past the limit the floor starts going
// and keeps going, so a fight that will not end is fought on a shrinking one.
// A boss is exempt — it is a long fight by design, and taking the ground off one
// would be shortening a wave that is meant to take as long as it takes. Only the
// clock is held off, so the bench can still start it by hand on a boss wave.
function closeRing(dt) {
  if (!special.active() && !bossesAt(state.wave)
      && state.waveTime >= CFG.arena.collapse.after) {
    arenaSize.startSink();
  }
  arenaSize.sink(dt);
}

export function stepWave(dt, padCharged) {
  if (deathWait > 0) {
    deathWait -= dt;
    if (deathWait <= 0) endWave(false);
    return;
  }
  if (flyby.finished()) {
    flyby.clear();
    debrief(state.wave);
    return;
  }
  if (extraction.raised()) {
    hud.extractPrompt(true, extraction.progress());
    if (padCharged) endWave(true);
    return;
  }
  // The beat after a wave starts once the payout is in hand, so a boss purse
  // still sweeping in is never cut off by the pad or the screen over it.
  if (clearDelay > 0) {
    // The scripted wave pays its coins out during the outro rather than after it,
    // so the pad is owed to the music finishing, not to the floor being clear.
    // Whatever is still lying about is banked on extraction either way.
    if ((!coins.sweeping() || special.active()) && !flyby.running()) clearDelay -= dt;
    if (clearDelay <= 0) afterClear();
    return;
  }
  special.update(dt);
  closeRing(dt);
  if (waves.updateSpawning(dt) && !bossfall.running() && !bossdrop.pending()
      && !flyby.running()) {
    clearDelay = CFG.waves.clearDelay;
    // The ground stops going with the fight that was costing it. What has
    // already gone stays gone until the next wave lays it back down.
    arenaSize.startSink(false);
    teardown.hazards();
    coins.collectAll();
    audio.wave();
    // Held: the pad prompt says what to do next, this says the fight is over.
    hud.banner(`WAVE ${state.wave} CLEARED`, true);
  }
}
