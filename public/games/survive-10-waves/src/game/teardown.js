import { world } from '../core/world.js';
import * as hud from '../ui/hud.js';
import * as minimap from '../ui/minimap.js';
import * as fx from '../fx/spatter.js';
import * as acid from '../fx/acid.js';
import * as blast from '../fx/blast.js';
import * as fire from '../fx/fire.js';
import * as wake from '../fx/wake.js';
import * as spawnwarn from '../fx/spawnwarn.js';
import * as lane from '../fx/lane.js';
import * as divelane from '../fx/divelane.js';
import * as shield from '../fx/shield.js';
import * as collapse from '../fx/collapse.js';
import * as arenaSize from '../arena/size.js';
import * as floaters from '../ui/floaters.js';
import * as healthbars from '../ui/healthbars.js';
import * as labels from '../ui/labels.js';
import * as graze from '../character/graze.js';
import * as adrenaline from '../character/adrenaline.js';
import * as motes from '../fx/bankmotes.js';
import * as bugcharge from '../fx/bugcharge.js';
import * as grazering from '../fx/grazering.js';
import * as note from '../ui/note.js';
import * as bubble from '../ui/bubble.js';
import * as bullets from '../weapons/bullets.js';
import * as grenades from '../weapons/grenades.js';
import * as laser from '../weapons/laser.js';
import * as napalm from '../weapons/napalm.js';
import * as jetbomb from '../weapons/jetbomb.js';
import * as spit from '../bug/spit.js';
import * as spikes from '../bug/spikes.js';
import * as bombs from '../bug/bombs.js';
import * as fuse from '../bug/fuse.js';
import * as boomerangs from '../bug/boomerangs.js';
import * as pounce from '../bug/pounce.js';
import * as fling from '../bug/fling.js';
import * as slam from '../bug/slam.js';
import * as bugs from '../bug/roster.js';
import * as singularity from '../allies/singularity.js';
import * as dronebomb from '../allies/dronebomb.js';
import * as dronebeam from '../allies/dronebeam.js';
import * as drone from '../allies/drone.js';
import * as strike from '../character/strike.js';
import * as player from '../character/player.js';
import * as dummies from '../debug/dummies.js';
import * as moduleScreen from '../modules/screen.js';
import * as gunmods from '../gunmods/index.js';
import * as drops from '../items/drops.js';
import * as items from '../items/effects.js';
import * as aura from '../items/aura.js';
import * as bossfall from './bossfall.js';
import * as flyby from './flyby.js';
import * as special from './special.js';
import * as bossdrop from './bossdrop.js';
import * as coins from './coins.js';
import * as combat from './combat.js';
import * as extraction from './extraction.js';
import * as watchtower from './watchtower.js';

// Everything a finished fight leaves on the floor that can still hurt, plus the
// things that are only there because something was fighting. Taken down when the
// wave is called rather than when the next one starts, so the walk to the pad is
// never spent dodging acid nothing is left to have thrown.
export function hazards() {
  gunmods.clear();
  bullets.clear();
  grenades.clear();
  spit.clear();
  spikes.clear();
  napalm.clear();
  fire.clear();
  bombs.clear();
  fuse.clear();
  boomerangs.clear();
  pounce.clear();
  fling.clear();
  singularity.clear();
  dronebomb.clear();
  slam.clear();
  blast.clear();
  lane.clear();
  divelane.clear();
  spawnwarn.clear();
  acid.clear();
  fx.clearHazards();
  graze.clear();
  adrenaline.clear();
  motes.clear();
  bugcharge.clear();
  grazering.clear();
}

function effects() {
  collapse.clear();
  wake.clear();
  laser.clear();
  dronebeam.clear();
  jetbomb.clear();
  strike.clear();
  shield.clear();
  healthbars.clear();
  labels.hide();
  note.clear();
}

// Every way out of a round takes down the same list.
export function round() {
  // Before bugs.clear(): dummies despawn by reference and give up on a bug
  // already off the roster, stranding the pillars.
  dummies.clear();
  bugs.clear();
  hazards();
  fx.clear();
  bossfall.clear();
  flyby.clear();
  special.clear();
  bossdrop.clear();
  drops.clear();
  drone.clear();
  bubble.clear();
  coins.clear();
  combat.clear();
  // Nothing an item bought outlives the round it was found in. The readout is
  // drawn off the player rather than off the mode, so an effect left running
  // here is one still counting down over the menu.
  items.clear(world.player);
  aura.clear();
  // Before the effects: a ring still closing is one the collapse would sound
  // the alarm over again the moment the menu drew its first frame.
  arenaSize.resetSink();
  effects();
  floaters.clear();
  extraction.hideNow();
  watchtower.clear();
  hud.extractPrompt(false);
  hud.clearBanner();
  minimap.hide();
  player.revive(world.player);
  moduleScreen.hide();
}
