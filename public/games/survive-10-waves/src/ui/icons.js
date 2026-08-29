// Drawn rather than typed: a glyph out of the font is at the mercy of whatever
// the platform has, and these have to read at 12px on a chip. The paths are
// bare so each caller can wrap them at the size and class it needs.
export const KEY = '<circle cx="8" cy="12" r="4" /><path d="M12 12h9M17 12v4M20.5 12v3" />';

export const LOCK = '<path d="M8 10V7.5a4 4 0 0 1 8 0V10" />'
  + '<rect x="5" y="10" width="14" height="10" rx="2" />';

export const CLOCK = '<circle cx="12" cy="12" r="9" /><path d="M12 7v5.4l3.4 2" />';

export const DRONE = '<circle cx="6" cy="7.5" r="2.6" /><circle cx="18" cy="7.5" r="2.6" />'
  + '<circle cx="6" cy="16.5" r="2.6" /><circle cx="18" cy="16.5" r="2.6" />'
  + '<path d="M8 9.5 10.5 11M16 9.5 13.5 11M8 14.5 10.5 13M16 14.5 13.5 13" />'
  + '<rect x="10.5" y="10.5" width="3" height="3" />';

// The mouse with one of its buttons lit: a legend that has to say which side is
// answering says it in the shape of the button rather than in words.
const MOUSE_BODY = '<rect x="6.6" y="2.6" width="10.8" height="18.8" rx="5.4" />'
  + '<path d="M6.6 9.2h10.8M12 2.6v6.6" />';

export const MOUSE = {
  left: '<path class="lit" d="M11.5 9.2V2.62A5.4 5.4 0 0 0 6.6 8v1.2z" />' + MOUSE_BODY,
  right: '<path class="lit" d="M12.5 9.2V2.62A5.4 5.4 0 0 1 17.4 8v1.2z" />' + MOUSE_BODY,
};

export const svg = (paths, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${paths}</svg>`;
