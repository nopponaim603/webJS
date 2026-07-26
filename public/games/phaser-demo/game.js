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
        this.load.image('bullet', '/assets/kenney_simple-space/PNG/Default/icon_crossSmall.png');
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
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.enemies, this, this.enemyHitPlayer, null, this);
        this.physics.add.collider(this.enemies, this.bullets, null, null, this);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // UI
        this.createUI();

        // Start spawning enemies
        this.time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnEnemy,
            callbackScope: this,
            repeat: -1
        });

        // Instructions
        this.add.text(400, 300, '🚀 Click/Touch to Start', {
            font: '20px Arial', fill: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.hideInstructions();
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
        // Background starfield
        for (let i = 0; i < 100; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                'star_bg1'
            ).setAlpha(0.3);
            star.setDepth(-1);
        }
        for (let i = 0; i < 50; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                'star_bg2'
            ).setAlpha(0.5);
            star.setDepth(-2);
        }
        for (let i = 0; i < 20; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                'star_bg3'
            ).setAlpha(0.7);
            star.setDepth(-3);
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
        const enemy = this.physics.add.image(
            Phaser.Math.Between(50, 750),
            -40,
            type.sprite
        );

        enemy.setVelocity(0, type.speed);
        enemy.setCollideWorldBounds(true);
        enemy.setBounce(0);
        enemy.setData('health', type.health);
        enemy.setData('score', type.score);
        enemy.setDepth(5);
        this.enemies.add(enemy);

        // Increase difficulty over time
        if (this.spawnTimer > 0) {
            this.spawnInterval = Math.max(500, this.spawnInterval - 50);
        }
    }

    fireBullet() {
        const now = this.time.now;
        if (now - this.lastFire < this.fireRate) return;

        this.lastFire = now;

        const bullet = this.physics.add.image(this.player.x, this.player.y - 30, 'bullet');
        bullet.setVelocity(0, -500);
        bullet.setDepth(9);
        this.bullets.add(bullet);

        // Auto-remove offscreen bullets
        this.time.addEvent({
            delay: 100,
            callback: () => {
                if (bullet.active && bullet.y < -50) {
                    bullet.destroy();
                }
            }
        });
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy();

        const currentHealth = enemy.getData('health') - 1;
        enemy.setData('health', currentHealth);

        if (currentHealth <= 0) {
            // Enemy destroyed
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
            // Hit but not dead - flash effect
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
        if (this.gameOver) return;

        // Player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
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