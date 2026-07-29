// ============================================================
// Card Memory Match — High Performance Canvas 2D Engine
// Engine: HTML5 Canvas 2D API | Assets: Kenney Cards (large)
// ============================================================

(function () {
  'use strict';

  // --- Constants ---
  const ASSETS_PATH = '/assets/kenney_playing-cards-pack/PNG/Cards (medium)/';
  const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
  const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const TOTAL_PAIRS = 8;
  const GRID_COLS = 4;
  const GRID_ROWS = 4;

  // --- Canvas Setup ---
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  let width = 800;
  let height = 600;
  let dpr = 1;

  // --- Audio Context (Synthesized Web Audio API) ---
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type, duration, startVol = 0.15, endVol = 0.001) {
    if (!soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(startVol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(endVol, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  function playFlipSound() {
    playTone(400, 'sine', 0.08, 0.12);
  }

  function playMatchSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.25);
      });
    } catch {}
  }

  function playMismatchSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      [220, 180].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.12, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.2);
      });
    } catch {}
  }

  function playVictorySound() {
    if (!soundEnabled || !audioCtx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5, 880, 1046.5];
      const durations = [0.15, 0.15, 0.15, 0.25, 0.15, 0.4];
      let t = audioCtx.currentTime;
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + durations[i]);
        t += durations[i];
      });
    } catch {}
  }

  // --- Asset Preloader & Texture Pool ---
  const images = {};
  let imagesLoadedCount = 0;
  const TOTAL_DECK_IMAGES = 53; // 1 card_back + 52 playing cards
  let isPreloading = true;

  function getCardFilename(suit, value) {
    let formattedValue = value;
    if (!isNaN(value) && parseInt(value, 10) < 10) {
      formattedValue = '0' + value;
    }
    return `card_${suit}_${formattedValue}.png`;
  }

  function loadImage(key, src) {
    return new Promise((resolve) => {
      if (images[key]) {
        resolve(images[key]);
        return;
      }
      const img = new Image();
      img.onload = () => {
        images[key] = img;
        imagesLoadedCount++;
        resolve(img);
      };
      img.onerror = () => {
        images[key] = null;
        resolve(null);
      };
      img.src = src;
    });
  }

  async function preloadAllAssets() {
    isPreloading = true;
    imagesLoadedCount = 0;

    const promises = [];
    promises.push(loadImage('card_back', ASSETS_PATH + 'card_back.png'));

    for (const suit of SUITS) {
      for (const value of VALUES) {
        const filename = getCardFilename(suit, value);
        const key = `${suit}_${value}`;
        promises.push(loadImage(key, ASSETS_PATH + filename));
      }
    }

    await Promise.all(promises);
    isPreloading = false;
    initGame();
  }

  // --- Game State ---
  let cards = [];
  let flippedCards = [];
  let locked = false;
  let moves = 0;
  let matchedPairs = 0;
  let secondsElapsed = 0;
  let timerInterval = null;
  let gameStarted = false;
  let gameOver = false;
  let particles = [];

  // Interactive Buttons on Canvas
  let buttons = [];
  let mousePos = { x: -1, y: -1 };

  // --- Card Object ---
  class Card {
    constructor(id, suit, value, imageKey) {
      this.id = id;
      this.suit = suit;
      this.value = value;
      this.imageKey = imageKey;

      this.x = 0;
      this.y = 0;
      this.width = 100;
      this.height = 140;

      this.isFlipped = false;
      this.isMatched = false;

      // Animation properties
      this.flipProgress = 0; // 0 = face down (back), 1 = face up (front)
      this.targetFlip = 0;
      this.scale = 1;
      this.shakeX = 0;
      this.bounceY = 0;
      this.isHovered = false;
    }

    update(dt) {
      // Flip animation interpolation
      if (Math.abs(this.flipProgress - this.targetFlip) > 0.01) {
        this.flipProgress += (this.targetFlip - this.flipProgress) * 14 * dt;
      } else {
        this.flipProgress = this.targetFlip;
      }

      // Shake animation for mismatch
      if (this.shakeX !== 0) {
        this.shakeX *= 0.85;
        if (Math.abs(this.shakeX) < 0.1) this.shakeX = 0;
      }

      // Hover animation
      const targetScale = this.isMatched ? 0.96 : this.isHovered ? 1.05 : 1.0;
      this.scale += (targetScale - this.scale) * 10 * dt;
    }

    draw(ctx) {
      ctx.save();
      const centerX = this.x + this.width / 2 + this.shakeX;
      const centerY = this.y + this.height / 2 + this.bounceY;

      ctx.translate(centerX, centerY);
      ctx.scale(this.scale, this.scale);

      // Cosine flip scale effect
      const flipScaleX = Math.cos(this.flipProgress * Math.PI);
      ctx.scale(Math.abs(flipScaleX), 1);

      const drawW = this.width;
      const drawH = this.height;
      const rx = -drawW / 2;
      const ry = -drawH / 2;
      const radius = 10;

      // Card Drop Shadow
      if (!this.isMatched) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = this.isHovered ? 18 : 10;
        ctx.shadowOffsetY = this.isHovered ? 8 : 4;
      }

      // Determine Front vs Back image
      const showFront = flipScaleX <= 0; // When flip passes 90 deg (scaleX crosses 0)
      const img = showFront ? images[this.imageKey] : images['card_back'];

      if (img && img.complete && img.naturalWidth !== 0) {
        // Draw rounded image
        ctx.beginPath();
        ctx.roundRect(rx, ry, drawW, drawH, radius);
        ctx.clip();
        ctx.drawImage(img, rx, ry, drawW, drawH);
      } else {
        // Fallback procedural card
        ctx.fillStyle = showFront ? '#ffffff' : '#2563eb';
        ctx.beginPath();
        ctx.roundRect(rx, ry, drawW, drawH, radius);
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (showFront) {
          ctx.fillStyle = (this.suit === 'hearts' || this.suit === 'diamonds') ? '#ef4444' : '#0f172a';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const suitIcon = { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' }[this.suit] || '';
          ctx.fillText(`${this.value}${suitIcon}`, 0, 0);
        }
      }

      ctx.restore();

      // Highlight / Matched Glow Overlay
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(this.scale, this.scale);
      if (this.isMatched) {
        ctx.beginPath();
        ctx.roundRect(rx, ry, drawW, drawH, radius);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (this.isHovered && !this.isFlipped) {
        ctx.beginPath();
        ctx.roundRect(rx, ry, drawW, drawH, radius);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    }

    containsPoint(px, py) {
      return (
        px >= this.x &&
        px <= this.x + this.width &&
        py >= this.y &&
        py <= this.y + this.height
      );
    }
  }

  // --- Particles ---
  function spawnSparkles(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        size: 3 + Math.random() * 5,
        color: ['#fbbf24', '#34d399', '#38bdf8', '#f472b6'][Math.floor(Math.random() * 4)],
        alpha: 1,
        life: 0.6 + Math.random() * 0.4,
      });
    }
    if (particles.length > 50) {
      particles.splice(0, particles.length - 50);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt; // gravity
      p.alpha = p.life;
    }
  }

  function drawParticles(ctx) {
    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // --- Game Mechanics ---
  function initGame() {
    // Stop previous timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;

    secondsElapsed = 0;
    moves = 0;
    matchedPairs = 0;
    gameStarted = false;
    gameOver = false;
    locked = false;
    flippedCards = [];
    particles = [];

    // Select 8 random pairs
    const selectedPairs = [];
    const pool = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        pool.push({ suit, value });
      }
    }
    // Shuffle pool and take 8
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const chosen8 = pool.slice(0, TOTAL_PAIRS);
    const cardList = [];
    chosen8.forEach((data) => {
      const key = `${data.suit}_${data.value}`;
      cardList.push({ suit: data.suit, value: data.value, key });
      cardList.push({ suit: data.suit, value: data.value, key });
    });

    // Shuffle 16 cards
    for (let i = cardList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardList[i], cardList[j]] = [cardList[j], cardList[i]];
    }

    cards = cardList.map((item, idx) => new Card(idx, item.suit, item.value, item.key));
    layoutGrid();
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!gameOver) {
        secondsElapsed++;
      }
    }, 1000);
  }

  function handleCardClick(card) {
    initAudio();
    if (locked || gameOver) return;
    if (card.isFlipped || card.isMatched) return;
    if (flippedCards.length >= 2) return;

    if (!gameStarted) {
      gameStarted = true;
      startTimer();
    }

    card.isFlipped = true;
    card.targetFlip = 1;
    flippedCards.push(card);
    playFlipSound();

    if (flippedCards.length === 2) {
      locked = true;
      moves++;

      const [c1, c2] = flippedCards;
      if (c1.suit === c2.suit && c1.value === c2.value) {
        // MATCH!
        setTimeout(() => {
          c1.isMatched = true;
          c2.isMatched = true;
          matchedPairs++;
          playMatchSound();
          spawnSparkles(c1.x + c1.width / 2, c1.y + c1.height / 2, 20);
          spawnSparkles(c2.x + c2.width / 2, c2.y + c2.height / 2, 20);
          flippedCards = [];
          locked = false;

          if (matchedPairs >= TOTAL_PAIRS) {
            handleVictory();
          }
        }, 300);
      } else {
        // MISMATCH!
        setTimeout(() => {
          c1.shakeX = 12;
          c2.shakeX = 12;
          playMismatchSound();
        }, 300);

        setTimeout(() => {
          c1.isFlipped = false;
          c1.targetFlip = 0;
          c2.isFlipped = false;
          c2.targetFlip = 0;
          flippedCards = [];
          locked = false;
        }, 1100);
      }
    }
  }

  function handleVictory() {
    gameOver = true;
    if (timerInterval) clearInterval(timerInterval);

    playVictorySound();
    saveHighScore();
  }

  function calculateScore(m, t) {
    const base = 1000;
    const movePenalty = Math.max(0, (m - 8) * 30);
    const timePenalty = Math.max(0, (t - 40) * 5);
    return Math.max(100, base - movePenalty - timePenalty);
  }

  function calculateRating(m, t) {
    if (m <= 10 && t <= 35) return 5;
    if (m <= 14 && t <= 60) return 4;
    if (m <= 18 && t <= 90) return 3;
    if (m <= 22 && t <= 120) return 2;
    return 1;
  }

  function saveHighScore() {
    try {
      const score = calculateScore(moves, secondsElapsed);
      const prev = localStorage.getItem('card-memory-best');
      if (!prev || score > JSON.parse(prev).score) {
        localStorage.setItem(
          'card-memory-best',
          JSON.stringify({ score, moves, time: secondsElapsed })
        );
      }
    } catch {}
  }

  function getHighScore() {
    try {
      const prev = localStorage.getItem('card-memory-best');
      return prev ? JSON.parse(prev) : null;
    } catch {
      return null;
    }
  }

  // --- Responsive Layout Positioning ---
  function layoutGrid() {
    const isSmallScreen = width < 480;
    const topHudHeight = isSmallScreen ? 56 : 70;
    const availableWidth = width;
    const availableHeight = height - topHudHeight - 20;

    // Determine optimal card size to fit inside container perfectly
    const padding = isSmallScreen ? 6 : 12;
    const maxCardW = Math.floor((availableWidth - (GRID_COLS + 1) * padding) / GRID_COLS);
    const maxCardH = Math.floor((availableHeight - (GRID_ROWS + 1) * padding) / GRID_ROWS);

    // Keep standard 1 : 1.4 aspect ratio for cards
    let cardW = Math.min(maxCardW, Math.floor(maxCardH / 1.4));
    let cardH = Math.floor(cardW * 1.4);

    // Clamp card sizes
    cardW = Math.max(44, Math.min(110, cardW));
    cardH = Math.floor(cardW * 1.4);

    const totalGridW = GRID_COLS * cardW + (GRID_COLS - 1) * padding;
    const totalGridH = GRID_ROWS * cardH + (GRID_ROWS - 1) * padding;

    const startX = Math.floor((width - totalGridW) / 2);
    const startY = topHudHeight + Math.floor((availableHeight - totalGridH) / 2);

    cards.forEach((card, idx) => {
      const col = idx % GRID_COLS;
      const row = Math.floor(idx / GRID_COLS);
      card.x = startX + col * (cardW + padding);
      card.y = startY + row * (cardH + padding);
      card.width = cardW;
      card.height = cardH;
    });
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width || window.innerWidth;
    height = rect.height || window.innerHeight;
    dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    layoutGrid();
  }

  window.addEventListener('resize', resizeCanvas);

  // --- Input Handlers ---
  function handleInput(px, py, isClick = false) {
    if (isClick) initAudio();

    mousePos = { x: px, y: py };

    // Check canvas buttons
    buttons.forEach((btn) => {
      btn.isHovered = btn.containsPoint(px, py);
      if (isClick && btn.isHovered) {
        btn.onClick();
      }
    });

    if (gameOver) {
      if (isClick && victoryBtn && victoryBtn.containsPoint(px, py)) {
        initGame();
      }
      return;
    }

    // Check cards
    cards.forEach((card) => {
      card.isHovered = card.containsPoint(px, py);
      if (isClick && card.isHovered) {
        handleCardClick(card);
      }
    });
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleInput(e.clientX - rect.left, e.clientY - rect.top, false);
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleInput(e.clientX - rect.left, e.clientY - rect.top, true);
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      handleInput(touch.clientX - rect.left, touch.clientY - rect.top, true);
    }
  }, { passive: false });

  // --- Render Loop ---
  let lastTime = performance.now();
  let victoryBtn = null;

  function render(time) {
    const dt = Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Background
    const bgGradient = ctx.createRadialGradient(
      width / 2, height / 2, 50,
      width / 2, height / 2, Math.max(width, height) * 0.8
    );
    bgGradient.addColorStop(0, '#1e1b4b');
    bgGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    if (isPreloading) {
      drawLoadingScreen(ctx);
      ctx.restore();
      requestAnimationFrame(render);
      return;
    }

    // Subtle ambient grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x < width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 2. HUD Bar
    drawHUD(ctx);

    // 3. Cards
    cards.forEach((card) => {
      card.update(dt);
      card.draw(ctx);
    });

    // 4. Particles
    updateParticles(dt);
    drawParticles(ctx);

    // 5. Victory Overlay Modal
    if (gameOver) {
      drawVictoryModal(ctx);
    }

    ctx.restore();
    requestAnimationFrame(render);
  }

  function drawLoadingScreen(ctx) {
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🃏 Loading Card Assets...', width / 2, height / 2 - 20);

    const barW = Math.min(240, width - 60);
    const barH = 8;
    const barX = (width - barW) / 2;
    const barY = height / 2 + 15;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    const pct = Math.min(1, imagesLoadedCount / TOTAL_DECK_IMAGES);
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * pct, barH, 4);
    ctx.fill();
  }

  function drawHUD(ctx) {
    const isSmallScreen = width < 480;
    const hudW = Math.min(width - 16, 720);
    const hudH = isSmallScreen ? 44 : 50;
    const hudX = (width - hudW) / 2;
    const hudY = isSmallScreen ? 6 : 10;

    // Glass panel
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, isSmallScreen ? 10 : 14);
    ctx.fill();
    ctx.stroke();

    // Text Formatting
    const minutes = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Canvas Buttons Setup first to calculate available width
    buttons = [];

    const btnW = isSmallScreen ? 72 : 94;
    const btnH = isSmallScreen ? 30 : 34;
    const btnX = hudX + hudW - btnW - (isSmallScreen ? 6 : 12);
    const btnY = hudY + (hudH - btnH) / 2;

    const soundW = isSmallScreen ? 32 : 38;
    const soundX = btnX - soundW - (isSmallScreen ? 4 : 8);

    // Left available area for Stats
    const leftMargin = isSmallScreen ? 8 : 16;
    const rightBoundary = soundX - 6;
    const availableStatW = rightBoundary - (hudX + leftMargin);

    ctx.fillStyle = '#f8fafc';
    ctx.font = isSmallScreen ? '600 11px system-ui, sans-serif' : '600 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Dynamic stats label text for small screens
    const stat1 = isSmallScreen ? `🎯 ${matchedPairs}/${TOTAL_PAIRS}` : `🎯 Pairs: ${matchedPairs}/${TOTAL_PAIRS}`;
    const stat2 = isSmallScreen ? `👆 ${moves}` : `👆 Moves: ${moves}`;
    const stat3 = isSmallScreen ? `⏱️ ${timeStr}` : `⏱️ Time: ${timeStr}`;

    const stepX = availableStatW / 3;
    ctx.fillText(stat1, hudX + leftMargin, hudY + hudH / 2);
    ctx.fillText(stat2, hudX + leftMargin + stepX, hudY + hudH / 2);
    ctx.fillText(stat3, hudX + leftMargin + stepX * 2, hudY + hudH / 2);

    // New Game Button
    const btnHover = mousePos.x >= btnX && mousePos.x <= btnX + btnW && mousePos.y >= btnY && mousePos.y <= btnY + btnH;

    ctx.fillStyle = btnHover ? '#2563eb' : 'rgba(37, 99, 235, 0.8)';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = isSmallScreen ? 'bold 11px system-ui, sans-serif' : 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isSmallScreen ? '↻ New' : '↻ New Game', btnX + btnW / 2, btnY + btnH / 2);

    buttons.push({
      containsPoint: (px, py) => px >= btnX && px <= btnX + btnW && py >= btnY && py <= btnY + btnH,
      onClick: () => initGame(),
    });

    // Sound Toggle Button
    const soundHover = mousePos.x >= soundX && mousePos.x <= soundX + soundW && mousePos.y >= btnY && mousePos.y <= btnY + btnH;

    ctx.fillStyle = soundHover ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(soundX, btnY, soundW, btnH, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = isSmallScreen ? '12px system-ui, sans-serif' : '14px system-ui, sans-serif';
    ctx.fillText(soundEnabled ? '🔊' : '🔇', soundX + soundW / 2, btnY + btnH / 2);

    buttons.push({
      containsPoint: (px, py) => px >= soundX && px <= soundX + soundW && py >= btnY && py <= btnY + btnH,
      onClick: () => {
        soundEnabled = !soundEnabled;
      },
    });

    ctx.restore();
  }

  function drawVictoryModal(ctx) {
    ctx.save();

    // Dim Backdrop
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(0, 0, width, height);

    // Modal Box
    const boxW = Math.min(width - 32, 420);
    const boxH = 340;
    const boxX = (width - boxW) / 2;
    const boxY = (height - boxH) / 2;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = 'transparent';

    // Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🎉 ยินดีด้วย! จับคู่สำเร็จ!', width / 2, boxY + 28);

    // Stars Rating
    const rating = calculateRating(moves, secondsElapsed);
    let starsStr = '';
    for (let i = 0; i < 5; i++) {
      starsStr += i < rating ? '⭐' : '☆';
    }
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText(starsStr, width / 2, boxY + 70);

    // Stats Summary
    const score = calculateScore(moves, secondsElapsed);
    const minutes = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`เวลาที่ใช้: ${timeStr}  |  จำนวนเปิด: ${moves} ครั้ง`, width / 2, boxY + 120);

    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`คะแนนสะสม: ${score} pts`, width / 2, boxY + 155);

    // High Score Record
    const best = getHighScore();
    if (best) {
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`🏆 Record สูงสุด: ${best.score} pts`, width / 2, boxY + 195);
    }

    // Play Again Button on Canvas
    const pBtnW = 180;
    const pBtnH = 44;
    const pBtnX = (width - pBtnW) / 2;
    const pBtnY = boxY + boxH - pBtnH - 24;

    const pHover = mousePos.x >= pBtnX && mousePos.x <= pBtnX + pBtnW && mousePos.y >= pBtnY && mousePos.y <= pBtnY + pBtnH;

    ctx.fillStyle = pHover ? '#10b981' : '#059669';
    ctx.beginPath();
    ctx.roundRect(pBtnX, pBtnY, pBtnW, pBtnH, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎮 Play Again', width / 2, pBtnY + pBtnH / 2);

    victoryBtn = {
      containsPoint: (px, py) => px >= pBtnX && px <= pBtnX + pBtnW && py >= pBtnY && py <= pBtnY + pBtnH,
    };

    ctx.restore();
  }

  // --- Start ---
  resizeCanvas();
  preloadAllAssets();
  requestAnimationFrame(render);

})();