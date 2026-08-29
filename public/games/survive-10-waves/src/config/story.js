// What the screen says, and when. The key is the moment it interrupts: `before`
// a wave starts, or `after` one is cleared. A `/` in the key is a second screen
// for the same moment, put up by whatever ran the first one.
// A value in braces is filled in and drawn as the line's figure — `{dead}` is
// the run's death roll, `{time}` the time spent playing it.
// A key may be prefixed with a sector letter, and that beat is what that sector
// plays instead of the shared one. `repeat` puts a beat up every time its moment
// comes round rather than once a run.
// Every sector tells the same story otherwise:
// `told` lives in the run, so each of them tells it again from the start.
const ARRIVAL = {
  button: 'BEGIN',
  blocks: [
    { label: 'ARRIVAL', text: 'Sector {sector}, there are more of them here.' },
  ],
};

export const STORY = {
  'before:1': {
    button: 'BEGIN',
    blocks: [
      { label: 'MISSION', text: 'Survive 10 waves.' },
    ],
  },
  'B:before:1': ARRIVAL,
  'C:before:1': ARRIVAL,
  'D:before:1': ARRIVAL,
  'E:before:1': ARRIVAL,
  'before:3': {
    button: 'CONTINUE',
    blocks: [
      { label: 'REPORT', text: 'The bugs have evolved.' },
    ],
  },
  // Every attempt: it is a headphones prompt as much as a story beat, and a
  // player coming back to the wave needs it as much as the first time.
  'before:14': {
    repeat: true,
    button: 'CONTINUE',
    // The wave is built on its track, so with the music off the screen offers to
    // put it back on rather than only saying it should be.
    quiet: { on: 'TURN ON MUSIC', off: 'CONTINUE WITHOUT MUSIC' },
    blocks: [
      { label: 'REPORT', text: 'Anomaly detected.' },
      { label: 'SUGGESTION', text: 'Turn on the music and put on headphones.' },
    ],
  },
  'after:10': {
    button: 'CONTINUE',
    blocks: [
      { label: 'CONGRATULATIONS', text: 'You survived 10 waves with {dead} dead.' },
      { label: 'TOTAL PLAY TIME', text: '{time}' },
    ],
  },
  'after:10/debrief': {
    button: 'CONTINUE',
    blocks: [
      { label: 'REPORT', text: 'You can now travel between sectors and waves.' },
      { label: 'NEXT OBJECTIVE', text: 'Unlock a drone at wave 15.' },
    ],
  },
  'after:15': {
    button: 'CONTINUE',
    blocks: [
      { label: 'REPORT', text: 'You have acquired your {nth} drone. It will accompany you in Sector {next}.' },
    ],
  },
  // The last finale wave of the last sector is the end of the game, so it says
  // so, and offers the credits from where the player is standing.
  'E:after:15': {
    button: 'CONTINUE',
    alt: { label: 'ROLL CREDITS', act: 'credits' },
    blocks: [
      { label: 'CONGRATULATIONS', text: 'You have finished the game.' },
      { label: 'REPORT', text: 'There is nothing past Sector {sector}.' },
    ],
  },
  'before:16': {
    button: 'CONTINUE',
    blocks: [
      { label: 'REPORT', text: 'The bugs are getting stronger every wave.' },
    ],
  },
};
