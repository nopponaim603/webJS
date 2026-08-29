import { createRig, seq, ch } from '../contract.js';
import { makeMaterials, ringSeg, chamferBox } from '../stock.js';
import { wreckClip } from '../wreck.js';

const TAU = Math.PI * 2;

function buildClips() {
  const deploy = [
    seq('slab-open', 'slab', 0, 0.66, [ch('position.y', -0.1, -1.78)],
        { sound: { id: 'heavy', rate: 0.72, at: 0 } }),
  ];
  const retract = [];

  for (let i = 0; i < 3; i++) {
    deploy.push(
      seq(`base-${i}-rise`, `base-${i}`, 0.78 + i * 0.06, 0.3,
          [ch('position.y', -0.55, 0.04)],
          { appear: true, sound: { id: 'heavy', rate: 1 + i * 0.04 } }),
      seq(`base-${i}-spread`, `base-${i}`, 1.02 + i * 0.06, 0.28,
          [ch('scale.x', 0.82, 1), ch('scale.z', 0.82, 1)]),
    );
    retract.push(
      seq(`base-${i}-narrow`, `base-${i}`, 2.3 + i * 0.04, 0.24,
          [ch('scale.x', 1, 0.82), ch('scale.z', 1, 0.82)]),
      seq(`base-${i}-sink`, `base-${i}`, 2.62 + i * 0.06, 0.28,
          [ch('position.y', 0.04, -0.55)],
          { vanish: true, sound: { id: 'stow', rate: 0.88 + i * 0.04 } }),
    );
  }

  deploy.push(
    seq('deck-rise', 'deck', 1.16, 0.32, [ch('position.y', -0.62, 0.36)],
        { appear: true, sound: { id: 'piece', rate: 0.9 } }),
    seq('collar-screw', 'collar', 3.0, 0.44,
        [ch('position.y', 0.6, 1.06), ch('rotation.y', 0, -2 * TAU)], { appear: true }),
  );
  retract.push(
    seq('collar-unscrew', 'collar', 0.55, 0.4,
        [ch('position.y', 1.06, 0.6), ch('rotation.y', -2 * TAU, 0)], { vanish: true }),
    seq('deck-sink', 'deck', 2.35, 0.3, [ch('position.y', 0.36, -0.62)],
        { vanish: true, sound: { id: 'stow', rate: 0.95 } }),
  );

  const columnY = [[0.14, 1.0], [1.02, 1.72], [1.76, 2.44]];
  columnY.forEach(([from, to], i) => {
    deploy.push(seq(`column-${i}-rise`, `column-${i}`, 1.52 + i * 0.38, 0.42,
                    [ch('position.y', from, to)],
                    { appear: true, sound: { id: 'heavy', rate: 1.02 + i * 0.1 } }));
    retract.push(seq(`column-${i}-sink`, `column-${i}`, 1.94 - i * 0.32, 0.36,
                     [ch('position.y', to, from)],
                     { vanish: true, sound: { id: 'stow', rate: 1 + i * 0.075 } }));
  });

  deploy.push(
    seq('slab-reseal', 'slab', 3.1, 0.4, [ch('position.y', -1.78, -0.1)],
        { sound: { id: 'heavy', rate: 0.78 } }),
    seq('head-lift', 'head', 2.72, 0.6, [ch('position.y', 0.2, 3.06)],
        { appear: true, sound: { id: 'piece', rate: 1.05 } }),
    seq('latch', 'head', 4.25, 0.12, [ch('position.y', 3.06, 3.02)],
        { sound: { id: 'lock', at: 1 } }),
  );
  retract.push(seq('head-lower', 'head', 0.65, 0.6, [ch('position.y', 3.02, 0.2)],
                   { vanish: true, sound: { id: 'stow', rate: 1.05 } }));

  for (let i = 0; i < 4; i++) {
    deploy.push(seq(`petal-${i}-open`, `petal-${i}`, 3.5 + i * 0.1, 0.36,
                    [ch('rotation.z', 1.35, 0.35)],
                    { sound: { id: 'servo', rate: 1 + i * 0.07, at: 0 } }));
    retract.push(seq(`petal-${i}-close`, `petal-${i}`, (3 - i) * 0.09, 0.32,
                     [ch('rotation.z', 0.35, 1.35)],
                     { sound: { id: 'servo', rate: 0.85 + i * 0.05, at: 0 } }));
  }

  retract.push(seq('slab-reopen', 'slab', 0.35, 0.4, [ch('position.y', -0.1, -1.78)],
                   { sound: { id: 'heavy', rate: 0.72, at: 0 } }),
               seq('slab-seal', 'slab', 3.05, 0.56, [ch('position.y', -1.78, -0.1)],
                   { sound: { id: 'heavy', rate: 0.72 } }),
               seq('seam-sink-slab', 'slab', 3.66, 0.24, [ch('position.y', -0.1, -0.2)],
                   { vanish: true }),
               seq('seam-sink-shaft', 'shaft', 3.66, 0.24, [ch('position.y', 0, -0.15)],
                   { vanish: true }));

  for (const s of deploy) s.at += 0.28;
  deploy.unshift(
    seq('seam-rise-slab', 'slab', 0, 0.22, [ch('position.y', -0.2, -0.1)], { appear: true }),
    seq('seam-rise-shaft', 'shaft', 0, 0.22, [ch('position.y', -0.15, 0)], { appear: true }),
  );

  return {
    deploy: { name: 'deploy', sequences: deploy },
    retract: { name: 'retract', sequences: retract },
  };
}

export function createWatchtower({ THREE, playSound = null, speed = 1.5 } = {}) {
  const mat = makeMaterials(THREE);
  const root = new THREE.Group();
  root.name = 'watchtower';
  const parts = [];

  const add = (name, group, index, object, explode) => {
    object.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    parts.push({ name, group, index, object, explode });
    return object;
  };

  const shaft = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.34, 0.07, 8, 48).rotateX(Math.PI / 2), mat.dark);
  rim.position.y = 0.05;
  shaft.add(rim);
  root.add(add('shaft', 'terrain', 0, shaft, [0, -0.6, 0]));

  const slab = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.24, 0.26, 40), mat.soil);
  slab.position.y = -0.1;
  root.add(add('slab', 'terrain', 1, slab, [0, -2.2, 0]));

  for (let i = 0; i < 3; i++) {
    const a0 = (i / 3) * TAU + 0.05, a1 = ((i + 1) / 3) * TAU - 0.05;
    const m = new THREE.Mesh(ringSeg(THREE, 1.3, 2.05, a0, a1, 0.38), i % 2 ? mat.dark : mat.metal);
    m.position.y = 0.04;
    const mid = (a0 + a1) / 2;
    root.add(add(`base-${i}`, 'base', i, m, [Math.cos(mid) * 1.5, 0.15, -Math.sin(mid) * 1.5]));
  }

  const deck = new THREE.Group();
  deck.add(new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.34, 0.34, 28), mat.metal));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.36, 0.12, 28, 1, true), mat.hazard);
  band.position.y = 0.06;
  const ledRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 8, 40).rotateX(Math.PI / 2), mat.led);
  ledRing.position.y = 0.19;
  deck.add(band, ledRing);
  deck.position.y = 0.36;
  root.add(add('deck', 'deck', 0, deck, [0, 0.5, 0]));

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 20),
                                [mat.hazard, mat.dark, mat.dark]);
  collar.position.y = 1.06;
  root.add(add('collar', 'collar', 0, collar, [1.5, 0.3, 0]));

  const columnSpec = [[0.6, 0.66, 0.95, 18, 1.0], [0.48, 0.53, 0.9, 16, 1.72],
                      [0.38, 0.42, 0.9, 14, 2.44]];
  columnSpec.forEach(([rt, rb, h, segs, y], i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), i === 1 ? mat.dark : mat.metal);
    m.position.y = y;
    root.add(add(`column-${i}`, 'column', i, m, [0, 1 + i * 0.8, 0]));
  });

  const head = new THREE.Group();
  head.add(new THREE.Mesh(chamferBox(THREE, 1.2, 0.62, 1.2), mat.dark));
  const visor = new THREE.Mesh(chamferBox(THREE, 0.92, 0.14, 0.05), mat.led);
  visor.position.set(0, 0.06, 0.61);
  head.add(visor);
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8), mat.dark);
    post.position.set(sx * 0.45, 0.39, -0.45);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat.beacon);
    bulb.position.set(sx * 0.45, 0.5, -0.45);
    head.add(post, bulb);
  }
  head.position.y = 3.02;
  root.add(add('head', 'head', 0, head, [0, 1.6, 0]));

  for (let i = 0; i < 4; i++) {
    const a = i * (TAU / 4);
    const hinge = new THREE.Group();
    hinge.position.set(Math.cos(a) * 0.6, 0.31, -Math.sin(a) * 0.6);
    hinge.rotation.y = a;
    hinge.rotation.z = 0.35;
    const blade = new THREE.Mesh(chamferBox(THREE, 0.6, 0.05, 0.82), mat.metal);
    blade.position.x = 0.32;
    const tip = new THREE.Mesh(chamferBox(THREE, 0.05, 0.06, 0.82), mat.led);
    tip.position.x = 0.62;
    hinge.add(blade, tip);
    head.add(hinge);
    add(`petal-${i}`, 'petal', i, hinge, [Math.cos(a) * 1.1, 0.5, -Math.sin(a) * 1.1]);
  }

  const clips = buildClips();
  clips.destroyed = wreckClip(THREE, {
    root, parts,
    impacts: ['head', 'deck', 'column-0', 'column-1', 'column-2'],
  });

  const rig = createRig({
    name: 'watchtower',
    root,
    parts,
    clips,
    playSound,
    fx({ clock, clip }) {
      const dead = clip === 'destroyed';
      mat.led.emissiveIntensity = dead ? 0 : 1.2 + Math.sin(clock * 3) * 0.45;
      mat.beacon.emissiveIntensity = dead ? 0 : (Math.sin(clock * 4.2) > 0.55 ? 2.4 : 0.15);
    },
  });
  rig.setSpeed(speed);
  return rig;
}

export default createWatchtower;
