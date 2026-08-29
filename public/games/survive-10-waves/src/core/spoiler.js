const HEADLINE = 'SPOILER ALERT';

const NOTE = [
  "You have reached for the universe's power. That's okay, but know this:",
  'This game is designed for ~2 hours of entertainment. Play it straight and enjoy the pleasant surprises.',
];

const SIGN_OFF = 'See you at extraction. — survive10waves.com';

function tellTheConsole() {
  const headline = 'font: 700 22px/1.5 ui-monospace, monospace; color: #e8590c';
  const body = 'font: 400 14px/1.7 ui-monospace, monospace';
  const quiet = 'font: 400 12px/1.7 ui-monospace, monospace; color: #6f7d8f';
  console.log(
    `%c⚠ ${HEADLINE} ⚠\n%c\n${NOTE.join('\n\n')}\n%c\n${SIGN_OFF}\n`,
    headline, body, quiet,
  );
}

function tellTheStorage() {
  const lines = [HEADLINE, ...NOTE];
  try {
    lines.forEach((line, i) => {
      localStorage.setItem(`!!! READ THIS ${i + 1} of ${lines.length} !!!`, line);
      const tail = 'z'.repeat(lines.length + 2 - i);
      localStorage.setItem(`${tail} READ THIS ${tail}`, line);
    });
  } catch {}
}

function tellTheTypist() {
  const bait = ['cheat', 'cheats', 'hack', 'hacks', 'god', 'godmode', 'noclip',
                'unlock', 'unlockAll', 'skipWave', 'infiniteAmmo', 'spoilers'];
  const message = [HEADLINE, ...NOTE, SIGN_OFF].join('\n\n');
  for (const name of bait) {
    if (name in window) continue;
    Object.defineProperty(window, name, {
      get: () => message,
      configurable: true,
      enumerable: true,
    });
  }
}

export function leaveSpoilerNote() {
  tellTheConsole();
  tellTheStorage();
  tellTheTypist();
}
