// ==========================================
// 🚀 SPACE SHOOTER - Phaser Game
// Assets: Kenney Simple Space (CC0)
// ==========================================

// ---- Preload: Create textures from Kenney assets ----
class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: 'PreloadScene' }); }

    preload() {
        this.load.image('background', '/assets/kenney_simple-space/PNG/Default/star_tiny.png');
        this.load.image('star_bg1', '/assets/kenney_simple-space/PNG/Default/star_small.png');
        this.load.image('star_bg2', '/assets/kenney_simple-space/PNG/Default/star_medium.png');
        this.load.image('star_bg3', '/assets/kenney_simple-space/PNG/Default/star_large.png');
        this.load.image('ship_player', '/assets/kenney_simple-space/PNG/Default/ship_A.png');
        this.load.image('enemy_red', '/assets/kenney_simple-space/PNG/Default/enemy_A.png');
        this.load.image('enemy_green', '/assets/kenney_simple-space/PNG/Default/enemy_B.png');
        this.load.image('enemy_blue', '/assets/kenney_simple-space/PNG/Default/enemy_C.png');
        this.load.image('enemy_purple', '/assets/kenney_simple-space/PNG/Default/enemy_D.png');
        this.load.image('enemy_yellow', '/assets/kenney_simple-space/PNG/Default/enemy_E.png');
        this.load.image('meteor1', '/assets/kenney_simple-space/PNG/Default/meteor_small.png');
        this.load.image('meteor2', '/assets/kenney_simple-space/PNG/Default/meteor_large.png');
        this.load.image('effect1', '/assets/kenney_simple-space/PNG/Default/effect_purple.png');
        this.load.image('effect2', '/assets/kenney_simple-space/PNG/Default/effect_yellow.png');
        this.load.image('bullet', '/assets/kenney_simple-space/PNG/Default/ship_B.png');
        this.load.image('life_icon', '/assets/kenney_simple-space/PNG/Default/icon_plusSmall.png');
        this.load.image('hit_icon', '/assets/kenney_simple-space/PNG/Default/icon_crossSmall.png');
        this.load.image('explosion_big', '/assets/kenney_simple-space/PNG/Default/icon_exclamationLarge.png');
    }

    create() {
        this.scene.start('MainScene');
    }
}

// ---- Main Game Scene ----
class MainScene extends Phaser.Scene {
    constructor() { super({ key: 'MainScene' }); }

    create() {
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.gameOver = false;
        this.paused = false;
        this.fireRate = 200; // ms between shots
        this.lastFire = 0;
        this.enemySpeed = 100;
        this.spawnTimer = 0;
        this.spawnInterval = 1500; // ms between enemy spawns

        // Background stars (parallax layers)
        this.createStarfield();

        // Player setup
        this.createPlayer();

        // Groups
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.explosions = this.add.group();

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.enemyHitPlayer, null, this);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        // UI
        this.createUI();

        // Start spawning enemies
        this.time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnEnemy,
            callbackScope: this,
            repeat: -1
        });

        // Start spawning meteors from top area
        this.time.addEvent({
            delay: 2200,
            callback: this.spawnMeteor,
            callbackScope: this,
            repeat: -1
        });

        // Instructions
        this.add.text(400, 300, '🚀 Click/Touch to Start', {
            font: '20px Arial', fill: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.hideInstructions();
            this.playBackgroundMusic();
        });

        this.events.once('shutdown', () => {
            this.stopBackgroundMusic();
        });
    }

    hideInstructions() {
        this.children.list.forEach(child => {
            if (child instanceof Phaser.GameObjects.Text) {
                child.visible = false;
            }
        });
    }

    createStarfield() {
        this.stars = [];

        // 1. Slow background stars (small) - 15 stars
        for (let i = 0; i < 15; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                'star_bg1'
            ).setAlpha(0.3).setDepth(-10);
            star.speed = 40;
            this.stars.push(star);
        }

        // 2. Medium background stars - 10 stars
        for (let i = 0; i < 10; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                'star_bg2'
            ).setAlpha(0.5).setDepth(-9);
            star.speed = 80;
            this.stars.push(star);
        }

        // 3. Fast foreground stars (large) - 5 stars
        for (let i = 0; i < 5; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                'star_bg3'
            ).setAlpha(0.7).setDepth(-8);
            star.speed = 120;
            this.stars.push(star);
        }
    }

    createPlayer() {
        this.player = this.physics.add.image(400, 520, 'ship_player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Player shield indicator
        this.shieldAlpha = 1;
    }

    createUI() {
        // Score display
        this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
            font: '18px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 2
        }).setDepth(100);

        // Lives display
        this.livesText = this.add.text(16, 40, 'LIVES: ', {
            font: '18px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 2
        }).setDepth(100);
        this.updateLivesUI();

        // Wave display
        this.waveText = this.add.text(650, 16, 'WAVE: 1', {
            font: '18px Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 2
        }).setDepth(100);

        // Controls hint
        this.controlsText = this.add.text(400, 570, '← → Move | SPACE Shoot', {
            font: '12px Arial', fill: '#888888'
        }).setOrigin(0.5).setDepth(100);
    }

    updateLivesUI() {
        let livesStr = '';
        for (let i = 0; i < this.lives; i++) {
            livesStr += '❤️ ';
        }
        for (let i = this.lives; i < 3; i++) {
            livesStr += '🖤 ';
        }
        this.livesText.setText('LIVES: ' + livesStr);
    }

    spawnEnemy() {
        if (this.gameOver) return;

        const enemyTypes = [
            { sprite: 'enemy_red', speed: 80, health: 1, score: 10 },
            { sprite: 'enemy_green', speed: 60, health: 2, score: 20 },
            { sprite: 'enemy_blue', speed: 100, health: 1, score: 15 },
            { sprite: 'enemy_purple', speed: 70, health: 3, score: 30 },
            { sprite: 'enemy_yellow', speed: 50, health: 5, score: 50 }
        ];

        // Pick enemy based on wave difficulty
        let idx;
        if (this.wave <= 1) idx = Phaser.Math.Between(0, 1);
        else if (this.wave <= 3) idx = Phaser.Math.Between(0, 3);
        else idx = Phaser.Math.Between(0, 4);

        const type = enemyTypes[idx];
        const enemy = this.enemies.create(
            Phaser.Math.Between(50, 750),
            -40,
            type.sprite
        );

        enemy.setVelocity(0, type.speed);
        enemy.setData('health', type.health);
        enemy.setData('score', type.score);
        enemy.setDepth(5);

        // Increase difficulty over time
        if (this.spawnTimer > 0) {
            this.spawnInterval = Math.max(500, this.spawnInterval - 50);
        }
    }

    spawnMeteor() {
        if (this.gameOver) return;

        const isLarge = Math.random() > 0.4;
        const sprite = isLarge ? 'meteor2' : 'meteor1';
        const speed = isLarge ? Phaser.Math.Between(40, 80) : Phaser.Math.Between(90, 140);
        const health = isLarge ? 3 : 1;
        const score = isLarge ? 20 : 10;

        const meteor = this.enemies.create(
            Phaser.Math.Between(50, 750),
            -50,
            sprite
        );

        meteor.setVelocity(Phaser.Math.Between(-25, 25), speed);
        meteor.setAngularVelocity(Phaser.Math.Between(-80, 80));
        meteor.setData('health', health);
        meteor.setData('score', score);
        meteor.setDepth(4);
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.audioCtx = new AudioCtx();
            }
        }
    }

    playBackgroundMusic() {
        try {
            if (!this.audioCtx) this.initAudio();
            if (!this.audioCtx || this.bgmInterval) return;
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

            // Sci-fi synth space arpeggio loop (C minor: C3, Eb3, G3, Bb3)
            const notes = [130.81, 155.56, 196.00, 233.08, 261.63, 233.08, 196.00, 155.56];
            let noteIdx = 0;

            this.bgmInterval = setInterval(() => {
                if (this.gameOver || !this.audioCtx) return;

                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(notes[noteIdx], this.audioCtx.currentTime);

                gain.gain.setValueAtTime(0.035, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.18);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start();
                osc.stop(this.audioCtx.currentTime + 0.18);

                noteIdx = (noteIdx + 1) % notes.length;
            }, 220);
        } catch (e) {}
    }

    stopBackgroundMusic() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    playLaserSFX() {
        try {
            if (!this.audioCtx) this.initAudio();
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, this.audioCtx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.1);
        } catch (e) {}
    }

    playExplosionSFX() {
        try {
            if (!this.audioCtx) this.initAudio();
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(160, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.25);

            gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.25);
        } catch (e) {}
    }

    playHitSFX() {
        try {
            if (!this.audioCtx) this.initAudio();
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(80, this.audioCtx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.08);
        } catch (e) {}
    }

    playGameOverSFX() {
        try {
            if (!this.audioCtx) this.initAudio();
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

            const notes = [440, 349, 293, 220];
            notes.forEach((freq, i) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + i * 0.12);

                gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime + i * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + (i + 1) * 0.12);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(this.audioCtx.currentTime + i * 0.12);
                osc.stop(this.audioCtx.currentTime + (i + 1) * 0.12);
            });
        } catch (e) {}
    }

    fireBullet() {
        const now = this.time.now;
        if (now - this.lastFire < this.fireRate) return;

        this.lastFire = now;

        const bullet = this.bullets.create(this.player.x, this.player.y - 30, 'bullet');
        if (bullet) {
            bullet.setScale(0.6);
            bullet.setDepth(9);
            bullet.setVelocity(0, -600);
            this.playLaserSFX();
        }
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy();

        const currentHealth = enemy.getData('health') - 1;
        enemy.setData('health', currentHealth);

        if (currentHealth <= 0) {
            // Enemy destroyed
            this.playExplosionSFX();
            const scoreValue = enemy.getData('score');
            this.score += scoreValue;
            this.scoreText.setText('SCORE: ' + this.score);

            // Create explosion effect
            const explosion = this.add.image(enemy.x, enemy.y, 'explosion_big')
                .setScale(0.5)
                .setAlpha(1);
            this.explosions.add(explosion);

            // Fade out explosion
            this.tweens.add({
                targets: explosion,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 400,
                onComplete: () => explosion.destroy()
            });

            enemy.destroy();

            // Check wave progression
            this.checkWave();
        } else {
            // Hit but not dead - flash effect & hit sound
            this.playHitSFX();
            this.tweens.add({
                targets: enemy,
                alpha: 0.2,
                duration: 50,
                yoyo: true,
                repeat: 2
            });
        }
    }

    enemyHitPlayer(player, enemy) {
        enemy.destroy();
        this.lives--;
        this.updateLivesUI();
        this.playHitSFX();

        // Screen shake
        this.cameras.main.shake(200, 0.01);

        // Flash player red
        this.tweens.add({
            targets: player,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: 3
        });

        if (this.lives <= 0) {
            this.gameOver = true;
            this.physics.pause();
            this.showGameOver();
        }
    }

    checkWave() {
        const newWave = Math.floor(this.score / 100) + 1;
        if (newWave !== this.wave) {
            this.wave = newWave;
            this.waveText.setText('WAVE: ' + this.wave);
            this.enemySpeed += 20;

            // Show wave text
            const waveText = this.add.text(400, 300, 'WAVE ' + this.wave, {
                font: '36px Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(50);

            this.tweens.add({
                targets: waveText,
                alpha: 0,
                scale: 2,
                duration: 1500,
                onComplete: () => waveText.destroy()
            });
        }
    }

    showGameOver() {
        this.stopBackgroundMusic();
        this.playGameOverSFX();
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, 800, 600);

        this.add.text(400, 200, 'GAME OVER', {
            font: '48px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(400, 280, 'SCORE: ' + this.score, {
            font: '24px Arial', fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 320, 'WAVE: ' + this.wave, {
            font: '20px Arial', fill: '#ffff00'
        }).setOrigin(0.5);

        const restartText = this.add.text(400, 400, 'Click to Restart', {
            font: '20px Arial', fill: '#00ff00'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    update(time, delta) {
        // Parallax starfield scrolling (moves even if gameOver is false/true for dynamic space feel)
        if (this.stars) {
            this.stars.forEach(star => {
                star.y += star.speed * (delta / 1000);
                if (star.y > 620) {
                    star.y = -20;
                    star.x = Phaser.Math.Between(0, 800);
                }
            });
        }

        if (this.gameOver) return;

        // Player movement (Keyboard & Pointer)
        if (this.cursors.left.isDown || (this.keyA && this.keyA.isDown)) {
            this.player.setVelocityX(-350);
        } else if (this.cursors.right.isDown || (this.keyD && this.keyD.isDown)) {
            this.player.setVelocityX(350);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.input.activePointer.isDown) {
            this.player.x = Phaser.Math.Clamp(this.input.activePointer.x, 30, 770);
            this.fireBullet();
        }

        // Shooting
        if (this.spaceKey.isDown) {
            this.fireBullet();
        }

        // Cleanup offscreen bullets
        this.bullets.children.each(bullet => {
            if (bullet.active && bullet.y < -50) {
                bullet.destroy();
            }
        });

        // Cleanup offscreen enemies
        this.enemies.children.each(enemy => {
            if (enemy.active && enemy.y > 650) {
                enemy.destroy();
                // Lost a life if enemy passes
                if (!this.gameOver) {
                    this.lives--;
                    this.updateLivesUI();
                    this.cameras.main.shake(100, 0.005);
                    if (this.lives <= 0) {
                        this.gameOver = true;
                        this.physics.pause();
                        this.showGameOver();
                    }
                }
            }
        });
    }
}

// ---- Game Config ----
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [PreloadScene, MainScene]
};

const game = new Phaser.Game(config);