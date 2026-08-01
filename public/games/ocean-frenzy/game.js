/**
 * Ocean Frenzy — Feeding Frenzy Game (G009)
 * Powered by Phaser 3 + Kenney Fish Pack 2
 */

// ═══════════════════════════════════════════════
// CONFIG & FISH CATALOG
// ═══════════════════════════════════════════════

const BASE = 'assets/kenney_fish-pack_2/PNG/Default/';

const PREY_CONFIG = [
    { texture: 'fish_red.png',    minScale: 0.4, maxScale: 0.8, speed: 120, score: 10 },
    { texture: 'fish_green.png',  minScale: 0.4, maxScale: 0.8, speed: 110, score: 12 },
    { texture: 'fish_pink.png',   minScale: 0.4, maxScale: 0.8, speed: 130, score: 15 },
    { texture: 'fish_orange.png', minScale: 0.7, maxScale: 1.2, speed: 85,  score: 20 },
    { texture: 'fish_brown.png',  minScale: 0.7, maxScale: 1.2, speed: 75,  score: 25 },
    { texture: 'fish_blue.png',   minScale: 0.7, maxScale: 1.2, speed: 90,  score: 22 },
    { texture: 'fish_grey.png',   minScale: 1.0, maxScale: 1.5, speed: 60,  score: 40 },
];

const PREDATOR_CONFIG = [
    { texture: 'fish_grey_long_a.png', scale: 1.5, speed: 50 },
    { texture: 'fish_grey_long_b.png', scale: 1.5, speed: 55 },
];

// Score thresholds per level
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000];
const MAX_LEVEL = LEVEL_THRESHOLDS.length;
const LEVEL_NAMES = ['Small', 'Tiny', 'Little', 'Young', 'Grown', 'Big', 'Large', 'Huge', 'KING'];

// ═══════════════════════════════════════════════
// AUDIO MANAGER (Web Audio API)
// ═══════════════════════════════════════════════

class AudioManager {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { this.ctx = null; }
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    play(type) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const tone = (freqStart, freqEnd, dur, wave, vol) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = wave;
            osc.frequency.setValueAtTime(freqStart, now);
            osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + dur);
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + dur + 0.05);
        };
        switch(type) {
            case 'eat':       tone(400, 800, 0.1, 'sine', 0.15); break;
            case 'levelup':
                [523, 659, 784, 1047].forEach((f, i) => {
                    const t = now + i * 0.1;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, t);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                    osc.connect(gain); gain.connect(this.ctx.destination);
                    osc.start(t); osc.stop(t + 0.3);
                }); break;
            case 'hit':       tone(200, 50, 0.25, 'sawtooth', 0.2); break;
            case 'gameover':  tone(300, 50, 0.6, 'sawtooth', 0.18); break;
        }
    }
}

const audio = new AudioManager();

// ═══════════════════════════════════════════════
// PRELOAD SCENE
// ═══════════════════════════════════════════════

class PreloadScene extends Phaser.Scene {
    constructor() { super('PreloadScene'); }

    preload() {
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;

        // Background card
        const bg = this.add.graphics();
        bg.fillStyle(0x0d2137, 1);
        bg.fillRect(0, 0, w, h);
        bg.fillStyle(0x0f2035, 1);
        bg.fillRoundedRect(cx - 160, h/2 - 90, 320, 180, 20);
        bg.lineStyle(1, 0x1e3a5f, 0.5);
        bg.strokeRoundedRect(cx - 160, h/2 - 90, 320, 180, 20);

        this.add.text(cx, h/2 - 50, '🐠 Ocean Frenzy', {
            font: 'bold 22px Inter', fill: '#64ffda'
        }).setOrigin(0.5);

        this.add.text(cx, h/2 - 20, 'Loading...', {
            font: '14px Inter', fill: '#607d8b'
        }).setOrigin(0.5);

        bg.fillStyle(0x1a3a5c, 1);
        bg.fillRoundedRect(cx - 140, h/2 + 20, 280, 12, 6);

        const pct = this.add.text(cx, h/2 + 50, '0%', {
            font: 'bold 12px Inter', fill: '#64ffda'
        }).setOrigin(0.5);

        const textures = new Set();
        PREY_CONFIG.forEach(f => textures.add(BASE + f.texture));
        PREDATOR_CONFIG.forEach(f => textures.add(BASE + f.texture));
        textures.add(BASE + 'fish_blue.png');
        textures.forEach(t => this.load.image(t, t));

        ['bubble_a','bubble_b','bubble_c'].forEach(b => {
            this.load.image(b, BASE + b + '.png');
        });

        const barFill = this.add.graphics();
        this.load.on('progress', (val) => {
            barFill.clear();
            barFill.fillStyle(0x64ffda, 1);
            barFill.fillRoundedRect(cx - 140, h/2 + 20, 280 * val, 12, 6);
            pct.setText(Math.round(val * 100) + '%');
        });
    }

    create() { this.scene.start('MainScene'); }
}

// ═══════════════════════════════════════════════
// MAIN SCENE
// ═══════════════════════════════════════════════

class MainScene extends Phaser.Scene {
    constructor() { super('MainScene'); }

    create() {
        // Unlock audio on first interaction
        let audioReady = false;
        const initAudio = () => { if (!audioReady) { audio.play('eat'); audioReady = true; } };
        this.input.on('pointerdown', initAudio);
        this.input.on('pointerup', initAudio);

        // Game State
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.isGameOver = false;
        this.moveSpeed = 200;
        this.moveTarget = { x: 0, y: 0 };

        // Background
        this.bg = this.add.graphics();
        this.drawBackground();

        // Ambient bubbles from seabed
        this.bubbleEmitter = this.add.particles(0, 0, 'bubble_a', {
            speedY: { min: -60, max: -20 },
            speedX: { min: -10, max: 10 },
            lifespan: { min: 3500, max: 5500 },
            scale: { start: 0.15, end: 0 },
            alpha: { start: 0.4, end: 0 },
            tint: 0x64ffda,
            frequency: 500,
            quantity: 1,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, this.scale.height - 10, this.scale.width, 10)
            }
        }).setDepth(5);

        // Player
        this.player = this.physics.add.sprite(
            this.scale.width / 2, this.scale.height / 2,
            BASE + 'fish_blue.png'
        );
        this.player.setScale(1.2);
        this.player.setDepth(20);

        // Player bubble trail
        this.add.particles(0, 0, 'bubble_a', {
            speed: { min: 5, max: 15 },
            lifespan: 600,
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.35, end: 0 },
            tint: 0x64ffda,
            quantity: 1,
            frequency: 90,
            follow: this.player,
            followOffset: { x: -20, y: 0 }
        }).setDepth(10);

        // Groups
        this.preyGroup = this.physics.add.group({ maxSize: 18 });
        this.predatorGroup = this.physics.add.group({ maxSize: 5 });

        // HUD
        this.createHUD();
        this.updateHUD();

        // Spawners
        this.time.addEvent({ delay: 800, callback: this.spawnPrey, callbackScope: this, repeat: -1 });
        this.time.addEvent({ delay: 2500, callback: this.spawnPredator, callbackScope: this, repeat: -1, delayStart: 6000 });

        // Collisions
        this.physics.add.overlap(this.player, this.preyGroup, this.handleEat, null, this);
        this.physics.add.overlap(this.player, this.predatorGroup, this.handleHit, null, this);

        // Movement target
        this.input.on('pointerdown', (ptr) => {
            this.moveTarget = { x: ptr.x, y: ptr.y };
        });
        this.input.on('pointermove', (ptr) => {
            this.moveTarget = { x: ptr.x, y: ptr.y };
        });

        // Initial population
        for (let i = 0; i < 7; i++) this.spawnPrey();
        for (let i = 0; i < 2; i++) this.spawnPredator();
    }

    // ═══════════════════════════════════════════════
    // Background
    // ═══════════════════════════════════════════════

    drawBackground() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.bg.fillGradientStyle(0x0a2037, 0x0a2037, 0x061220, 0x061220, 1);
        this.bg.fillRect(0, 0, w, h);

        this.bg.fillStyle(0x1a3a5f, 0.12);
        for (let i = 0; i < 5; i++) {
            const x = w * 0.15 + ((w * 0.7) / 4) * i + Phaser.Math.Between(-30, 30);
            this.bg.beginPath();
            this.bg.moveTo(x, 0);
            this.bg.lineTo(x + 60, h);
            this.bg.lineTo(x + 140, h);
            this.bg.lineTo(x + 10, 0);
            this.bg.closePath();
            this.bg.fill();
        }

        this.bg.fillStyle(0x12202e, 0.8);
        this.bg.fillRoundedRect(0, h - 40, w, 40, 0);
        this.bg.fillStyle(0x1e2f3f, 0.5);
        this.bg.fillRoundedRect(0, h - 15, w, 15, 8);
    }

    // ═══════════════════════════════════════════════
    // HUD
    // ═══════════════════════════════════════════════

    createHUD() {
        // Score badge
        this.scoreBadge = this.add.container(10, 8);
        const scoreBg = this.add.graphics();
        scoreBg.fillStyle(0x0d1b2a, 0.8);
        scoreBg.fillRoundedRect(0, 0, 100, 36, 18);
        scoreBg.lineStyle(1, 0x1e3a5f, 0.5);
        scoreBg.strokeRoundedRect(0, 0, 100, 36, 18);
        this.scoreBadge.add(scoreBg);
        this.scoreText = this.add.text(12, 4, '⭐ 0', {
            font: 'bold 15px Inter', fill: '#fbbf24'
        });
        this.scoreBadge.add(this.scoreText);

        // Level badge
        this.levelBadge = this.add.container(118, 8);
        const lvlBg = this.add.graphics();
        lvlBg.fillStyle(0x0d1b2a, 0.8);
        lvlBg.fillRoundedRect(0, 0, 120, 36, 18);
        lvlBg.lineStyle(1, 0x1e3a5f, 0.5);
        lvlBg.strokeRoundedRect(0, 0, 120, 36, 18);
        this.levelBadge.add(lvlBg);
        this.levelText = this.add.text(12, 4, '🐟 Lvl 1', {
            font: 'bold 15px Inter', fill: '#64ffda'
        });
        this.levelBadge.add(this.levelText);

        // Lives badge (right)
        this.livesContainer = this.add.container(this.scale.width - 10, 8);
        const livesBg = this.add.graphics();
        livesBg.fillStyle(0x0d1b2a, 0.8);
        livesBg.fillRoundedRect(0, 0, 90, 36, 18);
        livesBg.lineStyle(1, 0x1e3a5f, 0.5);
        livesBg.strokeRoundedRect(0, 0, 90, 36, 18);
        this.livesContainer.add(livesBg);
        this.livesText = this.add.text(12, 4, '❤️ 3', {
            font: 'bold 15px Inter', fill: '#ef4444'
        });
        this.livesContainer.add(this.livesText);

        // Growth bar
        const barY = this.scale.height - 50;
        this.growBarBg = this.add.graphics();
        this.growBarBg.fillStyle(0x0d1b2a, 0.6);
        this.growBarBg.fillRoundedRect(30, barY, this.scale.width - 60, 14, 7);
        this.growBarFill = this.add.graphics();
        this.growBarText = this.add.text(this.scale.width / 2, barY - 14, 'GROWTH', {
            font: 'bold 10px Inter', fill: '#64ffda'
        }).setOrigin(0.5, 1);
    }

    updateHUD() {
        this.scoreText.setText('⭐ ' + this.score);
        const lvlName = this.level <= MAX_LEVEL ? LEVEL_NAMES[this.level - 1] : 'KING';
        this.levelText.setText('🐟 Lvl ' + this.level + ' ' + lvlName);
        this.livesText.setText('❤️ ' + this.lives);

        this.growBarFill.clear();
        const barY = this.scale.height - 50;
        const barW = this.scale.width - 60;
        if (this.level < MAX_LEVEL) {
            const prev = LEVEL_THRESHOLDS[this.level - 1];
            const target = LEVEL_THRESHOLDS[this.level];
            const progress = Math.min((this.score - prev) / (target - prev), 1);
            this.growBarFill.fillStyle(0x64ffda, 0.8);
            this.growBarFill.fillRoundedRect(30, barY, barW * progress, 14, 7);
            this.growBarFill.lineStyle(1, 0x1e3a5f, 0.3);
            this.growBarFill.strokeRoundedRect(30, barY, barW, 14, 7);
        } else {
            this.growBarFill.fillStyle(0xfbbf24, 0.9);
            this.growBarFill.fillRoundedRect(30, barY, barW, 14, 7);
        }
    }

    // ═══════════════════════════════════════════════
    // Spawning
    // ═══════════════════════════════════════════════

    spawnPrey() {
        if (this.isGameOver) return;
        const type = Phaser.Math.pick(PREY_CONFIG);
        const x = Phaser.Math.Between(30, this.scale.width - 30);
        const y = Phaser.Math.Between(30, this.scale.height - 30);
        const fish = this.preyGroup.create(x, y, BASE + type.texture);
        if (!fish) return;
        fish.setScale(Phaser.Math.FloatBetween(type.minScale, type.maxScale));
        fish.setDepth(15);
        fish.setData('size', Phaser.Math.FloatBetween(type.minScale, type.maxScale));
        fish.setData('score', type.score);
        fish.body.setVelocity(
            Phaser.Math.Between(-type.speed, type.speed),
            Phaser.Math.Between(-type.speed, type.speed)
        );
        fish.flipX = fish.body.velocity.x < 0;
    }

    spawnPredator() {
        if (this.isGameOver) return;
        const type = Phaser.Math.pick(PREDATOR_CONFIG);
        const x = Phaser.Math.Between(30, this.scale.width - 30);
        const y = Phaser.Math.Between(30, this.scale.height - 30);
        const fish = this.predatorGroup.create(x, y, BASE + type.texture);
        if (!fish) return;
        fish.setScale(type.scale);
        fish.setDepth(16);
        fish.body.setVelocity(
            Phaser.Math.Between(-type.speed, type.speed),
            Phaser.Math.Between(-type.speed, type.speed)
        );
        fish.flipX = fish.body.velocity.x < 0;
    }

    // ═══════════════════════════════════════════════
    // Collision Handlers
    // ═══════════════════════════════════════════════

    handleEat(player, prey) {
        if (this.isGameOver) return;
        const preyW = prey.displayWidth;
        const playerW = player.displayWidth;
        if (playerW < preyW * 0.7) return; // Player too small

        prey.destroy();
        const baseScore = prey.getData('score');
        const points = Math.round(baseScore * (1 + (this.level - 1) * 0.2));
        this.score += points;

        this.createBurst(prey.x, prey.y, 0xfbbf24, 8);
        this.createFloatingText(prey.x, prey.y - 20, '+' + points, '#fbbf24');
        player.setScale(Math.min(player.scaleX + 0.02, 3.0));

        audio.play('eat');
        this.updateHUD();
        this.checkLevelUp();
    }

    handleHit(player, predator) {
        if (this.isGameOver) return;
        predator.destroy();
        this.lives--;
        this.updateHUD();

        player.setTint(0xff0000);
        this.time.delayedCall(300, () => player.clearTint());
        this.cameras.main.shake(200, 0.012);
        this.createBurst(player.x, player.y, 0xef4444, 10);
        this.createFloatingText(player.x, player.y - 30, '💥 -1 ❤️', '#ef4444');
        audio.play('hit');

        if (this.lives <= 0) this.endGame();
    }

    checkLevelUp() {
        if (this.level >= MAX_LEVEL) return;
        const target = LEVEL_THRESHOLDS[this.level];
        if (this.score >= target) {
            this.level++;
            this.player.setScale(Math.min(this.player.scaleX * 1.2, 3.0));
            audio.play('levelup');

            const burst = this.add.particles(this.player.x, this.player.y, 'bubble_a', {
                speed: { min: 50, max: 150 },
                lifespan: 1200,
                scale: { start: 0.3, end: 0 },
                alpha: { start: 1, end: 0 },
                tint: 0x64ffda,
                emitting: false
            });
            burst.explode(20);
            this.time.delayedCall(1300, () => burst.destroy());

            this.createFloatingText(this.player.x, this.player.y - 50,
                '⬆️ LVL ' + this.level + ' ' + LEVEL_NAMES[this.level - 1] + '!', '#64ffda');

            this.updateHUD();
        }
    }

    // ═══════════════════════════════════════════════
    // Effects
    // ═══════════════════════════════════════════════

    createBurst(x, y, tint, count) {
        const emitter = this.add.particles(x, y, 'bubble_a', {
            speed: { min: 30, max: 100 },
            lifespan: 500,
            scale: { start: 0.2, end: 0 },
            alpha: { start: 1, end: 0 },
            tint,
            emitting: false
        }).setDepth(30);
        emitter.explode(count);
        this.time.delayedCall(600, () => emitter.destroy());
    }

    createFloatingText(x, y, text, color) {
        const txt = this.add.text(x, y, text, {
            font: 'bold 16px Inter', fill: color,
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(35);
        this.tweens.add({
            targets: txt,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => txt.destroy()
        });
    }

    // ═══════════════════════════════════════════════
    // End
    // ═══════════════════════════════════════════════

    endGame() {
        this.isGameOver = true;
        audio.play('gameover');
        this.player.setVelocity(0, 0);

        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.6);
        overlay.fillRect(0, 0, w, h);
        overlay.setDepth(50);

        const card = this.add.graphics();
        card.fillStyle(0x0d1b2a, 0.95);
        card.fillRoundedRect(cx - 160, cy - 120, 320, 240, 20);
        card.lineStyle(1.5, 0x1e3a5f, 0.6);
        card.strokeRoundedRect(cx - 160, cy - 120, 320, 240, 20);
        card.setDepth(51);

        this.add.text(cx, cy - 85, '🐟 Game Over', {
            font: 'bold 28px Inter', fill: '#ef4444'
        }).setOrigin(0.5).setDepth(52);
        this.add.text(cx, cy - 40, 'SCORE: ' + this.score, {
            font: 'bold 22px Inter', fill: '#fbbf24'
        }).setOrigin(0.5).setDepth(52);
        this.add.text(cx, cy - 5, 'LEVEL: ' + this.level + '  |  EATEN: ' + Math.floor(this.score / 15), {
            font: '14px Inter', fill: '#94a3b8'
        }).setOrigin(0.5).setDepth(52);

        const restartBtn = this.add.container(cx, cy + 55).setDepth(53);
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x64ffda, 0.9);
        btnBg.fillRoundedRect(-90, -21, 180, 42, 21);
        restartBtn.add(btnBg);
        const btnText = this.add.text(0, 0, '🔄 Play Again', {
            font: 'bold 16px Inter', fill: '#0a1628'
        }).setOrigin(0.5);
        restartBtn.add(btnText);

        try {
            const key = 'ocean_frenzy_highscore';
            const prev = parseInt(localStorage.getItem(key) || '0', 10);
            if (this.score > prev) {
                localStorage.setItem(key, '' + this.score);
                this.createFloatingText(cx, cy + 100, '🏆 NEW HIGH SCORE!', '#fbbf24');
            }
        } catch (e) { /* localStorage blocked */ }

        this.input.once('pointerdown', () => this.scene.restart());
    }

    update() {
        if (this.isGameOver) return;

        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.moveTarget.x, this.moveTarget.y
        );
        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.moveTarget.x, this.moveTarget.y
        );

        if (dist > 8) {
            const speed = Math.min(dist * 3, this.moveSpeed * (1 + (this.level - 1) * 0.08));
            this.player.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            this.player.flipX = Math.abs(angle) > Math.PI / 2;
        } else {
            this.player.setVelocity(0, 0);
        }

        const m = 10;
        this.player.x = Phaser.Math.Clamp(this.player.x, m, this.scale.width - m);
        this.player.y = Phaser.Math.Clamp(this.player.y, m, this.scale.height - m);
    }
}

// ═══════════════════════════════════════════════
// GAME CONFIG
// ═══════════════════════════════════════════════

const config = {
    type: Phaser.AUTO,
    width: 540,
    height: 960,
    parent: 'game-container',
    backgroundColor: '#0a1628',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [PreloadScene, MainScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
