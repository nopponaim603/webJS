// ==========================================
// 💎 KENNEY MATCH 3 - Phaser 2D Game
// Assets: Kenney Match 3 & Puzzle Pack 2
// ==========================================

const GRID_SIZE = 7;
const TILE_SIZE = 64;
const OFFSET_X = 176;
const OFFSET_Y = 110;

const TILE_TYPES = [
    { key: 'gem_red', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles red/tileRed_01.png', color: 0xFF4757 },
    { key: 'gem_blue', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles blue/tileBlue_01.png', color: 0x1E90FF },
    { key: 'gem_green', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles green/tileGreen_01.png', color: 0x2ED573 },
    { key: 'gem_yellow', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles yellow/tileYellow_01.png', color: 0xFFA502 },
    { key: 'gem_orange', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles orange/tileOrange_01.png', color: 0xFF6348 },
    { key: 'gem_pink', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles pink/tilePink_01.png', color: 0xED4C67 }
];

class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: 'PreloadScene' }); }

    preload() {
        // Load tile graphics
        TILE_TYPES.forEach(tile => {
            this.load.image(tile.key, tile.file);
        });

        this.load.image('gem_special', '/assets/kenney-starter-kit-match-3/sprites/tiles/tile-gem.png');

        // Load Kenney sound effects
        this.load.audio('sfx_swap', '/assets/kenney-starter-kit-match-3/sounds/tile-swap.ogg');
        this.load.audio('sfx_match', '/assets/kenney-starter-kit-match-3/sounds/tile-match.ogg');
        this.load.audio('sfx_land', '/assets/kenney-starter-kit-match-3/sounds/tile-land.ogg');
    }

    create() {
        this.scene.start('MainScene');
    }
}

class MainScene extends Phaser.Scene {
    constructor() { super({ key: 'MainScene' }); }

    create() {
        this.score = 0;
        this.moves = 25;
        this.targetScore = 3000;
        this.isBusy = false;
        this.selectedTile = null;
        this.combo = 1;
        this.gameOver = false;

        this.grid = [];

        // Web Audio Synthesizer fallback
        this.initAudioSynthesizer();

        // Render Background & Board Grid
        this.createBoardUI();

        // Initialize 7x7 Grid with no initial matches
        this.createInitialGrid();

        // HUD Text
        this.createHUD();

        // Input Handlers
        this.input.on('pointerdown', this.handlePointerDown, this);
    }

    initAudioSynthesizer() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.audioCtx = new AudioCtx();
            }
        } catch (e) {}
    }

    playSound(key) {
        try {
            if (this.sound && this.sound.get(key)) {
                this.sound.play(key, { volume: 0.5 });
                return;
            }
        } catch (e) {}

        // Fallback Web Audio SFX
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        if (key === 'sfx_swap') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.audioCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);
            osc.connect(gain); gain.connect(this.audioCtx.destination);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.08);
        } else if (key === 'sfx_match') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.50, this.audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
            osc.connect(gain); gain.connect(this.audioCtx.destination);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.15);
        } else if (key === 'sfx_land') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.06);
            osc.connect(gain); gain.connect(this.audioCtx.destination);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.06);
        }
    }

    createBoardUI() {
        // Dark background overlay
        this.add.rectangle(400, 300, 800, 600, 0x0f172a);

        // Header Title
        this.add.text(400, 32, '💎 KENNEY MATCH 3', {
            font: 'bold 26px Arial',
            fill: '#00F2FE',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Board background tile grid
        const boardBg = this.add.graphics();
        boardBg.fillStyle(0x1e293b, 0.9);
        boardBg.fillRoundedRect(OFFSET_X - 10, OFFSET_Y - 10, GRID_SIZE * TILE_SIZE + 20, GRID_SIZE * TILE_SIZE + 20, 16);
        boardBg.lineStyle(2, 0x334155, 1);
        boardBg.strokeRoundedRect(OFFSET_X - 10, OFFSET_Y - 10, GRID_SIZE * TILE_SIZE + 20, GRID_SIZE * TILE_SIZE + 20, 16);

        // Cell slot grid lines
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cellBg = this.add.graphics();
                const isEven = (r + c) % 2 === 0;
                cellBg.fillStyle(isEven ? 0x334155 : 0x1e293b, 0.4);
                cellBg.fillRoundedRect(
                    OFFSET_X + c * TILE_SIZE + 2, 
                    OFFSET_Y + r * TILE_SIZE + 2, 
                    TILE_SIZE - 4, 
                    TILE_SIZE - 4, 
                    8
                );
            }
        }

        // Selection Ring indicator
        this.selectionGraphic = this.add.graphics().setDepth(20);
    }

    createHUD() {
        // Moves Left Panel
        this.add.rectangle(85, 200, 130, 100, 0x1e293b, 0.8).setStrokeStyle(1, 0x334155);
        this.add.text(85, 175, 'MOVES', { font: 'bold 14px Arial', fill: '#94a3b8' }).setOrigin(0.5);
        this.movesText = this.add.text(85, 215, '25', { font: 'bold 36px Arial', fill: '#00F2FE' }).setOrigin(0.5);

        // Score Panel
        this.add.rectangle(85, 340, 130, 100, 0x1e293b, 0.8).setStrokeStyle(1, 0x334155);
        this.add.text(85, 315, 'SCORE', { font: 'bold 14px Arial', fill: '#94a3b8' }).setOrigin(0.5);
        this.scoreText = this.add.text(85, 355, '0', { font: 'bold 28px Arial', fill: '#2ED573' }).setOrigin(0.5);

        // Target Panel
        this.add.text(85, 410, 'Target: 3,000 pts', { font: '12px Arial', fill: '#64748b' }).setOrigin(0.5);

        // Instructions
        this.add.text(400, 575, '💡 Click or drag adjacent gems to swap and match 3 in a line!', {
            font: '13px Arial', fill: '#94a3b8'
        }).setOrigin(0.5);
    }

    createInitialGrid() {
        for (let r = 0; r < GRID_SIZE; r++) {
            this.grid[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                let typeIdx;
                do {
                    typeIdx = Phaser.Math.Between(0, TILE_TYPES.length - 1);
                } while (this.causesMatchOnInit(r, c, typeIdx));

                const tileData = TILE_TYPES[typeIdx];
                const x = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
                const y = OFFSET_Y + r * TILE_SIZE + TILE_SIZE / 2;

                const sprite = this.add.image(x, y, tileData.key)
                    .setDisplaySize(TILE_SIZE - 8, TILE_SIZE - 8)
                    .setInteractive()
                    .setDepth(10);

                sprite.row = r;
                sprite.col = c;
                sprite.tileType = typeIdx;

                this.grid[r][c] = sprite;
            }
        }
    }

    causesMatchOnInit(r, c, typeIdx) {
        if (c >= 2 && this.grid[r][c - 1]?.tileType === typeIdx && this.grid[r][c - 2]?.tileType === typeIdx) {
            return true;
        }
        if (r >= 2 && this.grid[r - 1]?.[c]?.tileType === typeIdx && this.grid[r - 2]?.[c]?.tileType === typeIdx) {
            return true;
        }
        return false;
    }

    handlePointerDown(pointer) {
        if (this.isBusy || this.gameOver) return;

        const col = Math.floor((pointer.x - OFFSET_X) / TILE_SIZE);
        const row = Math.floor((pointer.y - OFFSET_Y) / TILE_SIZE);

        if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

        const clickedTile = this.grid[row][col];
        if (!clickedTile) return;

        if (!this.selectedTile) {
            // Select first tile
            this.selectedTile = clickedTile;
            this.drawSelection(clickedTile);
            this.playSound('sfx_swap');
        } else {
            // Check if adjacent
            const isAdjacent = (Math.abs(this.selectedTile.row - clickedTile.row) + Math.abs(this.selectedTile.col - clickedTile.col)) === 1;

            if (isAdjacent) {
                this.clearSelection();
                this.swapTiles(this.selectedTile, clickedTile);
                this.selectedTile = null;
            } else {
                // Select new tile
                this.selectedTile = clickedTile;
                this.drawSelection(clickedTile);
                this.playSound('sfx_swap');
            }
        }
    }

    drawSelection(tile) {
        this.selectionGraphic.clear();
        this.selectionGraphic.lineStyle(3, 0x00F2FE, 1);
        this.selectionGraphic.strokeRoundedRect(
            OFFSET_X + tile.col * TILE_SIZE + 2,
            OFFSET_Y + tile.row * TILE_SIZE + 2,
            TILE_SIZE - 4,
            TILE_SIZE - 4,
            8
        );
    }

    clearSelection() {
        this.selectionGraphic.clear();
    }

    swapTiles(tileA, tileB, isRevert = false) {
        this.isBusy = true;

        const rowA = tileA.row, colA = tileA.col;
        const rowB = tileB.row, colB = tileB.col;

        // Swap in grid data matrix
        this.grid[rowA][colA] = tileB;
        this.grid[rowB][colB] = tileA;

        tileA.row = rowB; tileA.col = colB;
        tileB.row = rowA; tileB.col = colA;

        const targetAX = OFFSET_X + colB * TILE_SIZE + TILE_SIZE / 2;
        const targetAY = OFFSET_Y + rowB * TILE_SIZE + TILE_SIZE / 2;
        const targetBX = OFFSET_X + colA * TILE_SIZE + TILE_SIZE / 2;
        const targetBY = OFFSET_Y + rowA * TILE_SIZE + TILE_SIZE / 2;

        this.tweens.add({
            targets: tileA,
            x: targetAX,
            y: targetAY,
            duration: 200,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: tileB,
            x: targetBX,
            y: targetBY,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                if (!isRevert) {
                    const matches = this.findMatches();
                    if (matches.length > 0) {
                        this.moves--;
                        this.movesText.setText(this.moves.toString());
                        this.combo = 1;
                        this.processMatches(matches);
                    } else {
                        // Revert swap if no match
                        this.playSound('sfx_swap');
                        this.swapTiles(tileA, tileB, true);
                    }
                } else {
                    this.isBusy = false;
                }
            }
        });
    }

    findMatches() {
        const matchedTiles = new Set();

        // Horizontal Matches
        for (let r = 0; r < GRID_SIZE; r++) {
            let matchLen = 1;
            for (let c = 0; c < GRID_SIZE; c++) {
                const checkNext = c < GRID_SIZE - 1 && this.grid[r][c] && this.grid[r][c + 1] &&
                                   this.grid[r][c].tileType === this.grid[r][c + 1].tileType;
                if (checkNext) {
                    matchLen++;
                } else {
                    if (matchLen >= 3) {
                        for (let i = 0; i < matchLen; i++) {
                            matchedTiles.add(this.grid[r][c - i]);
                        }
                    }
                    matchLen = 1;
                }
            }
        }

        // Vertical Matches
        for (let c = 0; c < GRID_SIZE; c++) {
            let matchLen = 1;
            for (let r = 0; r < GRID_SIZE; r++) {
                const checkNext = r < GRID_SIZE - 1 && this.grid[r][c] && this.grid[r + 1][c] &&
                                   this.grid[r][c].tileType === this.grid[r + 1][c].tileType;
                if (checkNext) {
                    matchLen++;
                } else {
                    if (matchLen >= 3) {
                        for (let i = 0; i < matchLen; i++) {
                            matchedTiles.add(this.grid[r - i][c]);
                        }
                    }
                    matchLen = 1;
                }
            }
        }

        return Array.from(matchedTiles);
    }

    processMatches(matches) {
        this.playSound('sfx_match');

        // Score Calculation
        const points = matches.length * 100 * this.combo;
        this.score += points;
        this.scoreText.setText(this.score.toLocaleString());

        // Combo Popup Text
        if (this.combo > 1) {
            const comboMsg = this.add.text(400, 75, `🔥 COMBO x${this.combo}! (+${points})`, {
                font: 'bold 22px Arial', fill: '#FFA502', stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(30);

            this.tweens.add({
                targets: comboMsg,
                y: 50,
                alpha: 0,
                duration: 1000,
                onComplete: () => comboMsg.destroy()
            });
        }

        // Destroy matched tiles with scale & fade out
        let destroyedCount = 0;
        matches.forEach(tile => {
            const r = tile.row, c = tile.col;
            this.grid[r][c] = null;

            // Spawn particle burst effect
            const tileColor = TILE_TYPES[tile.tileType]?.color || 0xFFFFFF;
            for (let p = 0; p < 6; p++) {
                const particle = this.add.circle(tile.x, tile.y, 4, tileColor).setDepth(25);
                this.tweens.add({
                    targets: particle,
                    x: tile.x + Phaser.Math.Between(-30, 30),
                    y: tile.y + Phaser.Math.Between(-30, 30),
                    alpha: 0,
                    scale: 0.2,
                    duration: 350,
                    onComplete: () => particle.destroy()
                });
            }

            this.tweens.add({
                targets: tile,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 250,
                onComplete: () => {
                    tile.destroy();
                    destroyedCount++;
                    if (destroyedCount === matches.length) {
                        this.applyGravity();
                    }
                }
            });
        });
    }

    applyGravity() {
        this.playSound('sfx_land');
        let maxDropDelay = 0;

        // Shift existing tiles downward
        for (let c = 0; c < GRID_SIZE; c++) {
            let emptySlots = 0;
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
                if (this.grid[r][c] === null) {
                    emptySlots++;
                } else if (emptySlots > 0) {
                    const tile = this.grid[r][c];
                    const targetRow = r + emptySlots;

                    this.grid[targetRow][c] = tile;
                    this.grid[r][c] = null;
                    tile.row = targetRow;

                    const targetY = OFFSET_Y + targetRow * TILE_SIZE + TILE_SIZE / 2;
                    this.tweens.add({
                        targets: tile,
                        y: targetY,
                        duration: 200 + emptySlots * 40,
                        ease: 'Bounce.easeOut'
                    });
                }
            }

            // Spawn new tiles at top for empty slots
            for (let i = 0; i < emptySlots; i++) {
                const targetRow = i;
                const typeIdx = Phaser.Math.Between(0, TILE_TYPES.length - 1);
                const tileData = TILE_TYPES[typeIdx];

                const startX = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
                const startY = OFFSET_Y - (emptySlots - i) * TILE_SIZE;
                const targetY = OFFSET_Y + targetRow * TILE_SIZE + TILE_SIZE / 2;

                const sprite = this.add.image(startX, startY, tileData.key)
                    .setDisplaySize(TILE_SIZE - 8, TILE_SIZE - 8)
                    .setInteractive()
                    .setDepth(10);

                sprite.row = targetRow;
                sprite.col = c;
                sprite.tileType = typeIdx;

                this.grid[targetRow][c] = sprite;

                this.tweens.add({
                    targets: sprite,
                    y: targetY,
                    duration: 300 + i * 50,
                    ease: 'Bounce.easeOut'
                });
            }
        }

        // Wait for drops to complete, then check cascading matches
        this.time.delayedCall(350, () => {
            const newMatches = this.findMatches();
            if (newMatches.length > 0) {
                this.combo++;
                this.processMatches(newMatches);
            } else {
                this.isBusy = false;
                this.checkGameOver();
            }
        });
    }

    checkGameOver() {
        if (this.moves <= 0 || this.score >= this.targetScore) {
            this.gameOver = true;
            this.isBusy = true;

            const isWin = this.score >= this.targetScore;
            const overlay = this.add.graphics().setDepth(50);
            overlay.fillStyle(0x000000, 0.75);
            overlay.fillRect(0, 0, 800, 600);

            const modalTitle = isWin ? '🎉 LEVEL CLEARED!' : '⌛ OUT OF MOVES!';
            const titleColor = isWin ? '#2ED573' : '#FF4757';

            this.add.text(400, 200, modalTitle, {
                font: 'bold 40px Arial', fill: titleColor, stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(51);

            this.add.text(400, 280, `FINAL SCORE: ${this.score.toLocaleString()}`, {
                font: 'bold 26px Arial', fill: '#ffffff'
            }).setOrigin(0.5).setDepth(51);

            const restartBtn = this.add.text(400, 370, '🔄 Play Again', {
                font: 'bold 22px Arial',
                fill: '#00F2FE',
                backgroundColor: '#1e293b',
                padding: { x: 24, y: 12 }
            }).setOrigin(0.5).setInteractive().setDepth(51);

            restartBtn.on('pointerdown', () => {
                this.scene.restart();
            });
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [PreloadScene, MainScene]
};

const game = new Phaser.Game(config);
