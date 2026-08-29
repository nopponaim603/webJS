import { CFG } from '../config/index.js';
import { audio } from '../engine/audio.js';
import { touchDevice } from '../mobile/detect.js';

// Delegated from the document rather than bound per button: the module tree, the
// pause rack and the briefing all build their own markup, and a button added
// later is still a button.
const speaks = (el) => el && el.closest && el.closest(CFG.ui.selector);

// The welcome screen is reached before anything has unlocked audio: input.js
// only counts a press on the canvas, on purpose, so a menu click is not also a
// shot — which left every button on that screen silent. A press is a gesture, so
// it is allowed to start the context here.
export function cue(name, synth) {
  audio.resume();
  if (audio.play(name)) return;
  if (audio.ctx && audio.ctx.state === 'running') { audio.blip(synth); return; }
  // Only the first press of a session lands here: resume() has not taken effect
  // yet, so the cue is played on the way back rather than dropped.
  setTimeout(() => { if (!audio.play(name)) audio.blip(synth); }, 80);
}

export function init() {
  const S = CFG.ui.synth;

  // A disabled button dispatches nothing, so a locked NEXT WAVE stays quiet on
  // its own — there is no refusal to play here. Primary button only: a right
  // click on a rack slot is a toggle, and hud.js answers for that one itself.
  document.addEventListener('pointerdown', (e) => {
    if (e.button === 0 && speaks(e.target)) cue('uiClick', S.click);
  }, true);

  if (touchDevice) return;
  document.addEventListener('pointerover', (e) => {
    const btn = speaks(e.target);
    // Moving between a button's own children is not arriving at it.
    if (btn && !(e.relatedTarget && btn.contains(e.relatedTarget))) cue('uiHover', S.hover);
  }, true);
}
