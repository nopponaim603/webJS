import * as store from '../core/store.js';

const KEY = 'survive10.volume';

const clamp = (v) => Math.min(1, Math.max(0, v));
const saved = store.load(KEY) || {};
const level = (v) => (typeof v === 'number' ? clamp(v) : 1);
const watchers = [];

export const volume = {
  music: level(saved.music),
  sfx: level(saved.sfx),
  set(kind, v) {
    this[kind] = clamp(v);
    store.save(KEY, { music: this.music, sfx: this.sfx });
    for (const fn of watchers) fn(this);
  },
  watch(fn) {
    watchers.push(fn);
    fn(this);
  },
};
