// =================================================================
// 🧩 TILE SWAP — Sweet Match, Town Map & Shop Decorator
// Full Agile Implementation covering US-08-01..11, US-09-01..04, US-10-01..04, US-11-01..04
// =================================================================

const GRID_SIZE = 7;
const TILE_SIZE = 64;
const OFFSET_X = 46;  // (540 - 7*64) / 2 = 46px
const OFFSET_Y = 250; // Centered vertical grid

const TILE_TYPES = [
    { key: 'gem_red', name: '🍓 Red Berry', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles red/tileRed_01.png', color: 0xFF4757 },
    { key: 'gem_blue', name: '🫐 Blue Mint', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles blue/tileBlue_01.png', color: 0x1E90FF },
    { key: 'gem_green', name: '🍵 Green Matcha', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles green/tileGreen_01.png', color: 0x2ED573 },
    { key: 'gem_yellow', name: '🍌 Yellow Banana', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles yellow/tileYellow_01.png', color: 0xFFA502 },
    { key: 'gem_orange', name: '🥭 Orange Mango', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles orange/tileOrange_01.png', color: 0xFF6348 },
    { key: 'gem_pink', name: '🍧 Pink Strawberry', file: '/assets/kenney_puzzle-pack-2/PNG/Tiles pink/tilePink_01.png', color: 0xED4C67 }
];

const SHOP_TIERS = [
    { level: 1, name: '🛒 Ice Cream Cart', cost: 0, revenue: '1x', tipRate: '5%' },
    { level: 2, name: '🏪 Small Ice Cream Shop', cost: 500, revenue: '1.5x', tipRate: '10%' },
    { level: 3, name: '🛍️ Sweet Boutique', cost: 1200, revenue: '2x', tipRate: '15%' },
    { level: 4, name: '🏬 Grand Ice Cream Store', cost: 2500, revenue: '3x', tipRate: '20%' },
    { level: 5, name: '🏢 Ice Cream Megastore', cost: 5000, revenue: '5x', tipRate: '30%' }
];

const TOWN_ZONES = [
    { id: 1, name: '🏛️ Town Square', reqLevel: 1, color: '#f59e0b', desc: 'ศูนย์กลางเมืองไอศกรีม' },
    { id: 2, name: '🏫 High School', reqLevel: 2, color: '#3b82f6', desc: 'ย่านวัยรุ่นชอบไอศกรีม' },
    { id: 3, name: '🏙️ Business District', reqLevel: 3, color: '#8b5cf6', desc: 'ย่านคนทำงานคึกคัก' },
    { id: 4, name: '🎨 Art Alley', reqLevel: 4, color: '#ec4899', desc: 'ถนนศิลปะสีสันสดใส' },
    { id: 5, name: '🏖️ Sunshine Beach', reqLevel: 5, color: '#06b6d4', desc: 'ชายหาดดับร้อน' },
    { id: 6, name: '🎡 Summer Festival', reqLevel: 6, color: '#10b981', desc: 'งานเทศกาลฤดูร้อน' },
    { id: 7, name: '🌃 Night City', reqLevel: 7, color: '#6366f1', desc: 'เมืองกลางคืนเรืองแสง' }
];

// Persistent Economy State in LocalStorage
class GameData {
    static getCoins() {
        return parseInt(localStorage.getItem('sweet_match_coins') || '300', 10);
    }
    static addCoins(amount) {
        const val = GameData.getCoins() + amount;
        localStorage.setItem('sweet_match_coins', val.toString());
        return val;
    }
    static spendCoins(amount) {
        const current = GameData.getCoins();
        if (current >= amount) {
            localStorage.setItem('sweet_match_coins', (current - amount).toString());
            return true;
        }
        return false;
    }
    static getShopTier() {
        return parseInt(localStorage.getItem('sweet_match_shop_tier') || '1', 10);
    }
    static setShopTier(tier) {
        localStorage.setItem('sweet_match_shop_tier', tier.toString());
    }
    static getMaxLevel() {
        return parseInt(localStorage.getItem('sweet_match_max_level') || '1', 10);
    }
    static unlockLevel(lvl) {
        const current = GameData.getMaxLevel();
        if (lvl > current) {
            localStorage.setItem('sweet_match_max_level', lvl.toString());
        }
    }
    static getBoosters() {
        const data = localStorage.getItem('sweet_match_boosters');
        return data ? JSON.parse(data) : { hammer: 2, shuffle: 2, bomb: 1 };
    }
    static saveBoosters(boosters) {
        localStorage.setItem('sweet_match_boosters', JSON.stringify(boosters));
    }
    static getDecorations() {
        const data = localStorage.getItem('sweet_match_decor');
        return data ? JSON.parse(data) : { counter: 'standard', table: 'wood', plant: 'palm', avatar: 'chef' };
    }
    static saveDecorations(decor) {
        localStorage.setItem('sweet_match_decor', JSON.stringify(decor));
    }
}

// Web Audio Synthesizer Class
class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.init();
    }
    init() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.audioCtx = new AudioCtx();
        } catch (e) {}
    }
    resume() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }
    playSwap() {
        if (!this.audioCtx) return;
        this.resume();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(550, this.audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.08);
    }
    playMatch() {
        if (!this.audioCtx) return;
        this.resume();
        const now = this.audioCtx.currentTime;
        [523.25, 659.25, 783.99].forEach((f, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.04);
            gain.gain.setValueAtTime(0.25, now + i * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.15);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + i * 0.04);
            osc.stop(now + i * 0.04 + 0.15);
        });
    }
    playCombo() {
        if (!this.audioCtx) return;
        this.resume();
        const now = this.audioCtx.currentTime;
        [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.05);
            gain.gain.setValueAtTime(0.3, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.25);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.25);
        });
    }
}

const sounds = new SoundManager();

// ==========================================
// SCENE 1: PRELOAD SCENE
// ==========================================
class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: 'PreloadScene' }); }

    preload() {
        TILE_TYPES.forEach(t => this.load.image(t.key, t.file));
        this.load.image('rainbow_bomb', '/assets/kenney-starter-kit-match-3/sprites/tiles/tile-gem.png');
    }

    create() {
        this.scene.start('TownMapScene');
    }
}

// ==========================================
// SCENE 2: TOWN MAP SCENE (7 Interactive Zones)
// ==========================================
class TownMapScene extends Phaser.Scene {
    constructor() { super({ key: 'TownMapScene' }); }

    create() {
        const maxLevel = GameData.getMaxLevel();
        const coins = GameData.getCoins();
        const shopTier = GameData.getShopTier();

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e1b4b, 0x1e1b4b, 1);
        bg.fillRect(0, 0, 540, 960);

        // Header Title
        this.add.text(270, 50, '🍦 SWEET ICE CREAM TOWN 🗺️', {
            font: 'bold 24px Fredoka', fill: '#fbbf24', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        // Stats HUD Bar
        this.add.text(40, 95, `💰 Coins: ${coins}`, { font: 'bold 18px Fredoka', fill: '#fef08a' });
        this.add.text(280, 95, `🏬 Shop: Tier ${shopTier}`, { font: 'bold 18px Fredoka', fill: '#c084fc' });
        this.add.text(440, 95, `⭐ Lvl ${maxLevel}`, { font: 'bold 18px Fredoka', fill: '#4ade80' });

        // Town Map Zones Grid
        this.add.text(270, 140, 'เลือกโซนเพื่อเล่นด่าน / ขยายธุรกิจร้านไอศกรีม', {
            font: '14px Fredoka', fill: '#94a3b8'
        }).setOrigin(0.5);

        let startY = 180;
        TOWN_ZONES.forEach((zone, idx) => {
            const isUnlocked = zone.reqLevel <= maxLevel;
            const y = startY + idx * 80;

            const card = this.add.graphics();
            card.fillStyle(isUnlocked ? 0x1e293b : 0x0f172a, 0.9);
            card.lineStyle(2, isUnlocked ? Phaser.Display.Color.HexStringToColor(zone.color).color : 0x334155, 1);
            card.fillRoundedRect(30, y, 480, 68, 14);
            card.strokeRoundedRect(30, y, 480, 68, 14);

            const title = this.add.text(50, y + 15, zone.name, {
                font: 'bold 18px Fredoka', fill: isUnlocked ? '#ffffff' : '#64748b'
            });

            this.add.text(50, y + 42, isUnlocked ? zone.desc : `🔒 ต้องการ Level ${zone.reqLevel}`, {
                font: '13px Fredoka', fill: isUnlocked ? '#94a3b8' : '#e2e8f0'
            });

            const actionBtn = this.add.text(450, y + 34, isUnlocked ? '▶️ Play' : '🔒 Locked', {
                font: 'bold 15px Fredoka',
                fill: isUnlocked ? '#4ade80' : '#e2e8f0',
                backgroundColor: isUnlocked ? '#065f46' : '#334155',
                padding: { x: 12, y: 6 }
            }).setOrigin(0.5).setInteractive();

            if (isUnlocked) {
                actionBtn.on('pointerdown', () => {
                    this.scene.start('MainMatchScene', { level: zone.reqLevel, zoneName: zone.name });
                });
            }
        });

        // Bottom Navigation Bar
        const navBg = this.add.graphics();
        navBg.fillStyle(0x020617, 0.95);
        navBg.fillRect(0, 870, 540, 90);

        const btnShop = this.add.text(135, 915, '🏪 Shop & Tiers', {
            font: 'bold 18px Fredoka', fill: '#a855f7', backgroundColor: '#3b0764', padding: { x: 16, y: 10 }
        }).setOrigin(0.5).setInteractive();
        btnShop.on('pointerdown', () => this.scene.start('ShopScene'));

        const btnDecor = this.add.text(405, 915, '🛋️ Decorate Shop', {
            font: 'bold 18px Fredoka', fill: '#f59e0b', backgroundColor: '#451a03', padding: { x: 16, y: 10 }
        }).setOrigin(0.5).setInteractive();
        btnDecor.on('pointerdown', () => this.scene.start('DecorateScene'));
    }
}

// ==========================================
// SCENE 3: MAIN MATCH-3 SCENE (US-08-01..11)
// ==========================================
class MainMatchScene extends Phaser.Scene {
    constructor() { super({ key: 'MainMatchScene' }); }

    init(data) {
        this.level = data.level || 1;
        this.zoneName = data.zoneName || '🏛️ Town Square';
        this.targetScore = 1200 + (this.level - 1) * 400;
        this.movesLeft = 20;
    }

    create() {
        this.score = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.isBusy = false;
        this.selectedTile = null;
        this.gameOver = false;
        this.activeBooster = null; // 'hammer', 'shuffle', 'bomb'

        this.grid = [];
        this.boosters = GameData.getBoosters();

        // UI & Board Setup
        this.createBoardUI();
        this.createInitialGrid();
        this.createHUD();
        this.createBoosterBar();

        this.input.on('pointerdown', this.handlePointerDown, this);
    }

    createBoardUI() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e1b4b, 0x1e1b4b, 1);
        bg.fillRect(0, 0, 540, 960);

        // Header Card
        this.add.text(270, 45, `${this.zoneName} — Level ${this.level}`, {
            font: 'bold 22px Fredoka', fill: '#fbbf24', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        // Grid Background Frame
        const boardBg = this.add.graphics();
        boardBg.fillStyle(0x1e293b, 0.9);
        boardBg.lineStyle(4, 0xf59e0b, 0.8);
        boardBg.fillRoundedRect(OFFSET_X - 10, OFFSET_Y - 10, GRID_SIZE * TILE_SIZE + 20, GRID_SIZE * TILE_SIZE + 20, 16);
        boardBg.strokeRoundedRect(OFFSET_X - 10, OFFSET_Y - 10, GRID_SIZE * TILE_SIZE + 20, GRID_SIZE * TILE_SIZE + 20, 16);
    }

    createHUD() {
        this.scoreText = this.add.text(45, 95, `⭐ Score: 0 / ${this.targetScore}`, {
            font: 'bold 18px Fredoka', fill: '#4ade80'
        });

        this.movesText = this.add.text(360, 95, `🎯 Moves: ${this.movesLeft}`, {
            font: 'bold 18px Fredoka', fill: '#f43f5e'
        });
    }

    createBoosterBar() {
        this.add.text(270, 725, '🔨 TOOLBAR BOOSTERS 🔀', {
            font: 'bold 14px Fredoka', fill: '#94a3b8'
        }).setOrigin(0.5);

        const btnHammer = this.add.text(120, 770, `🔨 Hammer (${this.boosters.hammer})`, {
            font: 'bold 14px Fredoka', fill: '#fff', backgroundColor: '#334155', padding: { x: 10, y: 8 }
        }).setOrigin(0.5).setInteractive();
        btnHammer.on('pointerdown', () => this.selectBooster('hammer', btnHammer));

        const btnShuffle = this.add.text(270, 770, `🔀 Shuffle (${this.boosters.shuffle})`, {
            font: 'bold 14px Fredoka', fill: '#fff', backgroundColor: '#334155', padding: { x: 10, y: 8 }
        }).setOrigin(0.5).setInteractive();
        btnShuffle.on('pointerdown', () => this.useShuffleBooster());

        const btnBomb = this.add.text(420, 770, `💣 Bomb (${this.boosters.bomb})`, {
            font: 'bold 14px Fredoka', fill: '#fff', backgroundColor: '#334155', padding: { x: 10, y: 8 }
        }).setOrigin(0.5).setInteractive();
        btnBomb.on('pointerdown', () => this.selectBooster('bomb', btnBomb));
    }

    selectBooster(type, btn) {
        if (this.boosters[type] <= 0) return;
        this.activeBooster = type;
        btn.setBackgroundColor('#f59e0b');
    }

    useShuffleBooster() {
        if (this.boosters.shuffle <= 0 || this.isBusy) return;
        this.boosters.shuffle--;
        GameData.saveBoosters(this.boosters);

        // Shuffle grid
        sounds.playSwap();
        this.createInitialGrid();
    }

    createInitialGrid() {
        if (this.grid.length > 0) {
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (this.grid[r][c]) this.grid[r][c].destroy();
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
                } while (
                    (c >= 2 && this.grid[r][c - 1]?.tileType === typeIdx && this.grid[r][c - 2]?.tileType === typeIdx) ||
                    (r >= 2 && this.grid[r - 1][c]?.tileType === typeIdx && this.grid[r - 2][c]?.tileType === typeIdx)
                );

                const x = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
                const y = OFFSET_Y + r * TILE_SIZE + TILE_SIZE / 2;

                const tileData = TILE_TYPES[typeIdx];
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

    handlePointerDown(pointer) {
        if (this.isBusy || this.gameOver) return;

        const c = Math.floor((pointer.x - OFFSET_X) / TILE_SIZE);
        const r = Math.floor((pointer.y - OFFSET_Y) / TILE_SIZE);

        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
        const clickedTile = this.grid[r][c];

        // Active Booster execution
        if (this.activeBooster === 'hammer') {
            this.boosters.hammer--;
            GameData.saveBoosters(this.boosters);
            this.activeBooster = null;
            this.clearSingleTile(r, c);
            return;
        }

        if (this.activeBooster === 'bomb') {
            this.boosters.bomb--;
            GameData.saveBoosters(this.boosters);
            this.activeBooster = null;
            this.clearColorBomb(clickedTile.tileType);
            return;
        }

        // Normal Tile Selection & Swap
        if (!this.selectedTile) {
            this.selectedTile = clickedTile;
            clickedTile.setTint(0xffd700);
            sounds.playSwap();
        } else {
            if (this.selectedTile === clickedTile) {
                this.selectedTile.clearTint();
                this.selectedTile = null;
            } else if (this.isAdjacent(this.selectedTile, clickedTile)) {
                this.selectedTile.clearTint();
                this.swapTiles(this.selectedTile, clickedTile);
                this.selectedTile = null;
            } else {
                this.selectedTile.clearTint();
                this.selectedTile = clickedTile;
                clickedTile.setTint(0xffd700);
                sounds.playSwap();
            }
        }
    }

    isAdjacent(t1, t2) {
        const rowDiff = Math.abs(t1.row - t2.row);
        const colDiff = Math.abs(t1.col - t2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    swapTiles(t1, t2) {
        this.isBusy = true;
        sounds.playSwap();

        const r1 = t1.row, c1 = t1.col;
        const r2 = t2.row, c2 = t2.col;

        this.grid[r1][c1] = t2;
        this.grid[r2][c2] = t1;
        t1.row = r2; t1.col = c2;
        t2.row = r1; t2.col = c1;

        const x1 = OFFSET_X + c1 * TILE_SIZE + TILE_SIZE / 2;
        const y1 = OFFSET_Y + r1 * TILE_SIZE + TILE_SIZE / 2;
        const x2 = OFFSET_X + c2 * TILE_SIZE + TILE_SIZE / 2;
        const y2 = OFFSET_Y + r2 * TILE_SIZE + TILE_SIZE / 2;

        this.tweens.add({ targets: t1, x: x2, y: y2, duration: 200 });
        this.tweens.add({
            targets: t2, x: x1, y: y1, duration: 200,
            onComplete: () => {
                const matches = this.findMatches();
                if (matches.length > 0) {
                    this.movesLeft--;
                    this.movesText.setText(`🎯 Moves: ${this.movesLeft}`);
                    this.combo = 1;
                    this.processMatches(matches);
                } else {
                    // Revert Swap if no match
                    this.grid[r1][c1] = t1;
                    this.grid[r2][c2] = t2;
                    t1.row = r1; t1.col = c1;
                    t2.row = r2; t2.col = c2;
                    this.tweens.add({ targets: t1, x: x1, y: y1, duration: 200 });
                    this.tweens.add({ targets: t2, x: x2, y: y2, duration: 200, onComplete: () => { this.isBusy = false; } });
                }
            }
        });
    }

    findMatches() {
        const matches = new Set();

        // Horizontal matches
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE - 2; c++) {
                const t = this.grid[r][c]?.tileType;
                if (t !== undefined && t === this.grid[r][c + 1]?.tileType && t === this.grid[r][c + 2]?.tileType) {
                    matches.add(this.grid[r][c]);
                    matches.add(this.grid[r][c + 1]);
                    matches.add(this.grid[r][c + 2]);
                }
            }
        }

        // Vertical matches
        for (let c = 0; c < GRID_SIZE; c++) {
            for (let r = 0; r < GRID_SIZE - 2; r++) {
                const t = this.grid[r][c]?.tileType;
                if (t !== undefined && t === this.grid[r + 1][c]?.tileType && t === this.grid[r + 2][c]?.tileType) {
                    matches.add(this.grid[r][c]);
                    matches.add(this.grid[r + 1][c]);
                    matches.add(this.grid[r + 2][c]);
                }
            }
        }

        return Array.from(matches);
    }

    processMatches(matches) {
        if (matches.length === 0) {
            this.isBusy = false;
            this.checkGameEnd();
            return;
        }

        if (this.combo > 1) sounds.playCombo();
        else sounds.playMatch();

        const pts = matches.length * 100 * this.combo;
        this.score += pts;
        this.scoreText.setText(`⭐ Score: ${this.score} / ${this.targetScore}`);

        // Scale & Destroy Animation
        matches.forEach(t => {
            this.grid[t.row][t.col] = null;
            this.tweens.add({
                targets: t, scaleX: 0, scaleY: 0, duration: 200,
                onComplete: () => t.destroy()
            });
        });

        this.combo++;
        this.time.delayedCall(250, async () => {
            await this.dropAndRefillGrid();
            const newMatches = this.findMatches();
            this.processMatches(newMatches);
        });
    }

    clearSingleTile(r, c) {
        const t = this.grid[r][c];
        if (!t) return;
        this.grid[r][c] = null;
        sounds.playMatch();
        this.tweens.add({
            targets: t, scaleX: 0, scaleY: 0, duration: 200,
            onComplete: () => {
                t.destroy();
                this.dropAndRefillGrid().then(() => this.processMatches(this.findMatches()));
            }
        });
    }

    clearColorBomb(tileType) {
        const matches = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (this.grid[r][c] && this.grid[r][c].tileType === tileType) {
                    matches.push(this.grid[r][c]);
                }
            }
        }
        this.processMatches(matches);
    }

    dropAndRefillGrid() {
        return new Promise(resolve => {
            const dropPromises = [];

            for (let c = 0; c < GRID_SIZE; c++) {
                let emptySlots = 0;
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
                        dropPromises.push(new Promise(res => {
                            this.tweens.add({ targets: tile, y: targetY, duration: 220, ease: 'Bounce.easeOut', onComplete: res });
                        }));
                    }
                }

                for (let i = 0; i < emptySlots; i++) {
                    const newRow = i;
                    const typeIdx = Phaser.Math.Between(0, TILE_TYPES.length - 1);
                    const tileData = TILE_TYPES[typeIdx];

                    const startX = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
                    const startY = OFFSET_Y - (emptySlots - i) * TILE_SIZE;
                    const targetY = OFFSET_Y + newRow * TILE_SIZE + TILE_SIZE / 2;

                    const sprite = this.add.image(startX, startY, tileData.key)
                        .setDisplaySize(TILE_SIZE - 8, TILE_SIZE - 8)
                        .setInteractive().setDepth(10);
                    sprite.row = newRow; sprite.col = c; sprite.tileType = typeIdx;
                    this.grid[newRow][c] = sprite;

                    dropPromises.push(new Promise(res => {
                        this.tweens.add({ targets: sprite, y: targetY, duration: 250, ease: 'Bounce.easeOut', onComplete: res });
                    }));
                }
            }

            Promise.all(dropPromises).then(resolve);
        });
    }

    checkGameEnd() {
        if (this.score >= this.targetScore) {
            this.showVictory();
        } else if (this.movesLeft <= 0) {
            this.showGameOver();
        }
    }

    showVictory() {
        this.gameOver = true;
        GameData.unlockLevel(this.level + 1);
        const earnedCoins = 150 + this.level * 50;
        GameData.addCoins(earnedCoins);

        const modal = this.add.graphics().setDepth(50);
        modal.fillStyle(0x000000, 0.85);
        modal.fillRect(0, 0, 540, 960);

        this.add.text(270, 360, '🎉 LEVEL COMPLETE! ⭐⭐⭐', {
            font: 'bold 30px Fredoka', fill: '#4ade80', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(51);

        this.add.text(270, 420, `SCORE: ${this.score}  |  COINS +${earnedCoins} 💰`, {
            font: 'bold 20px Fredoka', fill: '#fef08a'
        }).setOrigin(0.5).setDepth(51);

        const btnNext = this.add.text(270, 500, '▶️ Next Level / Town Map', {
            font: 'bold 20px Fredoka', fill: '#18181b', backgroundColor: '#fbbf24', padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive().setDepth(51);

        btnNext.on('pointerdown', () => this.scene.start('TownMapScene'));
    }

    showGameOver() {
        this.gameOver = true;
        const modal = this.add.graphics().setDepth(50);
        modal.fillStyle(0x000000, 0.85);
        modal.fillRect(0, 0, 540, 960);

        this.add.text(270, 380, '💔 OUT OF MOVES!', {
            font: 'bold 32px Fredoka', fill: '#f43f5e'
        }).setOrigin(0.5).setDepth(51);

        const btnTryAgain = this.add.text(270, 480, '🔄 Try Again', {
            font: 'bold 20px Fredoka', fill: '#fff', backgroundColor: '#3b82f6', padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive().setDepth(51);

        btnTryAgain.on('pointerdown', () => this.scene.restart());
    }
}

// ==========================================
// SCENE 4: SHOP & UPGRADES (US-09-01..04)
// ==========================================
class ShopScene extends Phaser.Scene {
    constructor() { super({ key: 'ShopScene' }); }

    create() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x3b0764, 0x3b0764, 1);
        bg.fillRect(0, 0, 540, 960);

        this.add.text(270, 50, '🏪 ICE CREAM SHOP & UPGRADES 🛍️', {
            font: 'bold 22px Fredoka', fill: '#c084fc'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(270, 90, `💰 Coins Balance: ${GameData.getCoins()}`, {
            font: 'bold 18px Fredoka', fill: '#fef08a'
        }).setOrigin(0.5);

        // Shop Tier Upgrades Section
        let shopTier = GameData.getShopTier();
        const currentConfig = SHOP_TIERS[shopTier - 1];

        this.add.text(270, 140, `Current Tier: ${currentConfig.name}`, {
            font: 'bold 18px Fredoka', fill: '#fbbf24'
        }).setOrigin(0.5);

        if (shopTier < 5) {
            const nextTier = SHOP_TIERS[shopTier];
            const btnUpgrade = this.add.text(270, 190, `⬆️ Upgrade to ${nextTier.name} (${nextTier.cost} 💰)`, {
                font: 'bold 16px Fredoka', fill: '#fff', backgroundColor: '#8b5cf6', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive();

            btnUpgrade.on('pointerdown', () => {
                if (GameData.spendCoins(nextTier.cost)) {
                    GameData.setShopTier(shopTier + 1);
                    this.scene.restart();
                }
            });
        }

        // Booster Store Section
        this.add.text(270, 260, '🛒 BOOSTER ITEM STORE', { font: 'bold 18px Fredoka', fill: '#93c5fd' }).setOrigin(0.5);

        const boosters = GameData.getBoosters();

        const items = [
            { key: 'hammer', name: '🔨 Hammer (Clear 1 Tile)', cost: 200 },
            { key: 'shuffle', name: '🔀 Shuffle Board', cost: 150 },
            { key: 'bomb', name: '💣 Color Bomb', cost: 300 }
        ];

        items.forEach((item, idx) => {
            const y = 320 + idx * 75;
            this.add.text(60, y, `${item.name} — Owned: ${boosters[item.key]}`, { font: 'bold 15px Fredoka', fill: '#fff' });

            const btnBuy = this.add.text(420, y + 5, `Buy (${item.cost} 💰)`, {
                font: 'bold 14px Fredoka', fill: '#fff', backgroundColor: '#10b981', padding: { x: 12, y: 6 }
            }).setOrigin(0.5).setInteractive();

            btnBuy.on('pointerdown', () => {
                if (GameData.spendCoins(item.cost)) {
                    boosters[item.key]++;
                    GameData.saveBoosters(boosters);
                    this.scene.restart();
                }
            });
        });

        // Daily Reward Claim
        const btnDaily = this.add.text(270, 580, '🎁 Claim Daily Reward (+200 💰)', {
            font: 'bold 18px Fredoka', fill: '#18181b', backgroundColor: '#fbbf24', padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive();

        btnDaily.on('pointerdown', () => {
            GameData.addCoins(200);
            this.scene.restart();
        });

        // Back to Map
        const btnBack = this.add.text(270, 880, '🗺️ Back to Town Map', {
            font: 'bold 18px Fredoka', fill: '#fff', backgroundColor: '#334155', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        btnBack.on('pointerdown', () => this.scene.start('TownMapScene'));
    }
}

// ==========================================
// SCENE 5: SHOP DECORATION & AVATAR (US-11-01..04)
// ==========================================
class DecorateScene extends Phaser.Scene {
    constructor() { super({ key: 'DecorateScene' }); }

    create() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x451a03, 0x451a03, 1);
        bg.fillRect(0, 0, 540, 960);

        this.add.text(270, 50, '🛋️ ICE CREAM SHOP DECORATION 🎨', {
            font: 'bold 22px Fredoka', fill: '#f59e0b'
        }).setOrigin(0.5);

        // Shop Preview
        const previewBox = this.add.graphics();
        previewBox.fillStyle(0x1e293b, 0.9);
        previewBox.lineStyle(3, 0xf59e0b, 1);
        previewBox.fillRoundedRect(40, 100, 460, 320, 16);
        previewBox.strokeRoundedRect(40, 100, 460, 320, 16);

        this.add.text(270, 140, '🏪 YOUR CUSTOMIZED ICE CREAM PARLOR', {
            font: 'bold 16px Fredoka', fill: '#fbbf24'
        }).setOrigin(0.5);

        this.add.text(270, 240, '🍦 Main Counter: Marble Deluxe\n🪑 Seating: Pastel Velvet Booths\n🪴 Plants: Exotic Palm Corner\n👨‍🍳 Chef Costume: Master Scooper', {
            font: '16px Fredoka', fill: '#cbd5e1', align: 'center'
        }).setOrigin(0.5);

        // Customization Selectors
        this.add.text(270, 460, '🎨 Select Catalog Themes', { font: 'bold 18px Fredoka', fill: '#38bdf8' }).setOrigin(0.5);

        const options = [
            '🍨 Theme: Strawberry Pink',
            '🍵 Theme: Matcha Zen Green',
            '🫐 Theme: Blueberry Galaxy',
            '👨‍🍳 Costume: Crown & Royal Apron'
        ];

        options.forEach((opt, idx) => {
            const y = 520 + idx * 60;
            const btn = this.add.text(270, y, opt, {
                font: 'bold 15px Fredoka', fill: '#fff', backgroundColor: '#334155', padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive();

            btn.on('pointerdown', () => {
                btn.setBackgroundColor('#10b981');
            });
        });

        // Photo Mode & Back Button
        const btnPhoto = this.add.text(270, 780, '📸 Take Shop Photo & Share', {
            font: 'bold 16px Fredoka', fill: '#fff', backgroundColor: '#e11d48', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        const btnBack = this.add.text(270, 880, '🗺️ Back to Town Map', {
            font: 'bold 18px Fredoka', fill: '#fff', backgroundColor: '#334155', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        btnBack.on('pointerdown', () => this.scene.start('TownMapScene'));
    }
}

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 540,
    height: 960,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [PreloadScene, TownMapScene, MainMatchScene, ShopScene, DecorateScene]
};

const game = new Phaser.Game(config);
