import { state } from '../core/world.js';
import * as modules from './index.js';
import * as fmt from '../ui/format.js';

const MOD = new Map(modules.MODULES.map((u) => [u.id, u]));

// One tooltip, built once: the tree editor shows the very thing the player will
// read, so copy and numbers can be tuned against the real card.
export function tipHTML(node, coins = state.coins) {
  const u = MOD.get(node.id);
  if (!u) return '';

  const owned = modules.ownsNode(node.key);
  const miss = modules.nodeMissing(node.key);

  const stat = modules.previewAt(node.id, node.level)
    .map((p) => `<div class="t-stat${p.before === undefined ? ' t-one' : ''}">`
      + `<span class="s-label">${p.label}</span>`
      + (p.before === undefined ? ''
        : `<span class="s-from">${p.before}</span><span class="s-arrow">&#8594;</span>`)
      + `<span class="s-to">${p.after}</span></div>`)
    .join('');

  const foot = owned
    ? '<div class="t-owned">OWNED</div>'
    : miss.length
      ? `<div class="t-lock">${miss.map((m) => `${m.name} ${m.need}`).join(' · ')}</div>`
      : `<div class="t-cost${coins >= node.cost ? '' : ' short'}">`
        + `<span class="coin-dot"></span>${fmt.coins(node.cost)}</div>`;

  const top = modules.endless(node.id) ? '&infin;' : modules.maxLevel(node.id);

  return `<div class="t-head"><span class="t-name">${u.name}</span>`
    + `<span class="t-lv">${node.level}/${top}</span></div>`
    + `<div class="t-blurb">${u.blurb}</div>`
    + stat + foot;
}
