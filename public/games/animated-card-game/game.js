/**
 * FOOL THE GAME — Royal Cascade Card Battler Engine
 * Standalone HTML5 Canvas 2D Game with GSAP Animations, Web Audio & Haptics
 */

// --- Audio & Haptics Engine ---
class SoundHapticEngine {
  constructor() {
    this.ctx = null;
    this.initAudio();
  }

  initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  vibrate(pattern) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.1, pitchShift = 0) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq + pitchShift, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playCardSwish() {
    this.playTone(350, 'triangle', 0.08, 0.08);
    this.vibrate(5);
  }

  playCardDrop() {
    this.playTone(180, 'sine', 0.12, 0.2);
    this.vibrate(20);
  }

  playButtonClick() {
    this.playTone(520, 'sine', 0.06, 0.15);
    this.vibrate(10);
  }

  playTakeCards() {
    this.playTone(220, 'sawtooth', 0.2, 0.12);
    this.vibrate([30, 40, 30]);
  }

  playDiscard() {
    this.playTone(440, 'triangle', 0.15, 0.15);
    this.vibrate(15);
  }

  playCoinSound(pitchIndex = 0) {
    const baseFreq = 800;
    this.playTone(baseFreq + pitchIndex * 60, 'sine', 0.1, 0.12);
  }

  playWinFanfare() {
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.15), i * 120);
    });
    this.vibrate([50, 50, 50, 100]);
  }
}

const audioHaptic = new SoundHapticEngine();

// --- Card Data Structure ---
const SUITS = [
  { symbol: '♠', color: '#1E293B', name: 'spades' },
  { symbol: '♥', color: '#EF4444', name: 'hearts' },
  { symbol: '♦', color: '#3B82F6', name: 'diamonds' },
  { symbol: '♣', color: '#10B981', name: 'clubs' }
];
const RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

class Card {
  constructor(rank, suit, id) {
    this.id = id;
    this.rank = rank;
    this.suit = suit;
    this.value = RANKS.indexOf(rank) + 6;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.angle = 0; // in degrees
    this.targetAngle = 0;
    this.scaleX = 1; // For 3D flip effect
    this.scaleY = 1;
    this.isFaceUp = true;
    this.isDragging = false;
    this.isHovered = false;
    this.width = 72;
    this.height = 104;
    this.slotIndex = -1;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.angle * Math.PI) / 180);
    ctx.scale(this.scaleX, this.scaleY);

    const w = this.width;
    const h = this.height;
    const hoverOffset = this.isHovered ? -12 : 0;

    // Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = this.isDragging ? 16 : 8;
    ctx.shadowOffsetY = this.isDragging ? 12 : 4 + hoverOffset;

    // Card Base (Rounded Rect)
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2 + hoverOffset, w, h, 10);
    
    if (!this.isFaceUp) {
      // Card Back Design
      ctx.fillStyle = '#312E81';
      ctx.fill();
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner Pattern
      ctx.beginPath();
      ctx.roundRect(-w / 2 + 6, -h / 2 + hoverOffset + 6, w - 12, h - 12, 6);
      ctx.fillStyle = '#4338CA';
      ctx.fill();

      // Center Emblem
      ctx.fillStyle = '#818CF8';
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FOOL', 0, hoverOffset);
    } else {
      // Card Face Design
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = this.isDragging ? '#3B82F6' : '#E2E8F0';
      ctx.lineWidth = this.isDragging ? 3 : 1.5;
      ctx.stroke();

      // Rank Top-Left
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = this.suit.color;
      ctx.font = '800 15px Fredoka, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this.rank, -w / 2 + 7, -h / 2 + hoverOffset + 18);
      ctx.font = '14px Outfit, sans-serif';
      ctx.fillText(this.suit.symbol, -w / 2 + 7, -h / 2 + hoverOffset + 32);

      // Center Big Symbol
      ctx.font = '28px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.suit.symbol, 0, hoverOffset + 2);

      // Rank Bottom-Right (Inverted)
      ctx.save();
      ctx.translate(w / 2 - 7, h / 2 + hoverOffset - 18);
      ctx.rotate(Math.PI);
      ctx.font = '800 15px Fredoka, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this.rank, 0, 0);
      ctx.font = '14px Outfit, sans-serif';
      ctx.fillText(this.suit.symbol, 0, 14);
      ctx.restore();
    }

    ctx.restore();
  }

  contains(px, py) {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    return (
      px >= this.x - halfW &&
      px <= this.x + halfW &&
      py >= this.y - halfH &&
      py <= this.y + halfH
    );
  }
}

// --- Main Game Engine ---
class FoolGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.width = 390;
    this.height = 844;

    this.gameState = 'TITLE'; // TITLE, DEAL, BATTLE, SHOP, WIN
    this.wave = 1;
    this.coins = 100;
    this.playerHealth = 100;
    this.opponentHealth = 100;

    this.deck = [];
    this.playerHand = [];
    this.opponentHand = [];
    this.playSlots = [null, null, null]; // 3 Active Play Slots in center
    this.trumpCard = null;

    this.draggedCard = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    // Shop Draft Items
    this.shopItems = [
      { title: '+1 Card Draw', desc: 'Draw extra card each turn', price: 1, type: 'DRAW' },
      { title: '+50% Gold Bonus', desc: 'Earn 50% more coins', price: 2, type: 'GOLD' },
      { title: 'Trump Shield', desc: 'Block 1 opponent attack', price: 3, type: 'SHIELD' }
    ];

    this.initCanvas();
    this.bindEvents();
    this.startRenderLoop();
  }

  initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 390;
    this.height = rect.height || 844;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  createFullDeck() {
    const deck = [];
    let id = 0;
    SUITS.forEach(suit => {
      RANKS.forEach(rank => {
        const card = new Card(rank, suit, id++);
        card.x = 65; // Deck pile origin (Top Left)
        card.y = 120;
        card.isFaceUp = false;
        deck.push(card);
      });
    });

    // Shuffle Deck (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.trumpCard = deck[deck.length - 1];
    this.trumpCard.isFaceUp = true;
    this.trumpCard.angle = 90;
    this.trumpCard.x = 85;
    this.trumpCard.y = 120;

    return deck;
  }

  startNewGame() {
    audioHaptic.resume();
    audioHaptic.playButtonClick();

    this.wave = 1;
    this.coins = 150;
    this.deck = this.createFullDeck();
    this.playerHand = [];
    this.opponentHand = [];
    this.playSlots = [null, null, null];
    this.gameState = 'DEAL';

    this.dealInitialCards();
  }

  dealInitialCards() {
    const totalToDeal = 6;
    let dealCount = 0;

    for (let i = 0; i < totalToDeal; i++) {
      // Deal Player Card
      setTimeout(() => {
        if (this.deck.length > 0) {
          const card = this.deck.pop();
          card.isFaceUp = true;
          this.playerHand.push(card);
          audioHaptic.playCardSwish();
          this.updateHandPositions();
        }
      }, dealCount * 100);
      dealCount++;

      // Deal Opponent Card
      setTimeout(() => {
        if (this.deck.length > 0) {
          const card = this.deck.pop();
          card.isFaceUp = false;
          this.opponentHand.push(card);
          audioHaptic.playCardSwish();
          this.updateHandPositions();
        }
      }, dealCount * 100);
      dealCount++;
    }

    setTimeout(() => {
      this.gameState = 'BATTLE';
    }, dealCount * 100 + 400);
  }

  updateHandPositions() {
    const centerX = this.width / 2;

    // 1. Update Player Hand (Arc Fan Layout at bottom)
    const pCount = this.playerHand.length;
    const pStartY = this.height - 145;
    const pSpacing = Math.min(48, (this.width - 90) / Math.max(1, pCount));
    const pMid = (pCount - 1) / 2;

    this.playerHand.forEach((card, i) => {
      if (card.isDragging) return;
      const offset = i - pMid;
      const targetX = centerX + offset * pSpacing;
      const targetY = pStartY + Math.pow(Math.abs(offset), 1.8) * 3.5;
      const targetAngle = offset * 5;

      gsap.to(card, {
        x: targetX,
        y: targetY,
        angle: targetAngle,
        duration: 0.35,
        ease: 'power2.out'
      });
    });

    // 2. Update Opponent Hand (Arc Fan Layout at top)
    const oCount = this.opponentHand.length;
    const oStartY = 135;
    const oSpacing = Math.min(44, (this.width - 120) / Math.max(1, oCount));
    const oMid = (oCount - 1) / 2;

    this.opponentHand.forEach((card, i) => {
      const offset = i - oMid;
      const targetX = centerX + 40 + offset * oSpacing;
      const targetY = oStartY - Math.pow(Math.abs(offset), 1.8) * 2.5;
      const targetAngle = offset * 4;

      gsap.to(card, {
        x: targetX,
        y: targetY,
        angle: targetAngle,
        duration: 0.35,
        ease: 'power2.out'
      });
    });
  }

  // --- Input Event Handling ---
  bindEvents() {
    const getPos = e => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const onDown = e => {
      audioHaptic.resume();
      const pos = getPos(e);

      if (this.gameState === 'TITLE') {
        // Play Button Click
        if (this.checkButtonClick(pos, this.width / 2 - 70, this.height - 160, 140, 48)) {
          this.startNewGame();
        }
        return;
      }

      if (this.gameState === 'SHOP') {
        // Shop Next Button
        if (this.checkButtonClick(pos, this.width / 2 - 130, this.height - 85, 110, 42)) {
          audioHaptic.playButtonClick();
          this.gameState = 'BATTLE';
          this.dealInitialCards();
        }
        // Shop Re-Roll Button
        else if (this.checkButtonClick(pos, this.width / 2 + 20, this.height - 85, 110, 42)) {
          if (this.coins >= 1) {
            this.coins -= 1;
            audioHaptic.playCoinSound();
            // Shuffle shop items
            this.shopItems.reverse();
          }
        }
        // Buy Shop Card
        for (let i = 0; i < 3; i++) {
          const slotX = this.width / 2 - 120 + i * 120;
          const slotY = this.height - 230;
          if (pos.x >= slotX - 45 && pos.x <= slotX + 45 && pos.y >= slotY - 60 && pos.y <= slotY + 60) {
            const item = this.shopItems[i];
            if (this.coins >= item.price) {
              this.coins -= item.price;
              audioHaptic.playWinFanfare();
            }
          }
        }
        return;
      }

      if (this.gameState === 'BATTLE') {
        // Action Bar Buttons Check
        const btnY = this.height - 55;
        const btnW = 100;
        const btnH = 42;

        // 1. PLAY Button (Blue)
        if (this.checkButtonClick(pos, 25, btnY, btnW, btnH)) {
          audioHaptic.playButtonClick();
          this.handlePlayAction();
          return;
        }

        // 2. TAKE Button (Red)
        if (this.checkButtonClick(pos, 145, btnY, btnW, btnH)) {
          audioHaptic.playTakeCards();
          this.handleTakeAction();
          return;
        }

        // 3. DISCARD Button (Yellow)
        if (this.checkButtonClick(pos, 265, btnY, btnW, btnH)) {
          audioHaptic.playDiscard();
          this.handleDiscardAction();
          return;
        }

        // Select & Drag Card from Player Hand
        for (let i = this.playerHand.length - 1; i >= 0; i--) {
          const card = this.playerHand[i];
          if (card.contains(pos.x, pos.y)) {
            this.draggedCard = card;
            card.isDragging = true;
            this.dragOffsetX = pos.x - card.x;
            this.dragOffsetY = pos.y - card.y;
            audioHaptic.playCardSwish();
            break;
          }
        }
      }
    };

    const onMove = e => {
      const pos = getPos(e);

      if (this.draggedCard) {
        this.draggedCard.x = pos.x - this.dragOffsetX;
        this.draggedCard.y = pos.y - this.dragOffsetY;
        this.draggedCard.angle = (pos.x - this.width / 2) * 0.05; // Inertia tilt
      } else if (this.gameState === 'BATTLE') {
        // Update Hover State
        this.playerHand.forEach(card => {
          card.isHovered = card.contains(pos.x, pos.y);
        });
      }
    };

    const onUp = () => {
      if (this.draggedCard) {
        const card = this.draggedCard;
        card.isDragging = false;

        // Check drop into center play slots (3 Slots)
        const slotY = this.height / 2 - 30;
        const slotW = 85;
        const slotH = 120;
        let droppedInSlot = false;

        for (let i = 0; i < 3; i++) {
          const slotX = this.width / 2 - 110 + i * 110;
          if (
            Math.abs(card.x - slotX) < slotW / 2 + 20 &&
            Math.abs(card.y - slotY) < slotH / 2 + 20 &&
            !this.playSlots[i]
          ) {
            // Snap to Play Slot
            this.playSlots[i] = card;
            card.slotIndex = i;
            card.angle = 0;

            // Remove from player hand array
            const idx = this.playerHand.indexOf(card);
            if (idx > -1) this.playerHand.splice(idx, 1);

            gsap.to(card, {
              x: slotX,
              y: slotY,
              duration: 0.2,
              ease: 'back.out(1.4)',
              onComplete: () => audioHaptic.playCardDrop()
            });

            droppedInSlot = true;
            break;
          }
        }

        if (!droppedInSlot) {
          // Return to hand layout
          this.updateHandPositions();
        }

        this.draggedCard = null;
      }
    };

    this.canvas.addEventListener('mousedown', onDown);
    this.canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    this.canvas.addEventListener('touchstart', onDown, { passive: false });
    this.canvas.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }

  checkButtonClick(pos, x, y, w, h) {
    return pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h;
  }

  handlePlayAction() {
    // Opponent plays response card or AI turn
    if (this.opponentHand.length > 0) {
      const oppCard = this.opponentHand.pop();
      oppCard.isFaceUp = true;

      for (let i = 0; i < 3; i++) {
        if (!this.playSlots[i]) {
          this.playSlots[i] = oppCard;
          const slotX = this.width / 2 - 110 + i * 110;
          const slotY = this.height / 2 - 30;

          gsap.to(oppCard, {
            x: slotX,
            y: slotY,
            angle: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => audioHaptic.playCardDrop()
          });
          break;
        }
      }
    }
    this.updateHandPositions();
  }

  handleTakeAction() {
    // Collect all table cards into Player Hand
    for (let i = 0; i < 3; i++) {
      if (this.playSlots[i]) {
        const card = this.playSlots[i];
        card.isFaceUp = true;
        this.playerHand.push(card);
        this.playSlots[i] = null;
      }
    }
    this.updateHandPositions();
  }

  handleDiscardAction() {
    // Clear table cards to discard pile and open Shop overlay
    let cardsCleared = 0;
    for (let i = 0; i < 3; i++) {
      if (this.playSlots[i]) {
        const card = this.playSlots[i];
        cardsCleared++;
        gsap.to(card, {
          x: this.width + 100,
          y: -100,
          angle: 180,
          duration: 0.4,
          ease: 'power2.in'
        });
        this.playSlots[i] = null;
      }
    }

    if (cardsCleared > 0) {
      this.coins += cardsCleared * 20;
      this.wave++;

      // Trigger Confetti Win Effect if wave % 3 === 0
      if (typeof confetti === 'function' && this.wave % 3 === 0) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        audioHaptic.playWinFanfare();
      }

      // Open Purple Shop Panel
      setTimeout(() => {
        this.gameState = 'SHOP';
      }, 500);
    }
  }

  // --- Render Functions for Each Screen ---
  renderTitleScreen() {
    const ctx = this.ctx;

    // Header Title: FOOL THE GAME
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 38px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOOL', this.width / 2, 220);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 20px Outfit, sans-serif';
    ctx.fillText('THE GAME', this.width / 2, 255);

    // Center Graphic: Animated Arc Card Fan Demo
    const time = Date.now() * 0.002;
    const breathe = 1 + Math.sin(time) * 0.03;
    const centerX = this.width / 2;
    const centerY = this.height / 2 - 20;

    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(centerX + i * 28, centerY + Math.abs(i) * 6);
      ctx.rotate((i * 8 * Math.PI) / 180);
      ctx.scale(breathe, breathe);

      ctx.beginPath();
      ctx.roundRect(-30, -45, 60, 90, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = i % 2 === 0 ? '#EF4444' : '#1E293B';
      ctx.font = '22px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i % 2 === 0 ? '♥' : '♠', 0, 0);

      ctx.restore();
    }

    // PLAY Button (Blue Pill Button)
    const playX = this.width / 2 - 70;
    const playY = this.height - 160;
    ctx.beginPath();
    ctx.roundRect(playX, playY, 140, 48, 24);
    ctx.fillStyle = '#3B82F6';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PLAY', playX + 70, playY + 30);

    // QUIT Button (Red Pill Button)
    const quitX = this.width / 2 - 50;
    const quitY = this.height - 95;
    ctx.beginPath();
    ctx.roundRect(quitX, quitY, 100, 38, 19);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 15px Outfit, sans-serif';
    ctx.fillText('QUIT', quitX + 50, quitY + 24);
  }

  renderHeaderBar() {
    const ctx = this.ctx;

    // Top Header Stats Box (Screen 5/7/8 Spec)
    ctx.beginPath();
    ctx.roundRect(15, 20, this.width - 30, 50, 14);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    // Coins & Wave Info
    ctx.fillStyle = '#F59E0B';
    ctx.font = '700 16px Fredoka, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🪙 ${this.coins}`, 30, 50);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 15px Outfit, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`WAVE ${this.wave}`, this.width - 30, 50);
  }

  renderBattleArea() {
    const ctx = this.ctx;

    // 1. Deck Stack (Top Left)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(25, 90, 68, 98, 8);
    ctx.fillStyle = '#1E1B4B';
    ctx.fill();
    ctx.strokeStyle = '#4338CA';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#818CF8';
    ctx.font = '700 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`DECK (${this.deck.length})`, 59, 144);
    ctx.restore();

    // 2. Active Play Slots (3 Center Slots)
    const slotY = this.height / 2 - 30;
    const slotW = 85;
    const slotH = 120;

    for (let i = 0; i < 3; i++) {
      const slotX = this.width / 2 - 110 + i * 110;
      ctx.beginPath();
      ctx.roundRect(slotX - slotW / 2, slotY - slotH / 2, slotW, slotH, 12);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '600 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SLOT ${i + 1}`, slotX, slotY + 4);
    }

    // 3. Render Cards
    this.opponentHand.forEach(card => card.draw(ctx));
    this.playerHand.forEach(card => card.draw(ctx));
    this.playSlots.forEach(card => card && card.draw(ctx));

    // 4. Render Action Bar (Screen 3/4/7 Spec)
    const btnY = this.height - 55;
    const btnW = 100;
    const btnH = 42;

    // PLAY Button (Blue)
    ctx.beginPath();
    ctx.roundRect(25, btnY, btnW, btnH, 10);
    ctx.fillStyle = '#3B82F6';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 15px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PLAY', 75, btnY + 26);

    // TAKE Button (Red)
    ctx.beginPath();
    ctx.roundRect(145, btnY, btnW, btnH, 10);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('TAKE', 195, btnY + 26);

    // DISCARD Button (Yellow)
    ctx.beginPath();
    ctx.roundRect(265, btnY, btnW, btnH, 10);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('DISCARD', 315, btnY + 26);
  }

  renderShopOverlay() {
    const ctx = this.ctx;

    // Dark Background Tint Overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Purple Shop Panel Container (Screen 6/8 Spec)
    const panelY = this.height - 340;
    const panelH = 320;

    ctx.beginPath();
    ctx.roundRect(15, panelY, this.width - 30, panelH, 24);
    ctx.fillStyle = 'rgba(88, 28, 135, 0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Shop Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CARD SHOP DRAFT', this.width / 2, panelY + 36);

    // 3 Draft Card Offers ($1, $2, $3)
    for (let i = 0; i < 3; i++) {
      const slotX = this.width / 2 - 120 + i * 120;
      const slotY = panelY + 125;
      const item = this.shopItems[i] || { title: 'Buff Card', price: i + 1 };

      ctx.beginPath();
      ctx.roundRect(slotX - 45, slotY - 60, 90, 120, 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#1E1B4B';
      ctx.font = '700 12px Outfit, sans-serif';
      ctx.fillText(item.title, slotX, slotY - 20);

      // Price Tag Badge ($1, $2, $3)
      ctx.beginPath();
      ctx.roundRect(slotX - 25, slotY + 25, 50, 22, 11);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 13px Fredoka, sans-serif';
      ctx.fillText(`$${item.price}`, slotX, slotY + 40);
    }

    // Shop Control Buttons: NEXT (Red) & RE-ROLL (Green)
    const nextX = this.width / 2 - 130;
    const reX = this.width / 2 + 20;
    const btnY = panelY + panelH - 60;

    // NEXT Button (Red)
    ctx.beginPath();
    ctx.roundRect(nextX, btnY, 110, 42, 12);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 16px Outfit, sans-serif';
    ctx.fillText('NEXT', nextX + 55, btnY + 26);

    // RE-ROLL Button (Green)
    ctx.beginPath();
    ctx.roundRect(reX, btnY, 110, 42, 12);
    ctx.fillStyle = '#10B981';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('RE-ROLL', reX + 55, btnY + 26);
  }

  startRenderLoop() {
    const render = () => {
      this.initCanvas();
      this.ctx.clearRect(0, 0, this.width, this.height);

      if (this.gameState === 'TITLE') {
        this.renderTitleScreen();
      } else {
        this.renderHeaderBar();
        this.renderBattleArea();

        if (this.gameState === 'SHOP') {
          this.renderShopOverlay();
        }
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }
}

// Initialize Game when DOM Ready
window.addEventListener('load', () => {
  new FoolGame();
});
