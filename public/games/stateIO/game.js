/* State.IO - Real-Time Strategy & Territory Domination Engine (Offline Mode) */

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
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
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
  playStrike() {
    this.playTone(150, 'sawtooth', 0.3, 0.2);
    setTimeout(() => this.playTone(90, 'square', 0.4, 0.25), 80);
  }
}

class FrontWarsGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundEngine();

    // Game configuration
    this.attackRatio = 0.50;
    this.gameSpeed = 1; // 1x, 2x, 4x (Default 1x for fair human reaction)
    this.mapPreset = 'continental'; // continental, archipelago, duel, ring
    this.difficulty = 'normal'; // easy, normal, hard

    // Selection & Drag state
    this.selectedProvince = null;
    this.hoveredProvince = null;
    this.isDragging = false;
    this.dragStartProvinces = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.dpr = window.devicePixelRatio || 1;

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
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    // Recalculate pixel coordinates based on normalized ratios
    if (this.provinces && this.provinces.length > 0) {
      const paddingX = 60;
      const paddingY = 50;
      const drawW = w - paddingX * 2;
      const drawH = h - paddingY * 2;

      this.provinces.forEach(p => {
        if (p.nx !== undefined && p.ny !== undefined) {
          p.x = paddingX + p.nx * drawW;
          p.y = paddingY + p.ny * drawH;
        }
      });
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.render();
    });

    // Mouse / Touch Event Handlers
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handlePointerDown = (e) => {
      this.sound.init();
      if (this.gameOver || this.isPaused) return;
      const pos = getPos(e);
      this.mouseX = pos.x;
      this.mouseY = pos.y;

      const clicked = this.findProvinceAt(pos.x, pos.y);
      if (clicked && clicked.owner === 'player') {
        this.isDragging = true;
        this.dragStartProvinces = [clicked];
        this.selectedProvince = clicked;
        this.openCard(clicked);
        this.sound.playSelect();
      } else {
        this.dragStartProvinces = [];
      }
    };

    const handlePointerMove = (e) => {
      const pos = getPos(e);
      this.mouseX = pos.x;
      this.mouseY = pos.y;
      this.hoveredProvince = this.findProvinceAt(pos.x, pos.y);

      if (this.isDragging) {
        if (this.hoveredProvince && this.hoveredProvince.owner === 'player') {
          if (!this.dragStartProvinces.some(p => p.id === this.hoveredProvince.id)) {
            this.dragStartProvinces.push(this.hoveredProvince);
            this.sound.playSelect();
          }
        }
      }
    };

    const handlePointerUp = (e) => {
      if (this.isDragging && this.dragStartProvinces && this.dragStartProvinces.length > 0) {
        const target = this.hoveredProvince;
        if (target) {
          let dispatchedCount = 0;
          this.dragStartProvinces.forEach(src => {
            if (src.id !== target.id && this.canAttack(src, target)) {
              if (src.troops > 1) {
                this.dispatchTroops(src, target);
                dispatchedCount++;
              }
            }
          });

          if (dispatchedCount > 0) {
            if (target.owner === 'player') {
              this.logEvent(`ส่งกำลังพลจาก ${dispatchedCount} โหนดไปเสริม ณ ${target.name}!`, 'sys');
            } else {
              this.logEvent(`สั่งเปิดการบุกรวม ${dispatchedCount} ฐานไปยัง ${target.name}!`, 'sys');
            }
          }
        }
      } else if (!this.isDragging && !e.touches) {
        const clicked = this.findProvinceAt(this.mouseX, this.mouseY);
        this.handleCanvasClick(clicked);
      }
      this.isDragging = false;
      this.dragStartProvinces = [];
    };

    this.canvas.addEventListener('mousedown', handlePointerDown);
    this.canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    this.canvas.addEventListener('touchstart', (e) => { handlePointerDown(e); e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => { handlePointerMove(e); e.preventDefault(); }, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    // Sidebar Toggle
    const sidebar = document.getElementById('tactical-sidebar');
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        setTimeout(() => {
          this.initCanvasSize();
          this.render();
        }, 320);
        this.sound.playSelect();
      });
    }

    // Ratio Controls
    document.querySelectorAll('.ratio-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.attackRatio = parseFloat(btn.dataset.ratio);
        const slider = document.getElementById('ratio-slider');
        if (slider) slider.value = this.attackRatio * 100;
        const display = document.getElementById('ratio-display');
        if (display) display.innerText = `${Math.round(this.attackRatio * 100)}%`;
        this.sound.playSelect();
      });
    });

    const ratioSlider = document.getElementById('ratio-slider');
    if (ratioSlider) {
      ratioSlider.addEventListener('input', (e) => {
        this.attackRatio = parseInt(e.target.value) / 100;
        const display = document.getElementById('ratio-display');
        if (display) display.innerText = `${e.target.value}%`;
      });
    }

    // Speed Controls
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gameSpeed = parseInt(btn.dataset.speed);
        this.isPaused = false;
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) pauseBtn.classList.remove('active');
        this.sound.playSelect();
      });
    });

    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.isPaused = !this.isPaused;
        pauseBtn.classList.toggle('active', this.isPaused);
        this.sound.playSelect();
      });
    }

    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        this.sound.enabled = !this.sound.enabled;
        e.currentTarget.querySelector('i').className = this.sound.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
      });
    }

    // Modals
    const helpModal = document.getElementById('modal-help');
    const helpBtn = document.getElementById('btn-help');
    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
      const closeBtn = helpModal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
    }

    const newGameBtn = document.getElementById('btn-new-game');
    if (newGameBtn) newGameBtn.addEventListener('click', () => this.startNewGame());

    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        const gameoverModal = document.getElementById('modal-gameover');
        if (gameoverModal) gameoverModal.classList.add('hidden');
        this.startNewGame();
      });
    }

    const cardClose = document.getElementById('card-close');
    if (cardClose) cardClose.addEventListener('click', () => this.closeCard());
  }

  findProvinceAt(x, y) {
    return this.provinces.find(p => Math.hypot(p.x - x, p.y - y) <= p.radius + 6);
  }

  canAttack(source, target) {
    if (!source || !target || source.id === target.id) return false;
    return true; // In State.IO mode, any node can dispatch troops to reinforce or attack any target node
  }

  startNewGame() {
    this.gameOver = false;
    this.selectedProvince = null;
    this.dragStartProvinces = [];
    this.marchingTroops = [];
    this.particles = [];
    this.closeCard();

    this.generateMap();
    this.logEvent('ยุทธการเริ่มแล้ว! ลากเส้นจากฐานของคุณ หรือคลิกเป้าหมายเพื่อยึดครองดินแดน', 'sys');
    this.sound.playSelect();
  }

  generateMap() {
    this.provinces = [];
    this.connections = [];

    const wrapper = this.canvas.parentElement;
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    const paddingX = 60;
    const paddingY = 50;
    const drawW = w - paddingX * 2;
    const drawH = h - paddingY * 2;

    const cols = Math.max(4, Math.floor(drawW / 115));
    const rows = Math.max(4, Math.floor(drawH / 100));

    let idCounter = 0;
    const gridMap = [];

    for (let r = 0; r < rows; r++) {
      gridMap[r] = [];
      for (let c = 0; c < cols; c++) {
        const jitterX = (Math.random() - 0.5) * 0.05;
        const jitterY = (Math.random() - 0.5) * 0.05;

        let baseNx = (c + 0.5 + (r % 2 === 1 ? 0.35 : 0)) / cols + jitterX;
        let baseNy = (r + 0.5) / rows + jitterY;

        baseNx = Math.max(0.05, Math.min(0.95, baseNx));
        baseNy = Math.max(0.05, Math.min(0.95, baseNy));

        let terrain = 'plains';
        const isBorder = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
        const rand = Math.random();

        if (isBorder && rand > 0.40) {
          terrain = 'water';
        } else if (rand > 0.82) {
          terrain = 'mountain';
        }

        const province = {
          id: idCounter++,
          name: `ยุทธบริเวณ #${idCounter}`,
          nx: baseNx,
          ny: baseNy,
          x: paddingX + baseNx * drawW,
          y: paddingY + baseNy * drawH,
          radius: 32,
          terrain,
          owner: 'neutral',
          troops: terrain === 'water' ? 0 : Math.floor(Math.random() * 12) + 6,
          building: null,
          pulse: 0
        };

        this.provinces.push(province);
        gridMap[r][c] = province;
      }
    }

    // Connect Neighboring Nodes
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
            if (dist < 160) {
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
      { p: p1, owner: 'player', name: 'กองบัญชาการบลู (Player)' },
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

  handleCanvasClick(clicked) {
    if (this.gameOver || this.isPaused) return;

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
          if (this.canAttack(this.selectedProvince, clicked)) {
            this.dispatchTroops(this.selectedProvince, clicked);
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
      speed: 0.015 * this.gameSpeed
    });

    this.sound.playDispatch();
  }

  openCard(province) {
    const defaultBar = document.getElementById('command-bar-default');
    const activeBar = document.getElementById('command-bar-active');

    const cardTitle = document.getElementById('card-title');
    const cardTroops = document.getElementById('card-troops');
    const cardOwner = document.getElementById('card-owner');
    const cardType = document.getElementById('card-type');

    if (cardTitle) cardTitle.innerText = province.name;
    if (cardTroops) cardTroops.innerText = province.troops;
    if (cardOwner) cardOwner.innerText = this.factions[province.owner].name;
    if (cardType) cardType.innerText = province.terrain === 'mountain' ? 'ภูเขาสูง' : (province.terrain === 'water' ? 'สมุทร' : 'ที่ราบ');

    const actionsContainer = document.getElementById('card-actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';

      if (province.owner === 'player') {
        const cityBtn = document.createElement('button');
        cityBtn.className = 'btn-build';
        cityBtn.innerHTML = `<span><i class="fa-solid fa-city"></i> City (เมือง)</span> <strong>30🪖</strong>`;
        cityBtn.disabled = province.troops < 30 || province.building === 'city';
        cityBtn.onclick = () => this.buildStructure(province, 'city', 30);

        const fortBtn = document.createElement('button');
        fortBtn.className = 'btn-build';
        fortBtn.innerHTML = `<span><i class="fa-solid fa-shield-halved"></i> Fortress (ป้อม)</span> <strong>40🪖</strong>`;
        fortBtn.disabled = province.troops < 40 || province.building === 'fortress';
        fortBtn.onclick = () => this.buildStructure(province, 'fortress', 40);

        const portBtn = document.createElement('button');
        portBtn.className = 'btn-build';
        portBtn.innerHTML = `<span><i class="fa-solid fa-anchor"></i> Port (ท่าเรือ)</span> <strong>35🪖</strong>`;
        portBtn.disabled = province.troops < 35 || province.building === 'port';
        portBtn.onclick = () => this.buildStructure(province, 'port', 35);

        const airBtn = document.createElement('button');
        airBtn.className = 'btn-build';
        airBtn.innerHTML = `<span><i class="fa-solid fa-plane"></i> Airbase (ฐานบิน)</span> <strong>50🪖</strong>`;
        airBtn.disabled = province.troops < 50 || province.building === 'airbase';
        airBtn.onclick = () => this.buildStructure(province, 'airbase', 50);

        const blitzBtn = document.createElement('button');
        blitzBtn.className = 'btn-build tactical-skill';
        blitzBtn.innerHTML = `<span><i class="fa-solid fa-bolt"></i> Blitz Recruit</span> <strong>+20🪖</strong>`;
        blitzBtn.onclick = () => {
          province.troops += 20;
          this.sound.playBuild();
          this.openCard(province);
          this.logEvent(`ใช้ Blitz Recruit เพิ่มกำลังพล +20 ณ ${province.name}!`, 'sys');
        };

        actionsContainer.appendChild(cityBtn);
        actionsContainer.appendChild(fortBtn);
        actionsContainer.appendChild(portBtn);
        actionsContainer.appendChild(airBtn);
        actionsContainer.appendChild(blitzBtn);
      }
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
          if (p.building === 'city') growth += 3;
          p.troops = Math.min(999, p.troops + growth);
        }
      });
    }

    this.aiTimer += dt * this.gameSpeed;
    if (this.aiTimer >= 4.5) {
      this.aiTimer = 0;
      this.runAIEngine();
    }

    // Framerate independent troop progress
    for (let i = this.marchingTroops.length - 1; i >= 0; i--) {
      const troop = this.marchingTroops[i];
      troop.progress += troop.speed * dt * 60;
      troop.x = troop.startX + (troop.targetX - troop.startX) * Math.min(1.0, troop.progress);
      troop.y = troop.startY + (troop.targetY - troop.startY) * Math.min(1.0, troop.progress);

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
      target.pulse = 0.6;
      this.createParticleBurst(target.x, target.y, attackerFaction.color);
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

      // 40% chance to skip this cycle so all AIs don't act on the exact same beat
      if (Math.random() < 0.40) return;

      const ownedProvinces = this.provinces.filter(p => p.owner === fKey);
      if (ownedProvinces.length === 0) return;

      // Limit each faction to at most 1 action per evaluation cycle
      let actionTaken = false;

      // Shuffle owned provinces so AI doesn't always start from the same node
      const shuffledSources = [...ownedProvinces].sort(() => Math.random() - 0.5);

      for (const source of shuffledSources) {
        if (actionTaken) break;

        // AI requires a safe reserve before attacking (at least 30 troops)
        if (source.troops >= 30) {
          const enemyNeighbors = this.provinces.filter(p => 
            p.owner !== fKey && this.isConnected(source.id, p.id)
          );

          if (enemyNeighbors.length > 0) {
            // Sort by lowest troop count (prefer weaker targets / neutral nodes first)
            enemyNeighbors.sort((a, b) => a.troops - b.troops);
            const target = enemyNeighbors[0];

            let requiredAdvantage = target.owner === 'neutral' ? 1.2 : 1.35;
            if (target.building === 'fortress') requiredAdvantage = 1.8;

            if (source.troops > target.troops * requiredAdvantage) {
              this.dispatchTroops(source, target);
              actionTaken = true;
              break;
            }
          } else {
            // AI Rear Node Reinforcement: Send troops to reinforce front-line friendly nodes!
            const friendlyFrontLines = ownedProvinces.filter(p => 
              p.id !== source.id && this.provinces.some(n => n.owner !== fKey && this.isConnected(p.id, n.id))
            );

            if (friendlyFrontLines.length > 0) {
              friendlyFrontLines.sort((a, b) => a.troops - b.troops);
              const target = friendlyFrontLines[0];
              if (source.troops > 28) {
                this.dispatchTroops(source, target);
                actionTaken = true;
                break;
              }
            } else if (source.troops > 45 && !source.building) {
              source.troops -= 30;
              source.building = Math.random() > 0.5 ? 'city' : 'fortress';
              actionTaken = true;
              break;
            }
          }
        }
      }
    });
  }

  createParticleBurst(x, y, color) {
    for (let i = 0; i < 18; i++) {
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
    const playerRatio = totalLand > 0 ? playerLand / totalLand : 0;

    if (playerRatio >= 0.70) {
      this.gameOver = true;
      this.showEndGameModal(true);
    } else if (playerLand === 0 && this.provinces.length > 0) {
      this.gameOver = true;
      this.showEndGameModal(false);
    }
  }

  showEndGameModal(isVictory) {
    const modal = document.getElementById('modal-gameover');
    const title = document.getElementById('end-title');
    const msg = document.getElementById('end-message');

    if (isVictory) {
      if (title) title.innerHTML = `<i class="fa-solid fa-trophy" style="color:#f59e0b"></i> ชัยชนะอย่างยิ่งใหญ่!`;
      if (msg) msg.innerText = `ยินดีด้วย! คุณยึดครองพื้นที่ได้สำเร็จและนำความสงบสุขมาสู่แผ่นดิน`;
    } else {
      if (title) title.innerHTML = `<i class="fa-solid fa-skull" style="color:#ef4444"></i> พ่ายแพ้แก่ศึกสงคราม!`;
      if (msg) msg.innerText = `กองทัพของคุณถูกตีพ่ายแพ้ทั้งหมด วางแผนใหม่แล้วกลับมาเอาคืน!`;
    }

    if (modal) modal.classList.remove('hidden');
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
          stat.income += (p.building === 'city' ? 4 : 1);
          if (p.building === 'city') stat.cities += 1;
        }
      }
    });

    const playerStat = factionStats.player;
    const landPct = totalProvinces > 0 ? Math.round((playerStat.land / totalProvinces) * 100) : 0;

    const elLand = document.getElementById('stat-land');
    const elTroops = document.getElementById('stat-troops');
    const elIncome = document.getElementById('stat-income');
    const elCities = document.getElementById('stat-cities');

    if (elLand) elLand.innerText = `${landPct}%`;
    if (elTroops) elTroops.innerText = playerStat.troops;
    if (elIncome) elIncome.innerText = `+${playerStat.income}`;
    if (elCities) elCities.innerText = playerStat.cities;

    const stackedBarEl = document.getElementById('territory-stacked-bar');
    const legendEl = document.getElementById('territory-legend');

    if (stackedBarEl) stackedBarEl.innerHTML = '';
    if (legendEl) legendEl.innerHTML = '';

    const factionKeys = ['player', 'red', 'green', 'yellow', 'neutral'];

    factionKeys.forEach(fKey => {
      const f = this.factions[fKey];
      const stat = factionStats[fKey];
      const pct = totalProvinces > 0 ? Math.round((stat.land / totalProvinces) * 100) : 0;

      if (pct > 0 && stackedBarEl && legendEl) {
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
    if (!logEl) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerText = text;
    logEl.insertBefore(entry, logEl.firstChild);
  }

  render() {
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    const canvasW = this.canvas.width / this.dpr;
    const canvasH = this.canvas.height / this.dpr;

    this.ctx.clearRect(0, 0, canvasW, canvasH);

    // Draw Grid Connections
    this.ctx.lineWidth = 2;
    this.connections.forEach(conn => {
      const p1 = this.provinces.find(p => p.id === conn.from);
      const p2 = this.provinces.find(p => p.id === conn.to);
      if (p1 && p2) {
        const isPlayerLine = p1.owner === 'player' || p2.owner === 'player';
        this.ctx.strokeStyle = isPlayerLine ? 'rgba(59, 130, 246, 0.28)' : 'rgba(255, 255, 255, 0.08)';
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }
    });

    // Draw Tactical Drag Lines for Multi-selection
    if (this.isDragging && this.dragStartProvinces && this.dragStartProvinces.length > 0) {
      this.ctx.strokeStyle = '#00f2fe';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([8, 6]);
      this.dragStartProvinces.forEach(src => {
        this.ctx.beginPath();
        this.ctx.moveTo(src.x, src.y);
        this.ctx.lineTo(this.mouseX, this.mouseY);
        this.ctx.stroke();
      });
      this.ctx.setLineDash([]);
    }

    // Draw Provinces
    this.provinces.forEach(p => {
      const faction = this.factions[p.owner];

      // Multi-drag highlight ring / Selected highlight ring
      const isMultiSelected = this.isDragging && this.dragStartProvinces && this.dragStartProvinces.some(dp => dp.id === p.id);
      if (isMultiSelected || (this.selectedProvince && this.selectedProvince.id === p.id)) {
        this.ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius + 10, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#00f2fe';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }

      // Pulse wave effect (on reinforce / capture)
      if (p.pulse > 0) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, ' + p.pulse + ')';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius + (1.0 - p.pulse) * 20, 0, Math.PI * 2);
        this.ctx.stroke();
        p.pulse -= 0.04;
        if (p.pulse < 0) p.pulse = 0;
      }

      // Hovered Ring
      if (this.hoveredProvince && this.hoveredProvince.id === p.id && (!this.selectedProvince || this.selectedProvince.id !== p.id)) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
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
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        let icon = '🏛️';
        if (p.building === 'fortress') icon = '🛡️';
        if (p.building === 'port') icon = '⚓';
        if (p.building === 'airbase') icon = '✈️';
        this.ctx.fillText(icon, p.x, p.y - 12);
      }

      // Troop Count Label
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 13px sans-serif';
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
      this.ctx.font = 'bold 10px sans-serif';
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

      this.ctx.font = '12px sans-serif';
      const tw = this.ctx.measureText(tipText).width + 16;
      const tx = Math.min(canvasW - tw - 10, Math.max(10, this.mouseX + 12));
      const ty = Math.max(30, this.mouseY - 25);

      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      this.ctx.strokeStyle = hFaction.color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
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

    this.ctx.restore();
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
