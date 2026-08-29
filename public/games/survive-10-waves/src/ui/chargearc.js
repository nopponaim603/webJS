// A charge meter drawn as segments of one arc: each whole charge is a dash, the
// one filling is a short one, and the gap between them is a stroke of the arc
// rather than a fraction of it, so twenty charges do not read as one grey line.
function dashArray(charges, max, circumference) {
  const whole = Math.floor(charges + 1e-6);
  const frac = charges - whole;

  const perCharge = circumference / Math.max(1, max);
  const gap = Math.min(0.34, 2.5 / Math.max(1, perCharge));

  const out = [0, gap / 2];
  for (let i = 0; i < whole; i++) out.push(1 - gap, gap);
  if (frac > 0.02) out.push(Math.max(0.02, frac * (1 - gap)), gap);

  out.push(0, max + 2);
  return out.map((v) => +v.toFixed(4)).join(' ');
}

// `circumference` is a call, not a number: the arc is sized in css and a
// stylesheet may say something different once the layer is laid out. `whole`
// says whether the total is a count of charges or a real number: a tank holds
// however many dashes it holds, and rounding that would hide the part of one
// left over at the end of it.
export function createArc(svg, circumference, { whole = true } = {}) {
  const fill = svg.querySelector('.fill');
  const track = svg.querySelector('.track');
  let shownDash = '';
  let shownMax = -1;

  return function sync(charges, max, { show = true, wind = false, warn = false } = {}) {
    svg.classList.toggle('show', !!show);
    svg.classList.toggle('wind', !!wind);
    svg.classList.toggle('dry', !!warn);

    const m = whole ? Math.max(1, Math.round(max)) : Math.max(0.05, max);
    if (m !== shownMax) {
      shownMax = m;
      fill.setAttribute('pathLength', m);
      track.setAttribute('pathLength', m);
      track.style.strokeDasharray = dashArray(m, m, circumference());
      shownDash = '';
    }

    const d = dashArray(Math.max(0, Math.min(m, charges)), m, circumference());
    if (d !== shownDash) { shownDash = d; fill.style.strokeDasharray = d; }
  };
}

export function arcPath(radius, fromDeg, toDeg) {
  const point = (deg) => {
    const a = deg * Math.PI / 180;
    return `${(50 + radius * Math.cos(a)).toFixed(2)} ${(50 - radius * Math.sin(a)).toFixed(2)}`;
  };
  const large = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
  return `M ${point(fromDeg)} A ${radius} ${radius} 0 ${large} 1 ${point(toDeg)}`;
}
