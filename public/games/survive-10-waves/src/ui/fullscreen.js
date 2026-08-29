// iOS Safari has no Element.requestFullscreen on the phone, only the webkit
// video shim, so the buttons hide rather than sit there doing nothing.
const supported = () => !!(document.documentElement.requestFullscreen
                           || document.documentElement.webkitRequestFullscreen);

const active = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

function enter() {
  const root = document.documentElement;
  const req = root.requestFullscreen || root.webkitRequestFullscreen;
  if (req) Promise.resolve(req.call(root)).catch(() => {});
}

function leave() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (exit && active()) Promise.resolve(exit.call(document)).catch(() => {});
}

// Fullscreen hands ESC to the browser, which would quit the fullscreen instead
// of pausing. Where the Keyboard Lock API exists the key comes back to the page
// and holding it is what leaves; where it does not, P is the way to pause.
function holdEscape(on) {
  if (!navigator.keyboard || !navigator.keyboard.lock) return;
  if (on) navigator.keyboard.lock(['Escape']).catch(() => {});
  else navigator.keyboard.unlock();
}

let wanted = false;
let held = false;
let sync = () => {};

// The pause screen is the way out of the run, so it steps out of fullscreen
// with it and steps back in on resume. `wanted` is the setting and outlives
// that, which is why leaving on a pause must not read as switching it off.
export function suspend() {
  if (!active()) return;
  held = true;
  leave();
}

export function resume() {
  if (!held) return;
  held = false;
  if (wanted) enter();
}

export function init() {
  const buttons = [...document.querySelectorAll('.btn-fullscreen')];
  if (!buttons.length) return;

  if (!supported()) {
    for (const b of buttons) b.classList.add('hidden');
    return;
  }

  sync = () => {
    for (const b of buttons) b.textContent = wanted ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
    holdEscape(active());
  };

  for (const b of buttons) {
    b.onclick = () => {
      wanted = !wanted;
      if (!held) wanted ? enter() : leave();
      sync();
    };
  }

  const changed = () => {
    if (!held) wanted = active();
    sync();
  };
  addEventListener('fullscreenchange', changed);
  addEventListener('webkitfullscreenchange', changed);
  sync();
}
