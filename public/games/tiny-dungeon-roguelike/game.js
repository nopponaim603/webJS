/**
 * Tiny Dungeon Survivor - 2D Action Roguelike Game
 * Built with Phaser 3 & Kenney Tiny Dungeon Assets
 */

// Simple WebAudio SFX Synthesizer
class SoundManager {
    constructor() {
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

    playShoot() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playHit() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playPickup() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.05); // E5
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playLevelUp() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + index * 0.08);
            gain.gain.setValueAtTime(0.2, now + index * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + index * 0.08);
            osc.stop(now + index * 0.08 + 0.2);
        });
    }

    playGameOver() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [300, 260, 220, 180];
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + index * 0.15);
            gain.gain.setValueAtTime(0.2, now + index * 0.15);
            gain.gain.linearRampToValueAtTime(0.01, now + index * 0.15 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + index * 0.15);
            osc.stop(now + index * 0.15 + 0.25);
        });
    }
}

const sounds = new SoundManager();

// Seeded PRNG (mulberry32) — same seed always produces the same sequence,
// so a dungeon layout can be reproduced/debugged instead of relying on Math.random().
function mulberry32(seed) {
    let state = seed >>> 0;
    return function () {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Global Hero Classes Config
const HERO_CLASSES = {
    knight: {
        id: 'knight',
        name: 'Knight (อัศวิน)',
        frame: 96,
        maxHp: 150,
        speed: 95,
        desc: 'ถึกทนที่สุดในเกม เลือดเยอะแต่เดินช้า เริ่มด้วยดาบหมุนเวียนรอบตัว ฟันโดนศัตรูทุกตัวที่เข้าใกล้',
        weapon: 'orbit'
    },
    wizard: {
        id: 'wizard',
        name: 'Wizard (จอมเวท)',
        frame: 84,
        maxHp: 65,
        speed: 125,
        desc: 'เลือดน้อยที่สุด เปราะบางแต่ยิงลูกไฟดาเมจสูงสุดใส่เป้าหมายเดียว เน้นตั้งระยะยิงจากที่ปลอดภัย',
        weapon: 'fireball'
    },
    rogue: {
        id: 'rogue',
        name: 'Rogue (จอมโจร)',
        frame: 86,
        maxHp: 100,
        speed: 165,
        desc: 'เคลื่อนที่ว่องไวที่สุดในเกม เลือดปานกลาง ยิงมีดกระจายหลายเล่มรอบตัวแต่ดาเมจต่อเล่มต่ำ',
        weapon: 'darts'
    }
};

// Available Upgrades List
const UPGRADE_POOL = [
    {
        id: 'fireball_add',
        title: '🔥 Fireball Spell',
        desc: 'ยิงลูกไฟเวทมนตร์สุ่มพุ่งใส่ศัตรูที่อยู่ใกล้ที่สุด',
        icon: '🔥',
        apply: (player) => {
            player.skills.fireball = (player.skills.fireball || 0) + 1;
        }
    },
    {
        id: 'orbit_add',
        title: '⚔️ Orbiting Blades',
        desc: 'เพิ่มคมดาบหมุนเวียนรอบตัวทำความเสียหายแก่ศัตรูที่เข้าใกล้',
        icon: '⚔️',
        apply: (player) => {
            player.skills.orbit = (player.skills.orbit || 0) + 1;
        }
    },
    {
        id: 'darts_add',
        title: '🗡️ Poison Darts',
        desc: 'เพิ่มมีดพิษยิงกระจายรอบทิศทาง',
        icon: '🗡️',
        apply: (player) => {
            player.skills.darts = (player.skills.darts || 0) + 1;
        }
    },
    {
        id: 'lightning_add',
        title: '⚡ Chain Lightning',
        desc: 'ผ่าสายฟ้าฟาดใส่ศัตรูสุ่มบนหน้าจออย่างรุนแรง',
        icon: '⚡',
        apply: (player) => {
            player.skills.lightning = (player.skills.lightning || 0) + 1;
        }
    },
    {
        id: 'hp_boost',
        title: '❤️ Max HP +30%',
        desc: 'เพิ่มค่าพลังชีวิตสูงสุดและฟื้นฟูเลือดทันที 30 หน่วย',
        icon: '❤️',
        apply: (player) => {
            player.maxHp += 30;
            player.hp = Math.min(player.hp + 30, player.maxHp);
        }
    },
    {
        id: 'speed_boost',
        title: '👟 Movement Speed +20%',
        desc: 'วิ่งเร็วขึ้น 20% สำหรับเคลื่อนที่หลบหลีกฝูงมอนสเตอร์',
        icon: '👟',
        apply: (player) => {
            player.speedBonus += 0.2;
        }
    },
    {
        id: 'damage_boost',
        title: '💥 Attack Power +25%',
        desc: 'เพิ่มพลังโจมตีของทุกอาวุธขึ้น 25%',
        icon: '💥',
        apply: (player) => {
            player.damageMult += 0.25;
        }
    },
    {
        id: 'vampire_boost',
        title: '🧛 Vampiric Drain',
        desc: 'มีโอกาส 15% ฟื้นฟู 1 HP เมื่อกำจัดมอนสเตอร์ได้',
        icon: '🧛',
        apply: (player) => {
            player.vampireChance = (player.vampireChance || 0) + 0.15;
        }
    }
];

// --- 1. BOOT SCENE ---
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Loading Progress Bar UI
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x1e293b, 0.8);
        progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 8);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 45,
            text: 'Loading Dungeon Assets...',
            style: {
                font: '16px Outfit, sans-serif',
                fill: '#00f2fe'
            }
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00f2fe, 1);
            progressBar.fillRoundedRect(width / 2 - 155, height / 2 - 10, 310 * value, 20, 6);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Load Spritesheet from public/assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png
        this.load.spritesheet('dungeon_tiles', '/assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png', {
            frameWidth: 16,
            frameHeight: 16,
            margin: 0,
            spacing: 0
        });
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// --- 2. MENU SCENE ---
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        sounds.init();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0x070913).setOrigin(0, 0);

        // Title Text
        this.add.text(width / 2, 80, '🗡️ TINY DUNGEON SURVIVOR 🛡️', {
            font: 'bold 28px Outfit, sans-serif',
            fill: '#00f2fe',
            shadow: { color: '#00f2fe', blur: 15, fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, 120, 'เลือกฮีโร่ของคุณเพื่อเข้าสู่ดันเจี้ยนตะลุยฝูงมอนสเตอร์', {
            font: '14px Outfit, sans-serif',
            fill: '#94a3b8'
        }).setOrigin(0.5);

        // Select Hero Cards
        const heroKeys = Object.keys(HERO_CLASSES);
        const cardWidth = 220;
        const startX = width / 2 - (heroKeys.length * cardWidth) / 2 + cardWidth / 2 - 20;

        heroKeys.forEach((key, index) => {
            const hero = HERO_CLASSES[key];
            const cardX = startX + index * (cardWidth + 20);
            const cardY = 310;

            const container = this.add.container(cardX, cardY);

            // Card Background
            const bg = this.add.rectangle(0, 0, cardWidth, 310, 0x0f172a, 0.9)
                .setStrokeStyle(2, 0x334155)
                .setInteractive({ useHandCursor: true });

            // Hero Sprite (Scaled up 4x)
            const sprite = this.add.sprite(0, -80, 'dungeon_tiles', hero.frame).setScale(4);

            // Hero Name
            const nameText = this.add.text(0, -10, hero.name, {
                font: 'bold 16px Outfit, sans-serif',
                fill: '#f8fafc'
            }).setOrigin(0.5);

            // Hero Stats
            const statsText = this.add.text(0, 20, `HP: ${hero.maxHp} | Speed: ${hero.speed}`, {
                font: '13px Outfit, sans-serif',
                fill: '#38bdf8'
            }).setOrigin(0.5);

            // Description
            const descText = this.add.text(0, 75, hero.desc, {
                font: '12px Outfit, sans-serif',
                fill: '#cbd5e1',
                align: 'center',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5);

            // Select Button
            const selectBtn = this.add.rectangle(0, 125, 160, 36, 0x0284c7)
                .setInteractive({ useHandCursor: true });
            const btnText = this.add.text(0, 125, 'เริ่มเกมฮีโร่นี้', {
                font: 'bold 14px Outfit, sans-serif',
                fill: '#ffffff'
            }).setOrigin(0.5);

            container.add([bg, sprite, nameText, statsText, descText, selectBtn, btnText]);

            // Hover Animation
            bg.on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    y: cardY - 10,
                    duration: 150,
                    ease: 'Power2'
                });
                bg.setStrokeStyle(2, 0x00f2fe);
                selectBtn.setFillStyle(0x00f2fe);
            });

            bg.on('pointerout', () => {
                this.tweens.add({
                    targets: container,
                    y: cardY,
                    duration: 150,
                    ease: 'Power2'
                });
                bg.setStrokeStyle(2, 0x334155);
                selectBtn.setFillStyle(0x0284c7);
            });

            bg.on('pointerdown', () => {
                sounds.playPickup();
                this.scene.start('MainGameScene', { heroId: hero.id });
            });

            selectBtn.on('pointerdown', () => {
                sounds.playPickup();
                this.scene.start('MainGameScene', { heroId: hero.id });
            });
        });

        // Instructions Footer
        this.add.text(width / 2, height - 35, '🎮 ควบคุม: WASD / Arrow Keys หรือ Virtual Touch Joystick บนมือถือ', {
            font: '13px Outfit, sans-serif',
            fill: '#64748b'
        }).setOrigin(0.5);
    }
}

// --- 3. MAIN GAME SCENE ---
class MainGameScene extends Phaser.Scene {
    constructor() {
        super('MainGameScene');
    }

    init(data) {
        this.heroId = data.heroId || 'knight';
        this.heroConfig = HERO_CLASSES[this.heroId];
        
        this.score = 0;
        this.kills = 0;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 10;
        this.gameTime = 0; // seconds
        this.isGameOver = false;

        // Touch Joystick State
        this.touchMove = { x: 0, y: 0 };

        // Seed for this run's dungeon layout — same seed always regenerates the same floor
        this.mapSeed = data.mapSeed || ((Math.random() * 0xFFFFFFFF) >>> 0);
    }

    create() {
        sounds.init();

        // 1. World Bounds & Tilemap Arena
        const MAP_WIDTH = 1400;
        const MAP_HEIGHT = 1400;
        this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

        // Generate Dungeon Arena Background
        this.createDungeonArena(MAP_WIDTH, MAP_HEIGHT);

        // 2. Player Setup
        this.player = this.physics.add.sprite(MAP_WIDTH / 2, MAP_HEIGHT / 2, 'dungeon_tiles', this.heroConfig.frame);
        this.player.setScale(2.2);
        this.player.setCollideWorldBounds(true);
        this.player.body.setCircle(7, 1, 1);

        // Player Stats
        this.player.maxHp = this.heroConfig.maxHp;
        this.player.hp = this.heroConfig.maxHp;
        this.player.speed = this.heroConfig.speed;
        this.player.speedBonus = 1.0;
        this.player.damageMult = 1.0;
        this.player.vampireChance = 0;

        // Player Skills & Weapons State
        this.player.skills = {
            orbit: this.heroConfig.weapon === 'orbit' ? 1 : 0,
            fireball: this.heroConfig.weapon === 'fireball' ? 1 : 0,
            darts: this.heroConfig.weapon === 'darts' ? 1 : 0,
            lightning: 0
        };

        // 3. Camera Setup
        this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.2);

        // 4. Groups & Physics Pools
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.orbitBladeSprites = [];
        this.xpGems = this.physics.add.group();

        // Colliders & Overlaps
        this.physics.add.overlap(this.projectiles, this.enemies, this.handleProjectileEnemyHit, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyOverlap, null, this);
        this.physics.add.overlap(this.player, this.xpGems, this.collectXpGem, null, this);

        // 5. Input Setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.setupVirtualJoystick();

        // 6. Launch Parallel UI Scene
        this.scene.launch('UIScene');

        // 7. Timers & Weapon Fire Loops
        this.time.addEvent({ delay: 1000, callback: this.updateGameTimer, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 1200, callback: this.spawnEnemyWave, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 800, callback: this.fireAutoWeapons, callbackScope: this, loop: true });
    }

    createDungeonArena(mapW, mapH) {
        const tileSize = 16 * 2; // scaled 2x
        const cols = Math.ceil(mapW / tileSize);
        const rows = Math.ceil(mapH / tileSize);

        // Seeded RNG so the floor pattern is random-looking but reproducible from this.mapSeed
        const rng = mulberry32(this.mapSeed);

        // Weighted floor tiles: main floor dominates, variants combined stay within ~5-10%
        const mainFloor = 48;
        const variantFloors = [42, 49];
        const variantChance = 0.07; // ~7% combined chance for a variant tile

        const pickFloorFrame = () => {
            if (rng() < variantChance) {
                return variantFloors[Math.floor(rng() * variantFloors.length)];
            }
            return mainFloor;
        };

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * tileSize + tileSize / 2;
                const y = r * tileSize + tileSize / 2;

                if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                    // Wall border
                    this.add.image(x, y, 'dungeon_tiles', 14).setScale(2);
                } else {
                    // Dungeon Floor Variations
                    this.add.image(x, y, 'dungeon_tiles', pickFloorFrame()).setScale(2);
                }
            }
        }
    }

    setupVirtualJoystick() {
        const joystickBg = document.getElementById('virtual-joystick');
        const joystickKnob = document.getElementById('virtual-joystick-knob');

        if (!joystickBg || !joystickKnob) return;

        let activePointerId = null;
        let startX = 0;
        let startY = 0;
        const maxDist = 40;

        const handleStart = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            activePointerId = touch.identifier || 'mouse';
            const rect = joystickBg.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        };

        const handleMove = (e) => {
            if (activePointerId === null) return;
            const touch = e.touches ? Array.from(e.touches).find(t => t.identifier === activePointerId) || e.touches[0] : e;
            if (!touch) return;

            let dx = touch.clientX - startX;
            let dy = touch.clientY - startY;
            let dist = Math.hypot(dx, dy);

            if (dist > maxDist) {
                dx = (dx / dist) * maxDist;
                dy = (dy / dist) * maxDist;
            }

            joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
            this.touchMove.x = dx / maxDist;
            this.touchMove.y = dy / maxDist;
        };

        const handleEnd = () => {
            activePointerId = null;
            joystickKnob.style.transform = `translate(0px, 0px)`;
            this.touchMove.x = 0;
            this.touchMove.y = 0;
        };

        joystickBg.addEventListener('touchstart', handleStart);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleEnd);
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Player Movement Logic
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;

        // Touch Joystick Overrides
        if (this.touchMove.x !== 0 || this.touchMove.y !== 0) {
            vx = this.touchMove.x;
            vy = this.touchMove.y;
        }

        // Normalize diagonal speed
        if (vx !== 0 && vy !== 0 && this.touchMove.x === 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        const currentSpeed = this.player.speed * this.player.speedBonus;
        this.player.setVelocity(vx * currentSpeed, vy * currentSpeed);

        if (vx < 0) this.player.setFlipX(true);
        else if (vx > 0) this.player.setFlipX(false);

        // Update Orbiting Blades position
        this.updateOrbitBlades(time);

        // Enemies pursuit logic
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) {
                this.physics.moveToObject(enemy, this.player, enemy.speed);
                if (enemy.x < this.player.x) enemy.setFlipX(false);
                else enemy.setFlipX(true);
            }
        });
    }

    updateOrbitBlades(time) {
        const orbitCount = this.player.skills.orbit;
        if (orbitCount <= 0) return;

        // Ensure correct sprite count
        while (this.orbitBladeSprites.length < orbitCount) {
            const blade = this.physics.add.sprite(this.player.x, this.player.y, 'dungeon_tiles', 106).setScale(1.8);
            blade.body.setCircle(6, 2, 2);
            this.orbitBladeSprites.push(blade);

            // Overlap with enemies
            this.physics.add.overlap(blade, this.enemies, (b, enemy) => {
                const now = this.time.now;
                if (enemy.lastOrbitHitTime && now - enemy.lastOrbitHitTime < 400) return;
                enemy.lastOrbitHitTime = now;
                this.damageEnemy(enemy, 20 * this.player.damageMult);
            });
        }

        const radius = 45;
        const angleSpeed = time * 0.003;

        this.orbitBladeSprites.forEach((blade, idx) => {
            const angle = angleSpeed + (idx * (2 * Math.PI / orbitCount));
            blade.x = this.player.x + Math.cos(angle) * radius;
            blade.y = this.player.y + Math.sin(angle) * radius;
            blade.setRotation(angle + Math.PI / 4);
        });
    }

    fireAutoWeapons() {
        if (this.isGameOver) return;

        // 1. Fireball — Render Graphics (จุดไฟสีแดงส้ม)
        if (this.player.skills.fireball > 0) {
            const nearestEnemy = this.getNearestEnemy();
            if (nearestEnemy) {
                sounds.playShoot();
                for (let i = 0; i < this.player.skills.fireball; i++) {
                    this.time.delayedCall(i * 120, () => {
                        if (!this.player.active || !nearestEnemy.active) return;

                        // Create a physics body using a tiny invisible sprite as anchor
                        const proj = this.projectiles.create(this.player.x, this.player.y, 'dungeon_tiles', 0).setAlpha(0).setScale(0.1);
                        proj.damage = 42 * this.player.damageMult;
                        this.physics.moveToObject(proj, nearestEnemy, 240);

                        // Draw red-orange fireball gfx on top of proj position
                        const gfx = this.add.graphics();
                        const drawFireball = () => {
                            gfx.clear();
                            // Outer glow (orange)
                            gfx.fillStyle(0xff6600, 0.35);
                            gfx.fillCircle(proj.x, proj.y, 9);
                            // Inner core (bright red-orange)
                            gfx.fillStyle(0xff3300, 0.85);
                            gfx.fillCircle(proj.x, proj.y, 6);
                            // Bright white center
                            gfx.fillStyle(0xffcc44, 1);
                            gfx.fillCircle(proj.x, proj.y, 3);
                        };

                        // Update gfx each frame to follow proj
                        const listener = this.events.on('update', drawFireball);

                        this.time.delayedCall(2000, () => {
                            this.events.off('update', drawFireball);
                            gfx.destroy();
                            proj.destroy();
                        });

                        proj.on('destroy', () => {
                            this.events.off('update', drawFireball);
                            gfx.destroy();
                        });
                    });
                }
            }
        }

        // 2. Poison Darts
        if (this.player.skills.darts > 0) {
            const dartCount = 4 + (this.player.skills.darts - 1) * 2;
            sounds.playShoot();
            for (let i = 0; i < dartCount; i++) {
                const angle = (i * (2 * Math.PI / dartCount));
                const proj = this.projectiles.create(this.player.x, this.player.y, 'dungeon_tiles', 104).setScale(1.5);
                proj.damage = 13 * this.player.damageMult;
                proj.setRotation(angle);
                this.physics.velocityFromRotation(angle, 220, proj.body.velocity);
                this.time.delayedCall(1500, () => proj.destroy());
            }
        }

        // 3. Lightning Strike
        if (this.player.skills.lightning > 0) {
            const activeEnemies = this.enemies.getChildren().filter(e => e.active);
            if (activeEnemies.length > 0) {
                Phaser.Utils.Array.Shuffle(activeEnemies);
                const targetCount = Math.min(this.player.skills.lightning * 2, activeEnemies.length);
                for (let i = 0; i < targetCount; i++) {
                    const enemy = activeEnemies[i];
                    const bolt = this.add.graphics();
                    bolt.lineStyle(4, 0x38bdf8, 1);
                    bolt.beginPath();
                    bolt.moveTo(enemy.x, enemy.y - 150);
                    bolt.lineTo(enemy.x, enemy.y);
                    bolt.strokePath();

                    this.damageEnemy(enemy, 40 * this.player.damageMult);

                    this.tweens.add({
                        targets: bolt,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => bolt.destroy()
                    });
                }
            }
        }
    }

    spawnEnemyWave() {
        if (this.isGameOver) return;

        // Wave density increases with time
        const maxEnemies = Math.min(15 + Math.floor(this.gameTime / 10) * 3, 60);
        if (this.enemies.countActive(true) >= maxEnemies) return;

        // Enemy Types Configuration (Monsters: 108-110, 120-124 | Human Enemies: 111 Mage, 112 Swordsman)
        const enemyTypes = [
            { name: 'skeleton', frame: 108, hp: 20, speed: 75, xp: 2 },
            { name: 'zombie', frame: 109, hp: 25, speed: 70, xp: 3 },
            { name: 'goblin', frame: 110, hp: 30, speed: 80, xp: 3 },
            { name: 'enemy_mage', frame: 111, hp: 35, speed: 85, xp: 4 },      // ศัตรูคน: นักเวท
            { name: 'enemy_swordsman', frame: 112, hp: 45, speed: 90, xp: 5 }, // ศัตรูคน: นักดาบ
            { name: 'ogre', frame: 120, hp: 55, speed: 60, xp: 6 },
            { name: 'demon_red', frame: 121, hp: 65, speed: 75, xp: 7 },
            { name: 'demon_blue', frame: 122, hp: 75, speed: 80, xp: 8 },
            { name: 'boss_minotaur', frame: 123, hp: 90, speed: 65, xp: 10 },
            { name: 'boss_reaper', frame: 124, hp: 120, speed: 55, xp: 15 }
        ];

        // Pick enemy based on game time and progression
        let availableCount = 3; // start with first 3 types
        if (this.gameTime > 20) availableCount = 5; // unlock Human Mage & Swordsman
        if (this.gameTime > 45) availableCount = 8; // unlock Ogres & Demons
        if (this.gameTime > 75) availableCount = 10; // unlock Bosses

        const typeIdx = Math.floor(Math.random() * availableCount);
        const config = enemyTypes[typeIdx];

        // Spawn position off-screen
        const spawnDist = 450;
        const angle = Math.random() * Math.PI * 2;
        const spawnX = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * spawnDist, 50, 1350);
        const spawnY = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * spawnDist, 50, 1350);

        const enemy = this.enemies.create(spawnX, spawnY, 'dungeon_tiles', config.frame).setScale(2);
        enemy.maxHp = config.hp + Math.floor(this.gameTime / 15) * 5;
        enemy.hp = enemy.maxHp;
        enemy.speed = config.speed;
        enemy.xpValue = config.xp;
        enemy.body.setCircle(6, 2, 2);
    }

    handleProjectileEnemyHit(proj, enemy) {
        if (!proj.active || !enemy.active) return;
        this.damageEnemy(enemy, proj.damage || 20);
        proj.destroy();
    }

    damageEnemy(enemy, amount) {
        enemy.hp -= amount;
        sounds.playHit();

        // Flash Red Effect
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        // Floating Damage Text
        const dmgText = this.add.text(enemy.x, enemy.y - 10, `-${Math.round(amount)}`, {
            font: 'bold 12px Outfit, sans-serif',
            fill: '#facc15'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: dmgText,
            y: enemy.y - 30,
            alpha: 0,
            duration: 500,
            onComplete: () => dmgText.destroy()
        });

        // Enemy Death
        if (enemy.hp <= 0) {
            this.kills++;
            this.score += 10;

            // Spawn XP Gem (Frame 115)
            const gem = this.xpGems.create(enemy.x, enemy.y, 'dungeon_tiles', 115).setScale(1.5);
            gem.xpValue = enemy.xpValue;

            // Vampiric Heal Chance
            if (this.player.vampireChance > 0 && Math.random() < this.player.vampireChance) {
                this.player.hp = Math.min(this.player.hp + 1, this.player.maxHp);
            }

            enemy.destroy();
        }
    }

    handlePlayerEnemyOverlap(player, enemy) {
        if (this.isGameOver) return;

        // Player invulnerability cooldown
        if (player.lastHitTime && this.time.now - player.lastHitTime < 500) return;
        player.lastHitTime = this.time.now;

        player.hp -= 10;
        sounds.playHit();
        this.cameras.main.shake(150, 0.015);

        // Flash White/Red
        player.setTint(0xff3333);
        this.time.delayedCall(150, () => player.clearTint());

        // Check Game Over
        if (player.hp <= 0) {
            player.hp = 0;
            this.handleGameOver();
        }
    }

    collectXpGem(player, gem) {
        if (!gem.active) return;
        sounds.playPickup();

        this.xp += gem.xpValue;
        gem.destroy();

        // Level Up Check
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.4);
        sounds.playLevelUp();

        // Pause Game Scene & Launch Upgrade Choice Modal
        this.scene.pause('MainGameScene');
        this.scene.launch('UpgradeModalScene');
    }

    getNearestEnemy() {
        let nearest = null;
        let minDist = Infinity;
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist < minDist && dist < 400) {
                    minDist = dist;
                    nearest = enemy;
                }
            }
        });
        return nearest;
    }

    updateGameTimer() {
        if (this.isGameOver) return;
        this.gameTime++;
    }

    handleGameOver() {
        this.isGameOver = true;
        sounds.playGameOver();
        this.physics.pause();

        // Cleanup orbit blades
        this.orbitBladeSprites.forEach(b => b.destroy());

        this.scene.stop('UIScene');
        this.scene.start('GameOverScene', {
            score: this.score,
            kills: this.kills,
            level: this.level,
            survivalTime: this.gameTime
        });
    }
}

// --- 4. PARALLEL UI SCENE (HUD) ---
class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        this.mainScene = this.scene.get('MainGameScene');

        const width = this.cameras.main.width;

        // Top Glassmorphism HUD Bar
        this.add.rectangle(width / 2, 28, width - 30, 44, 0x0f172a, 0.8)
            .setStrokeStyle(1, 0x334155);

        // HP Bar
        this.add.text(30, 16, 'HP', { font: 'bold 13px Outfit', fill: '#ef4444' });
        this.hpBox = this.add.graphics();
        this.hpBar = this.add.graphics();

        // XP Bar
        this.add.text(230, 16, 'XP', { font: 'bold 13px Outfit', fill: '#38bdf8' });
        this.xpBox = this.add.graphics();
        this.xpBar = this.add.graphics();

        // Level & Stats Text
        this.levelText = this.add.text(430, 16, 'LVL: 1', { font: 'bold 14px Outfit', fill: '#facc15' });
        this.timeText = this.add.text(width - 240, 16, '⏱️ 00:00', { font: 'bold 14px Outfit', fill: '#f8fafc' });
        this.killsText = this.add.text(width - 130, 16, '☠️ Kills: 0', { font: 'bold 14px Outfit', fill: '#f43f5e' });
    }

    update() {
        if (!this.mainScene || !this.mainScene.player) return;

        const p = this.mainScene.player;

        // Draw HP Bar
        const hpPercent = Phaser.Math.Clamp(p.hp / p.maxHp, 0, 1);
        this.hpBox.clear();
        this.hpBox.fillStyle(0x1e293b, 1);
        this.hpBox.fillRoundedRect(55, 18, 140, 16, 4);

        this.hpBar.clear();
        this.hpBar.fillStyle(hpPercent > 0.3 ? 0xef4444 : 0xf97316, 1);
        this.hpBar.fillRoundedRect(57, 20, 136 * hpPercent, 12, 3);

        // Draw XP Bar
        const xpPercent = Phaser.Math.Clamp(this.mainScene.xp / this.mainScene.xpToNextLevel, 0, 1);
        this.xpBox.clear();
        this.xpBox.fillStyle(0x1e293b, 1);
        this.xpBox.fillRoundedRect(255, 18, 140, 16, 4);

        this.xpBar.clear();
        this.xpBar.fillStyle(0x38bdf8, 1);
        this.xpBar.fillRoundedRect(257, 20, 136 * xpPercent, 12, 3);

        // Update Text
        this.levelText.setText(`LVL: ${this.mainScene.level}`);
        this.killsText.setText(`☠️ ${this.mainScene.kills}`);

        const mins = Math.floor(this.mainScene.gameTime / 60).toString().padStart(2, '0');
        const secs = (this.mainScene.gameTime % 60).toString().padStart(2, '0');
        this.timeText.setText(`⏱️ ${mins}:${secs}`);
    }
}

// --- 5. UPGRADE MODAL SCENE ---
class UpgradeModalScene extends Phaser.Scene {
    constructor() {
        super('UpgradeModalScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Dark Overlay
        this.add.rectangle(0, 0, width, height, 0x030712, 0.85).setOrigin(0);

        // Modal Title
        this.add.text(width / 2, 100, '✨ LEVEL UP! เลือกความสามารถ ✨', {
            font: 'bold 24px Outfit, sans-serif',
            fill: '#facc15',
            shadow: { color: '#facc15', blur: 12, fill: true }
        }).setOrigin(0.5);

        // Pick 3 Random Upgrades
        const choices = Phaser.Utils.Array.Shuffle([...UPGRADE_POOL]).slice(0, 3);
        const cardWidth = 220;
        const startX = width / 2 - (choices.length * cardWidth) / 2 + cardWidth / 2 - 20;

        choices.forEach((cardData, idx) => {
            const cardX = startX + idx * (cardWidth + 20);
            const cardY = 310;

            const container = this.add.container(cardX, cardY);

            // Card Background
            const bg = this.add.rectangle(0, 0, cardWidth, 290, 0x0f172a, 0.95)
                .setStrokeStyle(2, 0x38bdf8)
                .setInteractive({ useHandCursor: true });

            // Icon
            const iconText = this.add.text(0, -75, cardData.icon, {
                font: '44px sans-serif'
            }).setOrigin(0.5);

            // Title
            const titleText = this.add.text(0, -15, cardData.title, {
                font: 'bold 15px Outfit, sans-serif',
                fill: '#f8fafc',
                align: 'center',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5);

            // Description
            const descText = this.add.text(0, 45, cardData.desc, {
                font: '13px Outfit, sans-serif',
                fill: '#94a3b8',
                align: 'center',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5);

            // Select Button
            const selectBtn = this.add.rectangle(0, 110, 160, 36, 0x0284c7)
                .setInteractive({ useHandCursor: true });
            const btnText = this.add.text(0, 110, 'เลือกสกิลนี้', {
                font: 'bold 14px Outfit, sans-serif',
                fill: '#ffffff'
            }).setOrigin(0.5);

            container.add([bg, iconText, titleText, descText, selectBtn, btnText]);

            const chooseCard = () => {
                sounds.playPickup();
                const mainScene = this.scene.get('MainGameScene');
                cardData.apply(mainScene.player);

                this.scene.stop('UpgradeModalScene');
                this.scene.resume('MainGameScene');
            };

            bg.on('pointerover', () => {
                bg.setStrokeStyle(2, 0x00f2fe);
                selectBtn.setFillStyle(0x00f2fe);
            });
            bg.on('pointerout', () => {
                bg.setStrokeStyle(2, 0x38bdf8);
                selectBtn.setFillStyle(0x0284c7);
            });
            bg.on('pointerdown', chooseCard);
            selectBtn.on('pointerdown', chooseCard);
        });
    }
}

// --- 6. GAME OVER SCENE ---
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.stats = data;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.rectangle(0, 0, width, height, 0x070913, 0.95).setOrigin(0);

        this.add.text(width / 2, 120, '☠️ GAME OVER ☠️', {
            font: 'bold 36px Outfit, sans-serif',
            fill: '#ef4444',
            shadow: { color: '#ef4444', blur: 20, fill: true }
        }).setOrigin(0.5);

        // Stats Container Box
        const box = this.add.rectangle(width / 2, 300, 360, 220, 0x0f172a, 0.9)
            .setStrokeStyle(2, 0x334155);

        const mins = Math.floor((this.stats.survivalTime || 0) / 60).toString().padStart(2, '0');
        const secs = ((this.stats.survivalTime || 0) % 60).toString().padStart(2, '0');

        const statsText = [
            `🏆 คะแนนรวม: ${this.stats.score || 0}`,
            `☠️ จำนวนที่กำจัดได้: ${this.stats.kills || 0} ตัว`,
            `⭐ เลเวลสูงสุด: LVL ${this.stats.level || 1}`,
            `⏱️ เวลาที่อยู่รอด: ${mins}:${secs}`
        ].join('\n\n');

        this.add.text(width / 2, 300, statsText, {
            font: '16px Outfit, sans-serif',
            fill: '#cbd5e1',
            align: 'center'
        }).setOrigin(0.5);

        // Restart Button
        const restartBtn = this.add.rectangle(width / 2 - 90, 460, 160, 44, 0x00f2fe)
            .setInteractive({ useHandCursor: true });
        this.add.text(width / 2 - 90, 460, '🔄 เล่นอีกครั้ง', {
            font: 'bold 15px Outfit',
            fill: '#070913'
        }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => {
            sounds.playPickup();
            this.scene.start('MenuScene');
        });

        // Menu Button
        const menuBtn = this.add.rectangle(width / 2 + 90, 460, 160, 44, 0x334155)
            .setInteractive({ useHandCursor: true });
        this.add.text(width / 2 + 90, 460, '🏠 หน้าหลัก', {
            font: 'bold 15px Outfit',
            fill: '#ffffff'
        }).setOrigin(0.5);

        menuBtn.on('pointerdown', () => {
            sounds.playPickup();
            this.scene.start('MenuScene');
        });
    }
}

// --- PHASER GAME CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, MainGameScene, UIScene, UpgradeModalScene, GameOverScene]
};

window.game = new Phaser.Game(config);
