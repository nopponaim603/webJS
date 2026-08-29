export const TRACKS = [
  'music/Alien Drift A.m4a',
  'music/Alien Drift B.m4a',
  'music/Alien Drift Boss A.m4a',
  'music/Alien Drift Boss B.m4a',
  'music/Alien Drift Boss C.m4a',
  'music/Alien Drift Boss D.m4a',
  'music/Alien Drift Boss E.m4a',
  'music/Alien Drift_ Quantum Sector A.m4a',
  'music/Alien Drift_ Quantum Sector B.m4a',
  'music/Alien Drift_ Silent Quantum Sector A.m4a',
  'music/Alien Drift_ Silent Quantum Sector B.m4a',
  'music/Subterranean Pulse A.m4a',
  'music/Subterranean Pulse B.m4a',
];

// Off the shuffle. The menu keeps its own loop, and a wave listed here owns the
// deck: reaching it fades out whatever the shuffle had up and plays this from
// the top instead.
export const MENU_TRACK = 'music/Background.m4a';
export const WAVE_TRACKS = { 15: 'music/Alien Drift Super Boss A.m4a' };

// A track a wave plays itself, through Web Audio rather than the deck. It lives
// under music/Special/ so sync_tracks.py cannot see it, and is named here so the
// shuffle is filtered against it either way.
export const SPECIAL_TRACK = 'music/Special/Alien Drift - Special Wave.m4a';

// Everything the shuffle must never reach. sync_tracks.py reads these three
// declarations out of this file, so a track named here is kept off TRACKS
// however it is organised on disk.
export const OFF_SHUFFLE = [MENU_TRACK, SPECIAL_TRACK, ...Object.values(WAVE_TRACKS)];
