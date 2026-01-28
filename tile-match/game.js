const EMOJIS = ['🍎', '🍌', '🍉', '🍊', '🥝', '🫐', '🍇', '🍐', '🍓', '🍒', '🥑', '🥥'];
const TRAY_SIZE = 7;

function getTileDimensions() {
    const root = getComputedStyle(document.documentElement);
    const width = parseInt(root.getPropertyValue('--tile-width')) || 60;
    const height = parseInt(root.getPropertyValue('--tile-height')) || 70;
    return { width, height };
}

class TileGame {
    constructor() {
        this.container = document.getElementById('tileContainer');
        this.trayContainer = document.getElementById('trayTiles');
        this.levelLabel = document.getElementById('levelLabel');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.tray = [];
        this.tiles = [];
        this.history = [];
        this.level = 1;
        this.score = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.isAnimating = false;
        this.timerStarted = false;

        this.init();
        this.attachEvents();
    }

    init() {
        this.tray = [];
        this.tiles = [];
        this.history = [];
        this.container.innerHTML = '';
        this.trayContainer.innerHTML = '';
        this.levelLabel.textContent = this.level;

        // Timer/Score Reset
        if (this.level === 1) {
            this.score = 0;
            this.updateScore(0);
        }
        this.resetTimer();
        this.timerStarted = false;

        this.generateLevel(this.level);
        this.updateLockStatus();
    }

    attachEvents() {
        document.getElementById('restartBtn').onclick = () => {
            this.hideOverlay('gameOverOverlay');
            this.init();
        };
        document.getElementById('nextLevelBtn').onclick = () => {
            this.hideOverlay('victoryOverlay');
            this.level++;
            this.init();
        };
        document.getElementById('undoBtn').onclick = () => this.undo();
        document.getElementById('backBtn').onclick = () => {
            // Go back to portfolio
            window.parent.postMessage('backToMenu', '*');
            if (window === window.top) {
                window.location.href = '../index.html';
            }
        };
    }

    generateLevel(level) {
        const layouts = {
            1: this.createGridLayout(4, 4, 3), // 16 tiles -> need multiple of 3. Let's make it 24.
            2: this.createStackLayout(),
            3: this.createMahjongLayout() // Like the screenshot
        };

        const layout = layouts[level] || this.createMahjongLayout();

        // Ensure tiles count is multiple of 3
        let tileCount = layout.length;
        const remainder = tileCount % 3;
        const finalLayout = layout.slice(0, tileCount - remainder);

        // Assign random emojis in triplets
        const typesNeeded = finalLayout.length / 3;
        let emojiPool = [];
        for (let i = 0; i < typesNeeded; i++) {
            const emoji = EMOJIS[i % EMOJIS.length];
            emojiPool.push(emoji, emoji, emoji);
        }
        this.shuffle(emojiPool);

        finalLayout.forEach((pos, index) => {
            const tile = this.createTile(pos.x, pos.y, pos.z, emojiPool[index], index);
            this.tiles.push(tile);
            this.container.appendChild(tile.el);
        });
    }

    createGridLayout(cols, rows, layers) {
        const { width: TILE_WIDTH, height: TILE_HEIGHT } = getTileDimensions();
        const layout = [];
        const startX = (this.container.clientWidth - cols * TILE_WIDTH) / 2;
        const startY = 40;

        for (let z = 0; z < layers; z++) {
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    layout.push({
                        x: startX + c * TILE_WIDTH + (z * 4), // Shift slightly for stack effect
                        y: startY + r * TILE_HEIGHT + (z * 4),
                        z: z
                    });
                }
            }
        }
        return layout;
    }

    createStackLayout() {
        const { width: TILE_WIDTH, height: TILE_HEIGHT } = getTileDimensions();
        const layout = [];
        const width = this.container.clientWidth || 360;
        const centerX = width / 2 - TILE_WIDTH / 2;
        const centerY = 100;

        // Pyramidal stack with slight offsets
        for (let z = 0; z < 4; z++) {
            const size = 5 - z;
            const startX = centerX - (size - 1) * TILE_WIDTH / 2;
            const startY = centerY + z * 10;
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    layout.push({
                        x: startX + c * TILE_WIDTH,
                        y: startY + r * TILE_HEIGHT,
                        z: z
                    });
                }
            }
        }
        return layout;
    }

    createMahjongLayout() {
        const { width: TILE_WIDTH, height: TILE_HEIGHT } = getTileDimensions();
        const layout = [];
        const width = this.container.clientWidth || 360;
        const height = this.container.clientHeight || 500;

        // Middle large cross
        for (let z = 0; z < 3; z++) {
            const size = 6 - z;
            const startX = (width - size * TILE_WIDTH) / 2;
            const startY = 50 + z * 5;

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    // Skip some to create shapes
                    if ((r + c) % 2 === 0) {
                        layout.push({
                            x: startX + c * TILE_WIDTH,
                            y: startY + r * TILE_HEIGHT,
                            z: z
                        });
                    }
                }
            }
        }

        // 4 corners stacks
        const cornerSize = 2;
        const offsets = [
            { x: 10, y: 10 },
            { x: width - TILE_WIDTH * 2 - 10, y: 10 },
            { x: 10, y: height - TILE_HEIGHT * 2 - 150 },
            { x: width - TILE_WIDTH * 2 - 10, y: height - TILE_HEIGHT * 2 - 150 }
        ];

        offsets.forEach(offset => {
            for (let z = 0; z < 5; z++) {
                for (let r = 0; r < cornerSize; r++) {
                    for (let c = 0; c < cornerSize; c++) {
                        layout.push({
                            x: offset.x + c * (TILE_WIDTH / 2) + (z * 2),
                            y: offset.y + r * (TILE_HEIGHT / 2) + (z * 2),
                            z: z + 5
                        });
                    }
                }
            }
        });

        return layout;
    }

    createTile(x, y, z, emoji, id) {
        const el = document.createElement('div');
        el.className = 'tile';
        el.innerHTML = emoji;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.zIndex = z;

        const tile = {
            id,
            x,
            y,
            z,
            emoji,
            el,
            status: 'board' // board, tray, cleared
        };

        el.onclick = () => this.handleTileClick(tile);

        return tile;
    }

    handleTileClick(tile) {
        if (this.isAnimating || tile.status !== 'board' || this.isLocked(tile)) return;

        // Start timer on first click
        if (!this.timerStarted) {
            this.startTimer();
        }

        tile.status = 'moving';
        this.history.push(tile);
        this.animateToTray(tile);
    }

    isLocked(tile) {
        // A tile is locked if any tile with higher Z overlaps it
        return this.tiles.some(other => {
            if (other.status === 'board' && other.z > tile.z) {
                return this.isOverlapping(tile, other);
            }
            return false;
        });
    }

    isOverlapping(a, b) {
        const { width: TILE_WIDTH, height: TILE_HEIGHT } = getTileDimensions();
        const margin = 5; // Allow minor overlap
        return !(a.x + TILE_WIDTH - margin <= b.x ||
            a.x + margin >= b.x + TILE_WIDTH ||
            a.y + TILE_HEIGHT - margin <= b.y ||
            a.y + margin >= b.y + TILE_HEIGHT);
    }

    updateLockStatus() {
        this.tiles.forEach(tile => {
            if (tile.status === 'board') {
                if (this.isLocked(tile)) {
                    tile.el.classList.add('locked');
                } else {
                    tile.el.classList.remove('locked');
                }
            }
        });
    }

    animateToTray(tile) {
        this.isAnimating = true;

        // Calculate insertion index to keep tray sorted
        let insertionIndex = 0;
        for (let i = 0; i < this.tray.length; i++) {
            if (tile.emoji.localeCompare(this.tray[i].emoji) >= 0) {
                insertionIndex = i + 1;
            } else {
                break;
            }
        }

        const rect = tile.el.getBoundingClientRect();
        const traySlots = document.querySelectorAll('.slot');

        // Find position for target in tray
        const targetSlot = traySlots[insertionIndex];
        const targetRect = targetSlot.getBoundingClientRect();

        // Calculate delta
        const dx = targetRect.left - rect.left;
        const dy = targetRect.top - rect.top;

        tile.el.classList.add('moving');
        tile.el.style.transform = `translate(${dx}px, ${dy}px)`;

        setTimeout(() => {
            tile.status = 'tray';
            tile.el.classList.remove('moving');
            tile.el.style.transform = '';

            // Logic for tray insertion at correct index
            this.tray.splice(insertionIndex, 0, tile);
            this.renderTray();
            this.updateLockStatus();
            this.checkMatches();
            this.checkGameState();
            this.isAnimating = false;
        }, 300);
    }

    renderTray() {
        this.trayContainer.innerHTML = '';
        this.tray.forEach(tile => {
            const trayEl = document.createElement('div');
            trayEl.className = 'tray-tile';
            trayEl.innerHTML = tile.emoji;
            this.trayContainer.appendChild(trayEl);
            // Hide original element
            tile.el.style.display = 'none';
        });
    }

    checkMatches() {
        // Find triplets
        const counts = {};
        this.tray.forEach(t => counts[t.emoji] = (counts[t.emoji] || 0) + 1);

        for (const emoji in counts) {
            if (counts[emoji] >= 3) {
                this.handleMatch(emoji);
                break;
            }
        }
    }

    handleMatch(emoji) {
        this.isAnimating = true;

        // Find the elements in the tray container to animate
        const trayTiles = Array.from(this.trayContainer.children);
        const matchIndices = [];
        this.tray.forEach((t, i) => {
            if (t.emoji === emoji) matchIndices.push(i);
        });

        // Take only 3
        const toRemoveIndices = matchIndices.slice(0, 3);

        toRemoveIndices.forEach(idx => {
            trayTiles[idx].classList.add('combo-out');
        });

        setTimeout(() => {
            const matchedTiles = this.tray.filter((t, i) => toRemoveIndices.includes(i));
            // Remove from data
            this.tray = this.tray.filter((t, i) => !toRemoveIndices.includes(i));
            // Also remove from history since they are cleared
            this.history = this.history.filter(t => !matchedTiles.includes(t));

            this.renderTray();
            this.isAnimating = false;

            // Score update +10
            this.updateScore(10);

            this.checkWin();
        }, 400);
    }

    checkGameState() {
        if (this.tray.length >= TRAY_SIZE) {
            this.stopTimer();
            this.showOverlay('gameOverOverlay');
        }
    }

    checkWin() {
        const boardTiles = this.tiles.filter(t => t.status === 'board').length;
        if (boardTiles === 0 && this.tray.length === 0) {
            this.stopTimer();
            this.showOverlay('victoryOverlay');
        }
    }

    updateScore(points) {
        this.score += points;
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = this.score;
        }
    }

    startTimer() {
        this.timerStarted = true;
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);
    }

    resetTimer() {
        this.stopTimer();
        if (this.timerDisplay) {
            this.timerDisplay.textContent = "00:00";
        }
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        if (!this.startTime || !this.timerDisplay) return;
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.timerDisplay.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    showOverlay(id) {
        document.getElementById(id).classList.add('active');
    }

    hideOverlay(id) {
        document.getElementById(id).classList.remove('active');
    }

    undo() {
        if (this.isAnimating || this.history.length === 0) return;

        const lastTile = this.history.pop();

        // Remove from tray
        this.tray = this.tray.filter(t => t.id !== lastTile.id);

        // Reset tile properties
        lastTile.status = 'board';
        lastTile.el.style.display = 'flex';
        lastTile.el.style.transform = '';
        lastTile.el.classList.remove('moving');

        // Re-render and update
        this.renderTray();
        this.updateLockStatus();
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

window.onload = () => {
    new TileGame();
};
