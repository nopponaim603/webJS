// 2048 Cubes - Game Logic using Phaser 3 and Matter.js

const config = {
    type: Phaser.AUTO,
    width: 450,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#3c343b',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 450,
        height: 600,
        expandParent: true
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1.5 },
            debug: false,
            enableSleeping: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);

let score = 0;
let highscore = localStorage.getItem('2048-cubes-highscore') || 0;
let currentCube = null;
let isDropping = false;
let ground, leftWall, rightWall;
let gameOverLine;
let gameOverLineTimer = 0;
let isGameOver = false;

const cubeColors = {
    2: 0xff9ff3,
    4: 0xfeca57,
    8: 0xff6b6b,
    16: 0x48dbfb,
    32: 0x1dd1a1,
    64: 0x5f27cd,
    128: 0x54a0ff,
    256: 0x00d2d3,
    512: 0xff9f43,
    1024: 0xee5253,
    2048: 0x0abde3,
    4096: 0x10ac84,
    8192: 0x222f3e
};

const cubeSizes = {
    2: 40,
    4: 45,
    8: 50,
    16: 55,
    32: 60,
    64: 65,
    128: 70,
    256: 75,
    512: 80,
    1024: 85,
    2048: 90
};

function preload() {
    // No external assets needed, we'll use graphics
}

function create() {
    const { width, height } = this.scale;

    // UI Updates
    document.getElementById('score').innerText = score;
    document.getElementById('highscore').innerText = highscore;

    // Physics Boundaries
    this.matter.world.setBounds(0, 0, width, height, 32, true, true, false, true);

    // Game Over Line
    gameOverLine = this.add.graphics();
    const updateDashedLine = (isLight) => {
        gameOverLine.clear();
        gameOverLine.lineStyle(2, isLight ? 0x776e65 : 0xffffff, 0.3);
        drawDashedLine(gameOverLine, 0, 150, width, 150);
    };

    updateDashedLine(document.body.classList.contains('light'));

    // Theme Button Logic
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.onclick = () => {
        document.body.classList.toggle('light');
        const isLight = document.body.classList.contains('light');
        this.cameras.main.setBackgroundColor(isLight ? '#faf8ef' : '#3c343b');
        updateDashedLine(isLight);
    };

    // Fullscreen Exit Button Logic
    const exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');

    const updateFullscreenBtn = () => {
        if (document.fullscreenElement) {
            exitFullscreenBtn.classList.remove('hidden');
        } else {
            exitFullscreenBtn.classList.add('hidden');
        }
    };

    exitFullscreenBtn.onclick = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    };

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', updateFullscreenBtn);
    // Initial check
    updateFullscreenBtn();

    // Restart Button
    document.getElementById('restart-btn').onclick = () => {
        location.reload();
    };

    // Spawn First Cube
    spawnCube.call(this);

    // Input Handling
    this.input.on('pointermove', (pointer) => {
        if (!isGameOver && currentCube && currentCube.active && !isDropping) {
            const size = cubeSizes[currentCube.value] || 60;
            const minX = size / 2 + 10;
            const maxX = width - size / 2 - 10;
            const newX = Phaser.Math.Clamp(pointer.x, minX, maxX);
            currentCube.setPosition(newX, currentCube.y);
        }
    });

    this.input.on('pointerup', (pointer) => {
        if (!isGameOver && currentCube && currentCube.active && !isDropping) {
            if (pointer.y > 0 && pointer.y < height) {
                dropCube.call(this);
            }
        }
    });

    // Collision Logic
    this.matter.world.on('collisionstart', (event) => {
        if (isGameOver) return;
        event.pairs.forEach(pair => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            if (bodyA && bodyB && bodyA.gameObject && bodyB.gameObject) {
                const objA = bodyA.gameObject;
                const objB = bodyB.gameObject;

                if (objA.isCube && objB.isCube &&
                    objA.active && objB.active &&
                    objA.value === objB.value &&
                    !objA.isMerging && !objB.isMerging) {
                    mergeCubes.call(this, objA, objB);
                }
            }
        });
    });
}

function spawnCube() {
    const values = [2, 4, 8, 16, 32];
    const value = values[Math.floor(Math.random() * values.length)];
    const size = cubeSizes[value];

    const x = this.scale.width / 2;
    const y = 80;

    currentCube = createCubeGraphic.call(this, x, y, value);
    currentCube.setStatic(true);
    currentCube.isDropping = false;
    isDropping = false;
}

function dropCube() {
    if (!currentCube || isDropping) return;

    isDropping = true;
    currentCube.setStatic(false);
    currentCube.setMass(1);
    currentCube.setBounce(0.3);
    currentCube.setFriction(0.005);
    currentCube.setVelocityY(2);

    this.time.delayedCall(800, () => {
        if (!isGameOver) spawnCube.call(this);
    });
}

function createCubeGraphic(x, y, value) {
    const size = cubeSizes[value] || 60;
    const color = cubeColors[value] || 0xffffff;

    const container = this.add.container(x, y);

    const shadow = this.add.rectangle(4, 4, size, size, 0x000000, 0.2);
    container.add(shadow);

    const rect = this.add.rectangle(0, 0, size, size, color);
    rect.setStrokeStyle(2, 0xffffff, 0.5);
    container.add(rect);

    const text = this.add.text(0, 0, value, {
        fontSize: Math.max(16, size * 0.4) + 'px',
        fontWeight: '800',
        color: '#ffffff',
        fontFamily: 'Inter'
    }).setOrigin(0.5);
    container.add(text);

    const body = this.matter.add.gameObject(container, {
        shape: { type: 'rectangle', width: size, height: size },
        chamfer: { radius: 8 },
        density: 0.001
    });

    body.isCube = true;
    body.value = value;
    body.isMerging = false;
    body.setFixedRotation(false);

    return body;
}

function mergeCubes(objA, objB) {
    if (!objA.active || !objB.active || objA.isMerging || objB.isMerging) return;

    objA.isMerging = true;
    objB.isMerging = true;

    if (objA === currentCube) currentCube = null;
    if (objB === currentCube) currentCube = null;

    objA.setStatic(true);
    objB.setStatic(true);
    objA.setSensor(true);
    objB.setSensor(true);

    this.tweens.killTweensOf(objA);
    this.tweens.killTweensOf(objB);

    const newValue = objA.value * 2;
    const midX = (objA.x + objB.x) / 2;
    const midY = (objA.y + objB.y) / 2;

    this.tweens.add({
        targets: [objA, objB],
        x: midX,
        y: midY,
        scale: 0.5,
        alpha: 0.5,
        duration: 100,
        onComplete: () => {
            if (objA.active) objA.destroy();
            if (objB.active) objB.destroy();

            const newCube = createCubeGraphic.call(this, midX, midY, newValue);
            newCube.setStatic(false);
            newCube.setBounce(0.3);

            newCube.setScale(0.1);
            this.tweens.add({
                targets: newCube,
                scale: 1,
                duration: 200,
                ease: 'Back.out'
            });

            createExplosion.call(this, midX, midY, cubeColors[newValue]);

            score += newValue;
            document.getElementById('score').innerText = score;
            if (score > highscore) {
                highscore = score;
                localStorage.setItem('2048-cubes-highscore', highscore);
                document.getElementById('highscore').innerText = highscore;
            }

            if (currentCube === null && !isDropping && !isGameOver) {
                spawnCube.call(this);
            }
        }
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 10; i++) {
        const p = this.add.rectangle(x, y, 8, 8, color);
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;

        this.tweens.add({
            targets: p,
            x: x + Math.cos(angle) * 50,
            y: y + Math.sin(angle) * 50,
            alpha: 0,
            scale: 0,
            rotation: Math.random() * 10,
            duration: 500,
            onComplete: () => p.destroy()
        });
    }
}

function update(time, delta) {
    if (isGameOver) return;

    let isAboveLine = false;
    const bodies = this.matter.world.getAllBodies();

    for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        if (!body || !body.position || !body.velocity || !body.gameObject) continue;
        const obj = body.gameObject;

        if (obj.isCube && !body.isStatic && obj.active && !obj.isMerging) {
            const size = cubeSizes[obj.value] || 60;
            const topEdge = body.position.y - (size / 2);
            const speed = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);

            if (topEdge < 150 && speed < 0.5) {
                isAboveLine = true;
                break;
            }
        }
    }

    const { width } = this.scale;
    if (isAboveLine) {
        gameOverLineTimer += delta;
        gameOverLine.clear();
        gameOverLine.lineStyle(3, 0xff4757, 0.8);
        drawDashedLine(gameOverLine, 0, 150, width, 150);

        if (gameOverLineTimer > 3000) {
            endGame.call(this);
        }
    } else {
        if (gameOverLineTimer > 0) {
            const isLight = document.body.classList.contains('light');
            gameOverLine.clear();
            gameOverLine.lineStyle(2, isLight ? 0x776e65 : 0xffffff, 0.3);
            drawDashedLine(gameOverLine, 0, 150, width, 150);
        }
        gameOverLineTimer = 0;
    }
}

function drawDashedLine(graphics, x1, y1, x2, y2, dashLength = 10, gapLength = 10) {
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const dashCount = Math.floor(distance / (dashLength + gapLength));
    const dx = (x2 - x1) / distance;
    const dy = (y2 - y1) / distance;

    for (let i = 0; i < dashCount; i++) {
        const startX = x1 + (dx * (i * (dashLength + gapLength)));
        const startY = y1 + (dy * (i * (dashLength + gapLength)));
        graphics.lineBetween(startX, startY, startX + dx * dashLength, startY + dy * dashLength);
    }
}

function endGame() {
    isGameOver = true;
    document.getElementById('final-score').innerText = score;
    document.getElementById('game-over').classList.remove('hidden');
}
