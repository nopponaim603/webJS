const fs = require('fs');
const path = require('path');
const https = require('https');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = u.origin + redirectUrl;
        }
        return download(redirectUrl, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed ${url}: HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      try { fs.unlinkSync(dest); } catch (_) {}
      reject(err);
    });
  });
}

async function scrapeAudio() {
  const targetDir = path.join(__dirname, '..', 'public', 'games', 'survive-10-waves');
  const base = 'https://www.survive10waves.com/';

  // Music tracks
  const music = [
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
    'music/Background.m4a',
    'music/Alien Drift Super Boss A.m4a',
    'music/Special/Alien Drift - Special Wave.m4a'
  ];

  // Sound effects
  const sfx = [
    'sounds/gunshot-1.wav',
    'sounds/shotgun.mp3',
    'sounds/rf_rail.mp3',
    'sounds/rf_seeker.mp3',
    'sounds/sg_slug.mp3',
    'sounds/lz_prism.mp3',
    'sounds/lz_rift.mp3',
    'sounds/ln_well.mp3',
    'sounds/ln_emp.mp3',
    'sounds/hit.mp3',
    'sounds/kill.mp3',
    'sounds/kill_grunt.mp3',
    'sounds/kill_runner.mp3',
    'sounds/kill_tank.mp3',
    'sounds/kill_spitter.mp3',
    'sounds/spit.mp3',
    'sounds/coin.mp3',
    'sounds/spithit.mp3',
    'sounds/bugattack.mp3',
    'sounds/huh1.mp3',
    'sounds/huh2.mp3',
    'sounds/huh3.mp3',
    'sounds/huh4.mp3',
    'sounds/hurt_heavy.mp3',
    'sounds/zap.mp3',
    'sounds/zap_drone.mp3',
    'sounds/crit.mp3',
    'sounds/dry.mp3',
    'sounds/launch.mp3',
    'sounds/explode.mp3',
    'sounds/dash.mp3',
    'sounds/wave.mp3',
    'sounds/spawn.mp3',
    'sounds/spawn_blast.mp3',
    'sounds/drone_idle.mp3',
    'sounds/drone_idle2.mp3',
    'sounds/drone_idle3.mp3',
    'sounds/drone_attack.mp3',
    'sounds/drone_attack2.mp3',
    'sounds/drone_attack3.mp3',
    'sounds/drone_switch.mp3',
    'sounds/drone_switch2.mp3',
    'sounds/drone_switch3.mp3',
    'sounds/drone_hurt.mp3',
    'sounds/drone_hurt2.mp3',
    'sounds/drone_arrive.mp3',
    'sounds/story_type.mp3',
    'sounds/story_line.mp3',
    'sounds/ui_hover.mp3',
    'sounds/ui_click.mp3',
    'sounds/tree_hover.mp3',
    'sounds/tree_buy.mp3',
    'sounds/ui_deny.mp3',
    'sounds/travel_card.mp3',
    'sounds/travel_fly.mp3',
    'sounds/travel_open.mp3',
    'sounds/sector_open.mp3',
    'sounds/sector_go.mp3',
    'sounds/rig_heavy.mp3',
    'sounds/rig_piece.mp3',
    'sounds/rig_small.mp3',
    'sounds/rig_lock.mp3',
    'sounds/gun_rack.mp3',
    'sounds/graze.mp3',
    'sounds/charged.mp3',
    'sounds/bank.mp3',
    'sounds/item_take.mp3',
    'sounds/rig_fold.mp3',
    'sounds/rig_stow.mp3',
    'sounds/pad_charge.mp3',
    'sounds/jetpack.mp3',
    'sounds/jetpack_on.mp3',
    'sounds/jetpack_off.mp3',
    'sounds/jet_mine.mp3',
    'sounds/jet_lock.mp3',
    'sounds/jet_deny.mp3',
    'sounds/jet_dive.mp3',
    'sounds/jet_strike.mp3',
    'sounds/collapse_alarm.mp3',
    'sounds/collapse_sonar.mp3',
    'sounds/collapse_rumble.mp3'
  ];

  for (const item of [...sfx, ...music]) {
    const dest = path.join(targetDir, item);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        const encodedUrl = base + encodeURI(item);
        await download(encodedUrl, dest);
        console.log('Downloaded audio:', item);
      } catch (e) {
        console.error('Failed audio:', item, e.message);
      }
    }
  }
}

scrapeAudio().then(() => console.log('Audio download completed!'));
