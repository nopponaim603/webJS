// ==========================================
// 🧩 TILE SWAP - Endless Mode (Portrait Responsive)
// Assets: Kenney Puzzle Pack 2
// Rule: Endless play — Game ends when no valid swaps remain!
// ==========================================

const GRID_SIZE = 7;
const TILE_SIZE = 64;
const OFFSET_X = 46;  // (540 - 7*64) / 2 = 46px
const OFFSET_Y = 270; // Centered vertical grid

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
        this.moves = 0; // Total moves played (Endless mode)
        this.isBusy = false;
        this.selectedTile = null;
        this.combo = 1;
        this.maxCombo = 1;
        this.gameOver = false;

        this.grid = [];

        // Web Audio Synthesizer fallback
        this.initAudioSynthesizer();

        // Render Background & Board Grid
        this.createBoardUI();

        // Initialize 7x7 Grid with no initial matches and guaranteed possible moves
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
        this.add.rectangle(270, 480, 540, 960, 0x0f172a);

        // Header Title
        this.add.text(270, 45, '💎 KENNEY MATCH 3', {
            font: 'bold 28px Arial',
            fill: '#00F2FE',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(270, 75, '♾️ ENDLESS MODE', {
            font: 'bold 14px Arial',
            fill: '#A78BFA',
            letterSpacing: 2
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
        // Total Swaps Panel
        this.add.rectangle(150, 150, 150, 100, 0x1e293b, 0.95).setStrokeStyle(1, 0x334155);
        this.add.text(150, 120, 'SWAPS', { font: 'bold 15px Arial', fill: '#94a3b8' }).setOrigin(0.5);
        this.movesText = this.add.text(150, 162, '0', { font: 'bold 36px Arial', fill: '#00F2FE' }).setOrigin(0.5);

        // Score Panel
        this.add.rectangle(390, 150, 150, 100, 0x1e293b, 0.95).setStrokeStyle(1, 0x334155);
        this.add.text(390, 120, 'SCORE', { font: 'bold 15px Arial', fill: '#94a3b8' }).setOrigin(0.5);
        this.scoreText = this.add.text(390, 162, '0', { font: 'bold 28px Arial', fill: '#2ED573' }).setOrigin(0.5);

        // Mode Status
        this.statusText = this.add.text(270, 225, '♾️ Game ends when NO valid swaps remain!', {
            font: 'bold 13px Arial', fill: '#fbbf24'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(270, 755, '💡 Tap adjacent gems to swap & match 3 in a line!', {
            font: '14px Arial', fill: '#94a3b8'
        }).setOrigin(0.5);
    }

    createInitialGrid() {
        let attempts = 0;
        do {
            // Destroy previous sprites if regenerating
            if (this.grid.length > 0) {
                for (let r = 0; r < GRID_SIZE; r++) {
                    for (let c = 0; c < GRID_SIZE; c++) {
                        if (this.grid[r]?.[c]) this.grid[r][c].destroy();
                    }
                }
            }

            this.grid = [];
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
            attempts++;
        } while (!this.hasPossibleMoves() && attempts < 10);
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

    // Check if there is AT LEAST ONE valid swap anywhere on the 7x7 board
    hasPossibleMoves() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const tileA = this.grid[r][c];
                if (!tileA) continue;

                // Check Horizontal Swap with Right Neighbor
                if (c < GRID_SIZE - 1) {
                    const tileB = this.grid[r][c + 1];
                    if (tileB) {
                        this.swapGridData(tileA, tileB);
                        const matches = this.findMatches();
                        this.swapGridData(tileA, tileB); // Swap back
                        if (matches.length > 0) return true;
                    }
                }

                // Check Vertical Swap with Bottom Neighbor
                if (r < GRID_SIZE - 1) {
                    const tileB = this.grid[r + 1][c];
                    if (tileB) {
                        this.swapGridData(tileA, tileB);
                        const matches = this.findMatches();
                        this.swapGridData(tileA, tileB); // Swap back
                        if (matches.length > 0) return true;
                    }
                }
            }
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
            // First selection
            this.selectedTile = clickedTile;
            this.drawSelection(clickedTile);
            this.playSound('sfx_swap');
        } else {
            // Second selection
            if (this.selectedTile === clickedTile) {
                // Deselect
                this.selectedTile = null;
                this.selectionGraphic.clear();
            } else if (this.isAdjacent(this.selectedTile, clickedTile)) {
                // Swap attempt
                const tileA = this.selectedTile;
                const tileB = clickedTile;
                this.selectedTile = null;
                this.selectionGraphic.clear();
                this.swapAndProcess(tileA, tileB);
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
        this.selectionGraphic.lineStyle(4, 0x00F2FE, 1);
        this.selectionGraphic.strokeRoundedRect(
            OFFSET_X + tile.col * TILE_SIZE + 4,
            OFFSET_Y + tile.row * TILE_SIZE + 4,
            TILE_SIZE - 8,
            TILE_SIZE - 8,
            8
        );
    }

    isAdjacent(tileA, tileB) {
        const rowDiff = Math.abs(tileA.row - tileB.row);
        const colDiff = Math.abs(tileA.col - tileB.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    async swapAndProcess(tileA, tileB) {
        this.isBusy = true;
        this.playSound('sfx_swap');

        // Animate Swap
        await this.animateSwap(tileA, tileB);

        // Swap in Grid Data
        this.swapGridData(tileA, tileB);

        // Check for matches
        const matches = this.findMatches();

        if (matches.length > 0) {
            // Valid swap! Increment total moves
            this.moves++;
            this.movesText.setText(String(this.moves));
            this.combo = 1;

            await this.processMatches(matches);
        } else {
            // Invalid swap -> Revert
            await this.animateSwap(tileA, tileB);
            this.swapGridData(tileA, tileB);
            this.isBusy = false;
        }
    }

    animateSwap(tileA, tileB) {
        return new Promise(resolve => {
            const targetAX = OFFSET_X + tileB.col * TILE_SIZE + TILE_SIZE / 2;
            const targetAY = OFFSET_Y + tileB.row * TILE_SIZE + TILE_SIZE / 2;
            const targetBX = OFFSET_X + tileA.col * TILE_SIZE + TILE_SIZE / 2;
            const targetBY = OFFSET_Y + tileA.row * TILE_SIZE + TILE_SIZE / 2;

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
                onComplete: resolve
            });
        });
    }

    swapGridData(tileA, tileB) {
        const tempRow = tileA.row;
        const tempCol = tileA.col;

        tileA.row = tileB.row;
        tileA.col = tileB.col;
        tileB.row = tempRow;
        tileB.col = tempCol;

        this.grid[tileA.row][tileA.col] = tileA;
        this.grid[tileB.row][tileB.col] = tileB;
    }

    findMatches() {
        const matchedTiles = new Set();

        // Horizontal matches
        for (let r = 0; r < GRID_SIZE; r++) {
            let matchLen = 1;
            for (let c = 0; c < GRID_SIZE; c++) {
                const current = this.grid[r][c];
                const next = this.grid[r][c + 1];

                if (next && current && current.tileType === next.tileType) {
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

        // Vertical matches
        for (let c = 0; c < GRID_SIZE; c++) {
            let matchLen = 1;
            for (let r = 0; r < GRID_SIZE; r++) {
                const current = this.grid[r][c];
                const next = this.grid[r + 1]?.[c];

                if (next && current && current.tileType === next.tileType) {
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

    async processMatches(matches) {
        this.playSound('sfx_match');

        // Track max combo
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        // Score calculation
        const baseScore = matches.length * 100 * this.combo;
        this.score += baseScore;
        this.scoreText.setText(this.score.toLocaleString());

        // Popup Score Animation
        this.showScorePopup(matches, baseScore);

        // Animate Pop / Destroy
        await new Promise(resolve => {
            this.tweens.add({
                targets: matches,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 250,
                ease: 'Back.easeIn',
                onComplete: () => {
                    matches.forEach(t => {
                        this.grid[t.row][t.col] = null;
                        t.destroy();
                    });
                    resolve();
                }
            });
        });

        // Drop Tiles & Refill
        await this.dropAndRefillGrid();

        // Check for cascades
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            this.combo++;
            await this.processMatches(newMatches);
        } else {
            this.isBusy = false;
            
            // Endless Game Over Check: Are there any valid moves left on the board?
            if (!this.hasPossibleMoves()) {
                this.showNoMoreMovesGameOver();
            }
        }
    }

    showScorePopup(matches, points) {
        let avgX = 0, avgY = 0;
        matches.forEach(m => { avgX += m.x; avgY += m.y; });
        avgX /= matches.length;
        avgY /= matches.length;

        const comboText = this.combo > 1 ? ` COMBO x${this.combo}!` : '';
        const popup = this.add.text(avgX, avgY, `+${points}${comboText}`, {
            font: 'bold 22px Arial',
            fill: '#FFD25D',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: popup,
            y: avgY - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => popup.destroy()
        });
    }

    dropAndRefillGrid() {
        return new Promise(resolve => {
            const dropPromises = [];

            for (let c = 0; c < GRID_SIZE; c++) {
                let emptySlots = 0;

                // Move existing tiles down
                for (let r = GRID_SIZE - 1; r >= 0; r--) {
                    if (this.grid[r][c] === null) {
                        emptySlots++;
                    } else if (emptySlots > 0) {
                        const tile = this.grid[r][c];
                        const newRow = r + emptySlots;

                        this.grid[newRow][c] = tile;
                        this.grid[r][c] = null;
                        tile.row = newRow;

                        const targetY = OFFSET_Y + newRow * TILE_SIZE + TILE_SIZE / 2;

                        const p = new Promise(res => {
                            this.tweens.add({
                                targets: tile,
                                y: targetY,
                                duration: 250 + emptySlots * 40,
                                ease: 'Bounce.easeOut',
                                onComplete: res
                            });
                        });
                        dropPromises.push(p);
                    }
                }

                // Fill new top tiles
                for (let i = 0; i < emptySlots; i++) {
                    const newRow = i;
                    const typeIdx = Phaser.Math.Between(0, TILE_TYPES.length - 1);
                    const tileData = TILE_TYPES[typeIdx];

                    const startX = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
                    const startY = OFFSET_Y - (emptySlots - i) * TILE_SIZE;
                    const targetY = OFFSET_Y + newRow * TILE_SIZE + TILE_SIZE / 2;

                    const sprite = this.add.image(startX, startY, tileData.key)
                        .setDisplaySize(TILE_SIZE - 8, TILE_SIZE - 8)
                        .setInteractive()
                        .setDepth(10);

                    sprite.row = newRow;
                    sprite.col = c;
                    sprite.tileType = typeIdx;
                    this.grid[newRow][c] = sprite;

                    const p = new Promise(res => {
                        this.tweens.add({
                            targets: sprite,
                            y: targetY,
                            duration: 300 + i * 50,
                            ease: 'Bounce.easeOut',
                            onComplete: res
                        });
                    });
                    dropPromises.push(p);
                }
            }

            Promise.all(dropPromises).then(() => {
                this.playSound('sfx_land');
                resolve();
            });
        });
    }

    showNoMoreMovesGameOver() {
        this.gameOver = true;

        const overlay = this.add.graphics().setDepth(50);
        overlay.fillStyle(0x000000, 0.82);
        overlay.fillRect(0, 0, 540, 960);

        this.add.text(270, 350, '🚫 NO MORE MOVES!', {
            font: 'bold 36px Arial', fill: '#FF4757', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(51);

        this.add.text(270, 400, 'ไม่มีคู่ที่สามารถสลับจับคู่ได้เหลืออยู่บนกระดานแล้ว', {
            font: '14px Arial', fill: '#cbd5e1'
        }).setOrigin(0.5).setDepth(51);

        this.add.text(270, 460, `FINAL SCORE: ${this.score.toLocaleString()} pts`, {
            font: 'bold 26px Arial', fill: '#2ED573'
        }).setOrigin(0.5).setDepth(51);

        this.add.text(270, 505, `TOTAL SWAPS: ${this.moves}  |  MAX COMBO: x${this.maxCombo}`, {
            font: '15px Arial', fill: '#94a3b8'
        }).setOrigin(0.5).setDepth(51);

        const restartBtn = this.add.text(270, 580, '🔄 Play Again', {
            font: 'bold 22px Arial',
            fill: '#00F2FE',
            backgroundColor: '#1e293b',
            padding: { x: 28, y: 14 }
        }).setOrigin(0.5).setInteractive().setDepth(51);

        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 540,
    height: 960,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [PreloadScene, MainScene]
};

const game = new Phaser.Game(config);
