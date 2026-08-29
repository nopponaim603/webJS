export const CREDITS = [
  {
    head: 'MADE BY',
    rows: [
      { name: 'Tony Dinh', note: 'game design and direction — @tdinh_me',
        link: 'https://x.com/tdinh_me' },
    ],
  },
  {
    head: 'BUILT WITH',
    rows: [
      { name: 'Claude Code', note: 'written alongside the agent, one wave at a time' },
      { name: 'three.js', note: 'WebGL renderer, MIT licence' },
      { name: 'ES modules', note: 'no framework, no build step, no bundler' },
      { name: 'ffmpeg', note: 'every track and sound encoded and normalised' },
    ],
  },
  {
    head: 'ART',
    rows: [
      { name: 'Meshy', note: 'image-to-3D for the sentinel, the bugs and the guns' },
      { name: 'OpenAI', note: 'ground, wall and rock plates' },
      { name: 'Everything else', note: 'procedural — animation, terrain, deployables, effects' },
    ],
  },
  {
    head: 'AUDIO',
    rows: [
      { name: 'Suno', note: 'the soundtrack, listed below' },
      { name: 'ElevenLabs', note: 'every sound effect in the game' },
    ],
  },
  {
    head: 'ALSO IN THE BUILD',
    rows: [
      { name: 'Mechanical Deployables', note: 'the self-assembling structures, open sourced',
        link: 'https://github.com/trungdq88/mechanical-deployables-treejs',
        more: { label: 'TRY THE DEMO →',
                href: 'https://www.survive10waves.com/demo/deployables/' } },
      { name: 'Adaptive Music', note: 'one master track, scored to the wave — open sourced',
        more: { label: 'TRY THE DEMO →',
                href: 'https://www.survive10waves.com/demo/music/' } },
      { name: 'Simple Analytics', note: 'page counts only — no cookies, no profiles' },
    ],
  },
  {
    head: 'INSPIRED BY',
    rows: [
      { name: 'Factorio', note: 'Wube Software — machines that build the base while you fight' },
      { name: 'Alien Shooter', note: 'Sigma Team — the top-down horde, seen from directly above' },
      { name: 'Sentry', note: 'Fredric Brown, 1954 — a short story about who the monster is' },
      { name: 'Control', note: 'Remedy Entertainment — the sector briefings and the dread' },
      { name: 'Helldivers', note: 'Arrowhead — calling something down from orbit onto a mark' },
    ],
  },
];

export const SOUNDTRACK_HEAD = 'SOUNDTRACK';
export const SOUNDTRACK_LINK = {
  label: 'LISTEN AND DOWNLOAD →',
  href: 'https://www.survive10waves.com/soundtracks.html',
};
export const THANKS = 'THANKS FOR PLAYING';
export const DEDICATION = 'Thank you to my beautiful wife for her support during my '
  + '3 weeks obsession of building this game.';
