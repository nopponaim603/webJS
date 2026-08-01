/* FrontWars - Real-Time Strategy & Territory Domination Engine */

class SoundEngine {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playSelect() { this.playTone(520, 'sine', 0.08, 0.08); }
  playDispatch() {
    this.playTone(340, 'triangle', 0.1, 0.1);
    setTimeout(() => this.playTone(440, 'triangle', 0.12, 0.08), 50);
  }
  playCapture() {
    [440, 554, 659, 880].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.15, 0.12), idx * 60);
    });
  }
  playLoss() {
    [300, 260, 220].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.2, 0.1), idx * 80);
    });
  }
  playBuild() {
    this.playTone(600, 'square', 0.08, 0.06);
    setTimeout(() => this.playTone(800, 'square', 0.12, 0.06), 60);
  }
}

class FrontWarsGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundEngine();

    // Game state
    this.attackRatio = 0.50;
    this.gameSpeed = 2; // 1x, 2x, 4x
    this.isPaused = false;
    this.selectedProvince = null;
    this.hoveredProvince = null;
    this.mouseX = 0;
    this.mouseY = 0;

    this.provinces = [];
    this.connections = [];
    this.marchingTroops = [];
    this.particles = [];
    this.factions = {
      player:  { id: 'player',  name: 'สหพันธรัฐบลู (Player)', color: '#3b82f6', border: '#60a5fa', isAI: false },
      red:     { id: 'red',     name: 'จักรวรรดิเรด',          color: '#ef4444', border: '#f87171', isAI: true },
      green:   { id: 'green',   name: 'สาธารณรัฐกรีน',         color: '#10b981', border: '#34d399', isAI: true },
      yellow:  { id: 'yellow',  name: 'พันธมิตรเยลโลว์',       color: '#f59e0b', border: '#fbbf24', isAI: true },
      neutral: { id: 'neutral', name: 'ดินแดนเป็นกลาง',       color: '#4b5563', border: '#6b7280', isAI: false }
    };

    this.lastTime = 0;
    this.growthTimer = 0;
    this.aiTimer = 0;
    this.gameOver = false;

    this.initCanvasSize();
    this.setupEventListeners();
    this.startNewGame();
    this.gameLoop(0);
  }

  initCanvasSize() {
    const wrapper = this.canvas.parentElement;
    this.canvas.width = wrapper.clientWidth;
    this.canvas.height = wrapper.clientHeight;
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.render();
    });

    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;

      this.hoveredProvince = this.provinces.find(p => 
        Math.hypot(p.x - this.mouseX, p.y - this.mouseY) <= p.radius + 4
      );
    });

    // Sidebar Toggle
    const sidebar = document.getElementById('tactical-sidebar');
    document.getElementById('btn-sidebar-toggle').addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      setTimeout(() => {
        this.initCanvasSize();
        this.render();
      }, 320);
      this.sound.playSelect();
    });

    // Ratio UI
    document.querySelectorAll('.ratio-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.attackRatio = parseFloat(btn.dataset.ratio);
        document.getElementById('ratio-slider').value = this.attackRatio * 100;
        document.getElementById('ratio-display').innerText = `${Math.round(this.attackRatio * 100)}%`;
        this.sound.playSelect();
      });
    });

    const ratioSlider = document.getElementById('ratio-slider');
    ratioSlider.addEventListener('input', (e) => {
      this.attackRatio = parseInt(e.target.value) / 100;
      document.getElementById('ratio-display').innerText = `${e.target.value}%`;
    });

    // Speed Controls
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gameSpeed = parseInt(btn.dataset.speed);
        this.isPaused = false;
        document.getElementById('btn-pause').classList.remove('active');
        this.sound.playSelect();
      });
    });

    document.getElementById('btn-pause').addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      document.getElementById('btn-pause').classList.toggle('active', this.isPaused);
      this.sound.playSelect();
    });

    document.getElementById('btn-sound').addEventListener('click', (e) => {
      this.sound.enabled = !this.sound.enabled;
      e.currentTarget.querySelector('i').className = this.sound.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    });

    // Modals
    const helpModal = document.getElementById('modal-help');
    document.getElementById('btn-help').addEventListener('click', () => helpModal.classList.remove('hidden'));
    helpModal.querySelector('.modal-close').addEventListener('click', () => helpModal.classList.add('hidden'));

    document.getElementById('btn-new-game').addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-restart').addEventListener('click', () => {
      document.getElementById('modal-gameover').classList.add('hidden');
      this.startNewGame();
    });

    document.getElementById('card-close').addEventListener('click', () => this.closeCard());
  }

  startNewGame() {
    this.gameOver = false;
    this.selectedProvince = null;
    this.marchingTroops = [];
    this.particles = [];
    this.closeCard();

    this.generateMap();
    this.logEvent('เริ่มสงครามยึดครองครั้งใหม่! เลือกยูนิตของคุณเพื่อเริ่มบุกยึด', 'sys');
    this.sound.playSelect();
  }

  generateMap() {
    this.provinces = [];
    this.connections = [];

    const width = this.canvas.width;
    const height = this.canvas.height;

    const paddingX = 70;
    const paddingY = 40;
    const availableW = width - paddingX * 2;
    const availableH = height - paddingY * 2;

    const cols = Math.max(3, Math.floor(availableW / 120));
    const rows = Math.max(3, Math.floor(availableH / 110));

    const startX = paddingX + (availableW - cols * 110) / 2 + 40;
    const startY = paddingY + (availableH - rows * 95) / 2 + 40;

    let idCounter = 0;
    const gridMap = [];

    for (let r = 0; r < rows; r++) {
      gridMap[r] = [];
      for (let c = 0; c < cols; c++) {
        const jitterX = (Math.random() - 0.5) * 16;
        const jitterY = (Math.random() - 0.5) * 16;
        const x = startX + c * 110 + (r % 2 === 1 ? 55 : 0) + jitterX;
        const y = startY + r * 90 + jitterY;

        let terrain = 'plains';
        const isBorder = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
        const rand = Math.random();

        if (isBorder && rand > 0.45) {
          terrain = 'water';
        } else if (rand > 0.85) {
          terrain = 'mountain';
        }

        const province = {
          id: idCounter++,
          name: `ยุทธบริเวณ #${idCounter}`,
          x, y,
          radius: 34,
          terrain,
          owner: 'neutral',
          troops: terrain === 'water' ? 0 : Math.floor(Math.random() * 15) + 5,
          building: null,
          pulse: 0
        };

        this.provinces.push(province);
        gridMap[r][c] = province;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const current = gridMap[r][c];
        const neighbors = [
          [r, c + 1],
          [r + 1, c],
          [r + 1, c + (r % 2 === 1 ? 1 : -1)]
        ];

        neighbors.forEach(([nr, nc]) => {
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const neighbor = gridMap[nr][nc];
            const dist = Math.hypot(current.x - neighbor.x, current.y - neighbor.y);
            if (dist < 155) {
              this.connections.push({ from: current.id, to: neighbor.id });
            }
          }
        });
      }
    }

    const landProvinces = this.provinces.filter(p => p.terrain !== 'water');
    if (landProvinces.length < 4) return;

    landProvinces.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    const p1 = landProvinces[0];
    const p2 = landProvinces[landProvinces.length - 1];

    landProvinces.sort((a, b) => (a.x - a.y) - (b.x - b.y));
    const p3 = landProvinces[0];
    const p4 = landProvinces[landProvinces.length - 1];

    const assigns = [
      { p: p1, owner: 'player', name: 'กองบัญชาการใหญ่ (Player)' },
      { p: p2, owner: 'red', name: 'ฐานป้อมเรด' },
      { p: p3, owner: 'green', name: 'ศูนย์บัญชาการกรีน' },
      { p: p4, owner: 'yellow', name: 'ป้อมปราการเยลโลว์' }
    ];

    assigns.forEach(({ p, owner, name }) => {
      p.owner = owner;
      p.troops = 50;
      p.building = 'city';
      p.name = name;
    });
  }

  handleCanvasClick(e) {
    if (this.gameOver || this.isPaused) return;

    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clicked = this.provinces.find(p => Math.hypot(p.x - clickX, p.y - clickY) <= p.radius + 5);

    if (clicked) {
      if (!this.selectedProvince) {
        if (clicked.owner === 'player') {
          this.selectedProvince = clicked;
          this.sound.playSelect();
          this.openCard(clicked);
        }
      } else {
        if (this.selectedProvince.id === clicked.id) {
          this.selectedProvince = null;
          this.closeCard();
        } else if (clicked.owner === 'player') {
          this.selectedProvince = clicked;
          this.sound.playSelect();
          this.openCard(clicked);
        } else {
          if (this.isConnected(this.selectedProvince.id, clicked.id)) {
            this.dispatchTroops(this.selectedProvince, clicked);
          } else {
            if (this.selectedProvince.building === 'port' || clicked.building === 'port') {
              this.dispatchTroops(this.selectedProvince, clicked);
            }
          }
        }
      }
    } else {
      this.selectedProvince = null;
      this.closeCard();
    }
  }

  isConnected(p1Id, p2Id) {
    return this.connections.some(c => 
      (c.from === p1Id && c.to === p2Id) || (c.from === p2Id && c.to === p1Id)
    );
  }

  dispatchTroops(source, target) {
    if (source.troops <= 1) return;

    const sendCount = Math.max(1, Math.floor((source.troops - 1) * this.attackRatio));
    source.troops -= sendCount;

    this.marchingTroops.push({
      fromId: source.id,
      toId: target.id,
      startX: source.x, startY: source.y,
      targetX: target.x, targetY: target.y,
      x: source.x, y: source.y,
      count: sendCount,
      owner: source.owner,
      progress: 0,
      speed: 0.012 * this.gameSpeed
    });

    this.sound.playDispatch();
  }

  openCard(province) {
    const defaultBar = document.getElementById('command-bar-default');
    const activeBar = document.getElementById('command-bar-active');

    document.getElementById('card-title').innerText = province.name;
    document.getElementById('card-troops').innerText = province.troops;
    document.getElementById('card-owner').innerText = this.factions[province.owner].name;
    document.getElementById('card-type').innerText = province.terrain === 'mountain' ? 'ภูเขาสูง' : (province.terrain === 'water' ? 'สมุทร' : 'ที่ราบ');

    const actionsContainer = document.getElementById('card-actions');
    actionsContainer.innerHTML = '';

    if (province.owner === 'player') {
      const cityBtn = document.createElement('button');
      cityBtn.className = 'btn-build';
      cityBtn.innerHTML = `<span><i class="fa-solid fa-city"></i> City</span> <strong>30🪖</strong>`;
      cityBtn.disabled = province.troops < 30 || province.building === 'city';
      cityBtn.onclick = () => this.buildStructure(province, 'city', 30);

      const fortBtn = document.createElement('button');
      fortBtn.className = 'btn-build';
      fortBtn.innerHTML = `<span><i class="fa-solid fa-shield-halved"></i> Fortress</span> <strong>40🪖</strong>`;
      fortBtn.disabled = province.troops < 40 || province.building === 'fortress';
      fortBtn.onclick = () => this.buildStructure(province, 'fortress', 40);

      const portBtn = document.createElement('button');
      portBtn.className = 'btn-build';
      portBtn.innerHTML = `<span><i class="fa-solid fa-anchor"></i> Port</span> <strong>35🪖</strong>`;
      portBtn.disabled = province.troops < 35 || province.building === 'port';
      portBtn.onclick = () => this.buildStructure(province, 'port', 35);

      actionsContainer.appendChild(cityBtn);
      actionsContainer.appendChild(fortBtn);
      actionsContainer.appendChild(portBtn);
    }

    if (defaultBar) defaultBar.classList.add('hidden');
    if (activeBar) activeBar.classList.remove('hidden');
  }

  closeCard() {
    this.selectedProvince = null;
    const defaultBar = document.getElementById('command-bar-default');
    const activeBar = document.getElementById('command-bar-active');

    if (defaultBar) defaultBar.classList.remove('hidden');
    if (activeBar) activeBar.classList.add('hidden');
  }

  buildStructure(province, type, cost) {
    if (province.troops >= cost) {
      province.troops -= cost;
      province.building = type;
      this.sound.playBuild();
      this.openCard(province);
      this.logEvent(`สร้าง ${type.toUpperCase()} ณ ${province.name} สำเร็จ!`, 'sys');
    }
  }

  update(dt) {
    if (this.gameOver || this.isPaused) return;

    this.growthTimer += dt * this.gameSpeed;
    if (this.growthTimer >= 1.0) {
      this.growthTimer = 0;
      this.provinces.forEach(p => {
        if (p.owner !== 'neutral' && p.terrain !== 'water') {
          let growth = 1;
          if (p.building === 'city') growth += 2;
          p.troops = Math.min(999, p.troops + growth);
        }
      });
    }

    this.aiTimer += dt * this.gameSpeed;
    if (this.aiTimer >= 1.5) {
      this.aiTimer = 0;
      this.runAIEngine();
    }

    for (let i = this.marchingTroops.length - 1; i >= 0; i--) {
      const troop = this.marchingTroops[i];
      troop.progress += troop.speed;
      troop.x = troop.startX + (troop.targetX - troop.startX) * troop.progress;
      troop.y = troop.startY + (troop.targetY - troop.startY) * troop.progress;

      if (troop.progress >= 1.0) {
        this.resolveBattle(troop);
        this.marchingTroops.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    this.updateStatsUI();
  }

  resolveBattle(troopGroup) {
    const target = this.provinces.find(p => p.id === troopGroup.toId);
    if (!target) return;

    const attackerFaction = this.factions[troopGroup.owner];

    if (target.owner === troopGroup.owner) {
      target.troops += troopGroup.count;
    } else {
      let defMultiplier = 1.0;
      if (target.building === 'fortress') defMultiplier = 1.8;
      else if (target.terrain === 'mountain') defMultiplier = 1.4;

      const defenderPower = Math.floor(target.troops * defMultiplier);

      if (troopGroup.count > defenderPower) {
        const prevOwner = target.owner;
        target.owner = troopGroup.owner;
        target.troops = Math.max(1, Math.floor((troopGroup.count - defenderPower) * 0.8));
        target.pulse = 1.0;

        this.createParticleBurst(target.x, target.y, attackerFaction.color);

        if (troopGroup.owner === 'player') {
          this.sound.playCapture();
          this.logEvent(`ยึดครอง ${target.name} สำเร็จ!`, 'sys');
        } else if (prevOwner === 'player') {
          this.sound.playLoss();
          this.logEvent(`สูญเสีย ${target.name} ให้แก่ ${attackerFaction.name}!`, 'loss');
        }
      } else {
        const remainingDef = Math.max(1, Math.floor((defenderPower - troopGroup.count) / defMultiplier));
        target.troops = remainingDef;
      }
    }

    if (this.selectedProvince && this.selectedProvince.id === target.id) {
      this.openCard(target);
    }

    this.checkVictoryCondition();
  }

  runAIEngine() {
    Object.keys(this.factions).forEach(fKey => {
      const faction = this.factions[fKey];
      if (!faction.isAI) return;

      const ownedProvinces = this.provinces.filter(p => p.owner === fKey);

      ownedProvinces.forEach(source => {
        if (source.troops > 20) {
          const neighbors = this.provinces.filter(p => 
            p.owner !== fKey && this.isConnected(source.id, p.id)
          );

          if (neighbors.length > 0) {
            neighbors.sort((a, b) => a.troops - b.troops);
            const target = neighbors[0];

            if (source.troops > target.troops * 1.3) {
              const sendCount = Math.floor(source.troops * 0.6);
              source.troops -= sendCount;

              this.marchingTroops.push({
                fromId: source.id,
                toId: target.id,
                startX: source.x, startY: source.y,
                targetX: target.x, targetY: target.y,
                x: source.x, y: source.y,
                count: sendCount,
                owner: fKey,
                progress: 0,
                speed: 0.012 * this.gameSpeed
              });
            }
          } else {
            if (source.troops > 50 && !source.building) {
              source.troops -= 30;
              source.building = Math.random() > 0.5 ? 'city' : 'fortress';
            }
          }
        }
      });
    });
  }

  createParticleBurst(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        radius: Math.random() * 3 + 2
      });
    }
  }

  checkVictoryCondition() {
    const totalLand = this.provinces.filter(p => p.terrain !== 'water').length;
    const playerLand = this.provinces.filter(p => p.owner === 'player').length;
    const playerRatio = playerLand / totalLand;

    if (playerRatio >= 0.70) {
      this.gameOver = true;
      this.showEndGameModal(true);
    } else if (playerLand === 0) {
      this.gameOver = true;
      this.showEndGameModal(false);
    }
  }

  showEndGameModal(isVictory) {
    const modal = document.getElementById('modal-gameover');
    const title = document.getElementById('end-title');
    const msg = document.getElementById('end-message');

    if (isVictory) {
      title.innerHTML = `<i class="fa-solid fa-trophy" style="color:#f59e0b"></i> ชัยชนะอย่างยิ่งใหญ่!`;
      msg.innerText = `ยินดีด้วย! คุณยึดครองพื้นที่ได้สำเร็จและนำความสงบสุขมาสู่แผ่นดิน`;
    } else {
      title.innerHTML = `<i class="fa-solid fa-skull" style="color:#ef4444"></i> พ่ายแพ้แก่ศึกสงคราม!`;
      msg.innerText = `กองทัพของคุณถูกตีพ่ายแพ้ทั้งหมด วางแผนใหม่แล้วกลับมาเอาคืน!`;
    }

    modal.classList.remove('hidden');
  }

  updateStatsUI() {
    const totalProvinces = this.provinces.filter(p => p.terrain !== 'water').length;
    const factionStats = {};

    Object.keys(this.factions).forEach(k => {
      factionStats[k] = { land: 0, troops: 0, income: 0, cities: 0 };
    });

    this.provinces.forEach(p => {
      if (p.terrain !== 'water') {
        const stat = factionStats[p.owner];
        if (stat) {
          stat.land += 1;
          stat.troops += p.troops;
          stat.income += (p.building === 'city' ? 3 : 1);
          if (p.building === 'city') stat.cities += 1;
        }
      }
    });

    const playerStat = factionStats.player;
    const landPct = Math.round((playerStat.land / totalProvinces) * 100);

    document.getElementById('stat-land').innerText = `${landPct}%`;
    document.getElementById('stat-troops').innerText = playerStat.troops;
    document.getElementById('stat-income').innerText = `+${playerStat.income}`;
    document.getElementById('stat-cities').innerText = playerStat.cities;

    const stackedBarEl = document.getElementById('territory-stacked-bar');
    const legendEl = document.getElementById('territory-legend');

    stackedBarEl.innerHTML = '';
    legendEl.innerHTML = '';

    const factionKeys = ['player', 'red', 'green', 'yellow', 'neutral'];

    factionKeys.forEach(fKey => {
      const f = this.factions[fKey];
      const stat = factionStats[fKey];
      const pct = totalProvinces > 0 ? Math.round((stat.land / totalProvinces) * 100) : 0;

      if (pct > 0) {
        const seg = document.createElement('div');
        seg.className = 'bar-segment';
        seg.style.width = `${pct}%`;
        seg.style.backgroundColor = f.color;
        seg.title = `${f.name}: ${pct}% (${stat.troops} ทหาร)`;
        if (pct >= 5) seg.innerText = `${pct}%`;
        stackedBarEl.appendChild(seg);

        const chip = document.createElement('div');
        chip.className = 'legend-chip';
        chip.innerHTML = `
          <span class="chip-dot" style="background-color:${f.color}; color:${f.color}"></span>
          <span>${f.name}</span>
          <span class="chip-pct">${pct}%</span>
          <span style="color:var(--text-muted); font-size:0.7rem">(${stat.troops}🪖)</span>
        `;
        legendEl.appendChild(chip);
      }
    });
  }

  logEvent(text, type = 'sys') {
    const logEl = document.getElementById('event-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerText = text;
    logEl.insertBefore(entry, logEl.firstChild);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Grid Connections
    this.ctx.lineWidth = 2;
    this.connections.forEach(conn => {
      const p1 = this.provinces.find(p => p.id === conn.from);
      const p2 = this.provinces.find(p => p.id === conn.to);
      if (p1 && p2) {
        const isPlayerLine = p1.owner === 'player' || p2.owner === 'player';
        this.ctx.strokeStyle = isPlayerLine ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)';
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }
    });

    // Draw Provinces
    this.provinces.forEach(p => {
      const faction = this.factions[p.owner];

      // Selected Highlight Ring
      if (this.selectedProvince && this.selectedProvince.id === p.id) {
        this.ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius + 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#00f2fe';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }

      // Hovered Ring
      if (this.hoveredProvince && this.hoveredProvince.id === p.id && (!this.selectedProvince || this.selectedProvince.id !== p.id)) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius + 4, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      // Base Circle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = faction.color;
      this.ctx.fill();

      // Border & Terrain indicator
      this.ctx.lineWidth = p.building === 'fortress' ? 4 : 2;
      this.ctx.strokeStyle = p.building === 'fortress' ? '#fbbf24' : faction.border;
      this.ctx.stroke();

      // Building Icons
      if (p.building) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px FontAwesome, sans-serif';
        this.ctx.textAlign = 'center';
        let icon = '🏛️';
        if (p.building === 'fortress') icon = '🛡️';
        if (p.building === 'port') icon = '⚓';
        this.ctx.fillText(icon, p.x, p.y - 12);
      }

      // Troop Count Label
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 13px Orbitron, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(p.troops, p.x, p.y + (p.building ? 8 : 0));
    });

    // Draw Marching Troops
    this.marchingTroops.forEach(t => {
      const faction = this.factions[t.owner];

      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
      this.ctx.fillStyle = faction.color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 10px Orbitron, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(t.count, t.x, t.y);
    });

    // Draw Particles
    this.particles.forEach(pt => {
      this.ctx.save();
      this.ctx.globalAlpha = pt.alpha;
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw Mouse Hover Tooltip
    if (this.hoveredProvince) {
      const hp = this.hoveredProvince;
      const hFaction = this.factions[hp.owner];
      const tipText = `${hp.name} | ${hFaction.name} (${hp.troops}🪖)`;

      this.ctx.font = '12px Prompt, sans-serif';
      const tw = this.ctx.measureText(tipText).width + 16;
      const tx = Math.min(this.canvas.width - tw - 10, Math.max(10, this.mouseX + 12));
      const ty = Math.max(30, this.mouseY - 25);

      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      this.ctx.strokeStyle = hFaction.color;
      this.ctx.lineWidth = 1;
      if (this.ctx.roundRect) {
        this.ctx.roundRect(tx, ty, tw, 26, 6);
      } else {
        this.ctx.rect(tx, ty, tw, 26);
      }
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(tipText, tx + 8, ty + 13);
    }
  }

  gameLoop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new FrontWarsGame();
});
