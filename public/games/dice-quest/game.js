/**
 * Dice Quest — Monopoly Board Game (G010)
 * Powered by Vanilla JS + CSS Grid + Kenney Boardgame Pack Assets
 */

// ═══════════════════════════════════════════════
// CONFIG & CONSTANTS
// ═══════════════════════════════════════════════

const TILE_COUNT = 28;
const START_MONEY = 1500;
const PASS_GO_MONEY = 200;
const WIN_AMOUNT = 20000;
const PASS_TURN_LIMIT = 500;

// ═══════════════════════════════════════════════
// TILE CONFIG (28 tiles — Monopoly-style ring)
// ═══════════════════════════════════════════════

const TILE_TYPES = {
    CORNER: 'corner',
    PROPERTY: 'property',
    CHANCE: 'chance',
    TAX: 'tax',
    JAIL: 'jail',
    FREEPARKING: 'freeparking',
};

const TILE_CONFIG = [
    { type: TILE_TYPES.CORNER, label: 'GO', sub: '+$200', price: 0, rent: 0, group: null, icon: '🏠' },
    { type: TILE_TYPES.PROPERTY, label: 'Garden City', sub: '$60', price: 60, rent: 10, group: 'Garden', icon: '🏡' },
    { type: TILE_TYPES.CHANCE, label: 'CHANCE', sub: '', price: 0, rent: 0, group: null, icon: '❓' },
    { type: TILE_TYPES.PROPERTY, label: 'Forest Road', sub: '$80', price: 80, rent: 12, group: 'Garden', icon: '🏡' },
    { type: TILE_TYPES.TAX, label: 'Income Tax', sub: '$100', price: 100, rent: 0, group: null, icon: '💰' },
    { type: TILE_TYPES.PROPERTY, label: 'Seaside Place', sub: '$100', price: 100, rent: 15, group: 'Seaside', icon: '🏡' },
    { type: TILE_TYPES.CORNER, label: 'VISIT', sub: 'JAIL', price: 0, rent: 0, group: null, icon: '⛓️' },
    { type: TILE_TYPES.PROPERTY, label: 'Mountain Lane', sub: '$120', price: 120, rent: 18, group: 'Mountain', icon: '🏡' },
    { type: TILE_TYPES.PROPERTY, label: 'Ocean Breeze', sub: '$140', price: 140, rent: 20, group: 'Seaside', icon: '🏡' },
    { type: TILE_TYPES.CHANCE, label: 'CHANCE', sub: '', price: 0, rent: 0, group: null, icon: '❓' },
    { type: TILE_TYPES.PROPERTY, label: 'Valley Farm', sub: '$160', price: 160, rent: 22, group: 'Mountain', icon: '🏡' },
    { type: TILE_TYPES.CORNER, label: 'GO TO\nJAIL', sub: '', price: 0, rent: 0, group: null, icon: '🚔' },
    { type: TILE_TYPES.PROPERTY, label: 'Sunset Ave', sub: '$180', price: 180, rent: 25, group: 'Sunset', icon: '🏡' },
    { type: TILE_TYPES.PROPERTY, label: 'Lake Drive', sub: '$200', price: 200, rent: 28, group: 'Lake', icon: '🏡' },
    { type: TILE_TYPES.CHANCE, label: 'CHANCE', sub: '', price: 0, rent: 0, group: null, icon: '❓' },
    { type: TILE_TYPES.PROPERTY, label: 'Hill Manor', sub: '$220', price: 220, rent: 30, group: 'Lake', icon: '🏡' },
    { type: TILE_TYPES.PROPERTY, label: 'Creek Court', sub: '$240', price: 240, rent: 35, group: 'Sunset', icon: '🏡' },
    { type: TILE_TYPES.FREEPARKING, label: 'FREE', sub: 'PARKING', price: 0, rent: 0, group: null, icon: '🅿️' },
    { type: TILE_TYPES.PROPERTY, label: 'River Walk', sub: '$260', price: 260, rent: 38, group: 'River', icon: '🏡' },
    { type: TILE_TYPES.TAX, label: 'Luxury Tax', sub: '$150', price: 150, rent: 0, group: null, icon: '💎' },
    { type: TILE_TYPES.PROPERTY, label: 'Haven Point', sub: '$280', price: 280, rent: 42, group: 'River', icon: '🏡' },
    { type: TILE_TYPES.CHANCE, label: 'CHANCE', sub: '', price: 0, rent: 0, group: null, icon: '❓' },
    { type: TILE_TYPES.PROPERTY, label: 'Palace Terrace', sub: '$300', price: 300, rent: 45, group: 'River', icon: '🏡' },
    { type: TILE_TYPES.PROPERTY, label: 'Estate Grounds', sub: '$320', price: 320, rent: 50, group: 'River', icon: '🏡' },
    { type: TILE_TYPES.CORNER, label: 'JAIL\nVISIT', sub: '', price: 0, rent: 0, group: null, icon: '🚔' },
    { type: TILE_TYPES.PROPERTY, label: 'Grand Plaza', sub: '$350', price: 350, rent: 55, group: 'Plaza', icon: '🏛️' },
    { type: TILE_TYPES.PROPERTY, label: 'Royal Court', sub: '$400', price: 400, rent: 60, group: 'Plaza', icon: '👑' },
    { type: TILE_TYPES.PROPERTY, label: 'Sky Tower', sub: '$350', price: 350, rent: 55, group: 'Plaza', icon: '🏰' },
];

// ═══════════════════════════════════════════════
// AUDIO MANAGER
// ═══════════════════════════════════════════════

class AudioManager {
    constructor() {
        this.ctx = null;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio not available');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(type) {
        this.resume();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            if (type === 'roll') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.linearRampToValueAtTime(600, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'buy') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.1);
                osc.frequency.setValueAtTime(784, now + 0.2);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'bad') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.3);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'win') {
                [523, 659, 784, 1047, 1319].forEach((f, i) => {
                    const o2 = this.ctx.createOscillator();
                    const g2 = this.ctx.createGain();
                    o2.type = 'sine';
                    o2.connect(g2);
                    g2.connect(this.ctx.destination);
                    o2.frequency.setValueAtTime(f, now + i * 0.12);
                    g2.gain.setValueAtTime(0.12, now + i * 0.12);
                    g2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
                    o2.start(now + i * 0.12);
                    o2.stop(now + i * 0.12 + 0.35);
                });
            }
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }
}

const audioManager = new AudioManager();

// ═══════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════

const PLAYER_NAMES = ['🟢 Player', '🔵 AI-1', '🟡 AI-2', '🔴 AI-3'];
const PLAYER_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444'];
const PLAYER_ICONS = ['🟢', '🔵', '🟡', '🔴'];

const state = {
    currentPlayer: 0,
    players: [],
    gameOver: false,
    rolled: false,
    rolls: 0,
    maxRolls: PASS_TURN_LIMIT,
    phase: 'waiting', // waiting, rolling, moving, result
};

function initPlayers() {
    for (let i = 0; i < 4; i++) {
        state.players.push({
            id: i,
            name: PLAYER_NAMES[i],
            color: PLAYER_COLORS[i],
            position: 0,
            money: START_MONEY,
            jailed: false,
            jailTurns: 0,
            properties: [],
            multiplier: 1,
            multiplierUntil: -1,
        });
    }
}

// ═══════════════════════════════════════════════
// CHANCE CARDS
// ═══════════════════════════════════════════════

const CHANCE_CARDS = [
    { text: '🎉 Found money! Go forward 3 spaces.', action: (p) => { p.position = (p.position + 3) % TILE_COUNT; } },
    { text: '💸 Bank error. Pay $50.', action: (p) => { p.money -= 50; } },
    { text: '🏦 Get $100 back.', action: (p) => { p.money += 100; } },
    { text: '🎮 Go to Jail.', action: (p) => { p.position = 10; p.jailed = true; p.jailTurns = 0; } },
    { text: '🏥 Hospital bill. Pay $150.', action: (p) => { p.money -= 150; } },
    { text: '🎓 Scholarship! Get $200.', action: (p) => { p.money += 200; } },
    { text: '🚗 Speeding fine. Pay $80.', action: (p) => { p.money -= 80; } },
    { text: '🏆 Lottery win! Get $300.', action: (p) => { p.money += 300; } },
];

// ═══════════════════════════════════════════════
// BOARD RENDERING (CSS Grid)
// ═══════════════════════════════════════════════

function renderBoard() {
    const board = document.getElementById('board');
    // Remove existing tile elements only to preserve #board-center
    const existingTiles = board.querySelectorAll('.tile');
    existingTiles.forEach(el => el.remove());

    const boardSize = board.clientWidth || 500;
    const centerX = boardSize / 2;
    const centerY = boardSize / 2;
    const radius = boardSize * 0.36;
    const tileSize = boardSize < 400 ? 21 : 28;

    for (let i = 0; i < TILE_COUNT; i++) {
        const angle = (i / TILE_COUNT) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle) - tileSize;
        const y = centerY + radius * Math.sin(angle) - tileSize;
        const tile = TILE_CONFIG[i];

        const tileEl = document.createElement('div');
        tileEl.className = 'tile';
        tileEl.style.left = x + 'px';
        tileEl.style.top = y + 'px';

        // Color by type
        const typeColors = {
            [TILE_TYPES.CORNER]: '#374151',
            [TILE_TYPES.PROPERTY]: '#1e3a2f',
            [TILE_TYPES.CHANCE]: '#4a1d6a',
            [TILE_TYPES.TAX]: '#6a4a1d',
            [TILE_TYPES.FREEPARKING]: '#2a2a3a',
        };
        tileEl.style.backgroundColor = typeColors[tile.type] || '#1e293b';

        tileEl.innerHTML = `
            <div class="tile-icon">${tile.icon}</div>
            <div class="tile-label">${tile.label}</div>
            ${tile.type === TILE_TYPES.PROPERTY ? `<div class="tile-price">$${tile.price}</div>` : ''}
        `;
        board.appendChild(tileEl);
    }
}

// ═══════════════════════════════════════════════
// PAWN RENDERING
// ═══════════════════════════════════════════════

const pawnEls = [];

function renderPawns() {
    const board = document.getElementById('board');
    pawnEls.forEach(el => el.remove());
    pawnEls.length = 0;

    const boardSize = board.clientWidth || 500;
    const centerX = boardSize / 2;
    const centerY = boardSize / 2;
    const radius = boardSize * 0.36;
    const pawnSize = boardSize < 400 ? 9 : 12;

    state.players.forEach((p, idx) => {
        if (p.money <= 0) return;

        const angle = (p.position / TILE_COUNT) * 2 * Math.PI - Math.PI / 2;
        const offsetX = (idx - 1.5) * (boardSize < 400 ? 6 : 8);
        const x = centerX + radius * Math.cos(angle) + offsetX - pawnSize;
        const y = centerY + radius * Math.sin(angle) - pawnSize;

        const pawnEl = document.createElement('div');
        pawnEl.className = 'pawn';
        pawnEl.style.left = x + 'px';
        pawnEl.style.top = y + 'px';
        pawnEl.style.backgroundColor = p.color;
        pawnEl.textContent = PLAYER_ICONS[idx];
        pawnEl.dataset.playerId = idx;
        board.appendChild(pawnEl);
        pawnEls.push(pawnEl);
    });

    // Highlight current player's pawn
    const currentPawn = pawnEls[state.currentPlayer];
    if (currentPawn) {
        currentPawn.classList.add('active');
        const board = document.getElementById('board');
        board.style.border = `2px solid ${PLAYER_COLORS[state.currentPlayer]}`;
    }
}

// ═══════════════════════════════════════════════
// HUD RENDERING
// ═══════════════════════════════════════════════

function renderHUD() {
    const row = document.getElementById('players-row');
    row.innerHTML = '';

    state.players.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'player-card' + (i === state.currentPlayer ? ' active' : '');
        div.style.borderColor = p.color;
        div.innerHTML = `
            <div class="player-name">${p.name}</div>
            <div class="player-money">$${p.money}</div>
            <div class="player-properties">${p.properties.length} prop</div>
            ${p.jailed ? '<div class="jail-badge">⛓️ Jail</div>' : ''}
        `;
        row.appendChild(div);
    });
}

// ═══════════════════════════════════════════════
// DICE RENDERING
// ═══════════════════════════════════════════════

function renderDice(value1, value2) {
    const dice = document.getElementById('dice');
    dice.classList.remove('hidden');

    const die1 = document.getElementById('die1');
    const die2 = document.getElementById('die2');

    die1.src = `/assets/kenney_boardgame-pack/PNG/Dice/dieRed${value1}.png`;
    die2.src = `/assets/kenney_boardgame-pack/PNG/Dice/dieRed${value2}.png`;

    dice.classList.add('active');
}

function hideDice() {
    const dice = document.getElementById('dice');
    dice.classList.remove('active');
    dice.classList.add('hidden');
}

// ═══════════════════════════════════════════════
// STATUS & LOG
// ═══════════════════════════════════════════════

function setStatus(text, type) {
    const status = document.getElementById('status');
    status.textContent = text;
    status.className = 'status ' + (type || '');
}

function addLog(text) {
    const log = document.getElementById('log');
    const line = document.createElement('div');
    line.textContent = text;
    log.insertBefore(line, log.firstChild);
    if (log.children.length > 8) {
        log.removeChild(log.lastChild);
    }
}

// ═══════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════

function showModal(title, body, actions) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = body;

    const actionsEl = document.getElementById('modal-actions');
    actionsEl.innerHTML = '';

    if (actions && actions.length > 0) {
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-' + (action.type || 'default');
            btn.textContent = action.text;
            btn.addEventListener('click', () => {
                modal.classList.add('hidden');
                if (action.callback) action.callback();
            });
            actionsEl.appendChild(btn);
        });
    }

    modal.classList.remove('hidden');
}

function hideModal() {
    document.getElementById('modal').classList.add('hidden');
}

// ═══════════════════════════════════════════════
// GAME LOGIC
// ═══════════════════════════════════════════════

function rollDice() {
    if (state.phase !== 'waiting') return;
    state.phase = 'rolling';
    state.rolled = false;

    audioManager.play('roll');

    // Animate dice rolling
    const dice = document.getElementById('dice');
    dice.classList.add('rolling');

    let rollInterval = setInterval(() => {
        renderDice(Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1);
    }, 80);

    setTimeout(() => {
        clearInterval(rollInterval);
        dice.classList.remove('rolling');

        const v1 = Math.floor(Math.random() * 6) + 1;
        const v2 = Math.floor(Math.random() * 6) + 1;
        renderDice(v1, v2);

        state.rolls = v1 + v2;
        state.rolled = true;
        state.phase = 'moving';

        processTurn(v1 + v2, v1, v2);
    }, 800);
}

function processTurn(totalRoll, v1, v2) {
    const player = state.players[state.currentPlayer];
    addLog(`${player.name} rolled ${v1} + ${v2} = ${totalRoll}`);

    // Check for doubles
    if (v1 === v2) {
        addLog('🎯 Doubles! Roll again!');
        // Bonus: move extra
    }

    // Check for doubles — three doubles in a row = jail
    if (totalRoll === 3 && v1 === v2) {
        // Already in jail
    }

    // Handle jailed player
    if (player.jailed) {
        handleJailedTurn(player, totalRoll);
        return;
    }

    // Move player
    const newPos = (player.position + totalRoll) % TILE_COUNT;
    if (newPos < player.position) {
        // Passed GO
        player.money += PASS_GO_MONEY;
        addLog('🏠 Passed GO! +$200');
        audioManager.play('buy');
    }

    player.position = newPos;
    const tile = TILE_CONFIG[newPos];
    addLog(`→ Landed on: ${tile.label}`);

    // Animate pawn movement (CSS transition)
    setTimeout(() => {
        renderPawns();
        processTileEffect(player, tile, totalRoll);
    }, 300);
}

function handleJailedTurn(player, totalRoll) {
    player.jailTurns++;
    if (player.jailTurns >= 3) {
        player.jailed = false;
        player.jailTurns = 0;
        addLog('⛓️ Served jail time. Free!');
        const newPos = (player.position + totalRoll) % TILE_COUNT;
        if (newPos < player.position) {
            player.money += PASS_GO_MONEY;
            addLog('🏠 Passed GO! +$200');
        }
        player.position = newPos;
        setTimeout(() => {
            renderPawns();
            processTileEffect(player, TILE_CONFIG[newPos], totalRoll);
        }, 300);
    } else {
        addLog(`⛓️ Still in jail. Turn ${player.jailTurns}/3`);
        endTurn();
    }
}

function processTileEffect(player, tile, roll) {
    switch (tile.type) {
        case TILE_TYPES.CORNER:
            if (player.position === 12) {
                // Go to Jail
                addLog('🚔 Go to Jail!');
                player.position = 10;
                player.jailed = true;
                player.jailTurns = 0;
                setTimeout(() => {
                    renderPawns();
                    endTurn();
                }, 500);
            } else if (player.position === 20) {
                // Free Parking - collect money from taxes
                const totalTax = state.players.reduce((sum, p) => {
                    if (p !== player) {
                        const taxPaid = p.properties.reduce((s, idx) => sum + TILE_CONFIG[idx].price * 0.1, 0);
                        return sum + Math.floor(taxPaid);
                    }
                    return sum;
                }, 0);
                if (totalTax > 0) {
                    player.money += totalTax;
                    addLog(`🅿️ Free Parking! +$${totalTax}`);
                    audioManager.play('win');
                } else {
                    addLog('🅿️ Free Parking. Nothing to collect.');
                }
                setTimeout(() => endTurn(), 1000);
            }
            break;

        case TILE_TYPES.PROPERTY:
            if (tile.price > 0) {
                // Check if owned
                const ownerId = tile.owner;
                if (ownerId !== undefined && ownerId !== null && ownerId !== -1) {
                    // Pay rent
                    const owner = state.players[ownerId];
                    if (owner && owner !== player) {
                        const rent = tile.rent * (owner.multiplier || 1);
                        player.money -= rent;
                        owner.money += rent;
                        addLog(`💸 ${player.name} paid rent $${rent} to ${owner.name}`);
                        audioManager.play('bad');
                    }
                } else {
                    // Can buy
                    if (player.money >= tile.price) {
                        player.money -= tile.price;
                        tile.owner = state.currentPlayer;
                        player.properties.push(player.position);
                        addLog(`✅ ${player.name} bought ${tile.label} for $${tile.price}`);
                        audioManager.play('buy');
                    } else {
                        addLog(`❌ ${player.name} can't afford ${tile.label} ($${tile.price})`);
                    }
                }
            }
            setTimeout(() => endTurn(), 1000);
            break;

        case TILE_TYPES.CHANCE:
            const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
            addLog(card.text);
            card.action(player);
            audioManager.play('bad');
            checkBankruptcy(player);
            setTimeout(() => endTurn(), 1000);
            break;

        case TILE_TYPES.TAX:
            player.money -= tile.price;
            addLog(`💰 Paid tax $${tile.price}`);
            audioManager.play('bad');
            checkBankruptcy(player);
            setTimeout(() => endTurn(), 1000);
            break;
    }
}

function checkBankruptcy(player) {
    if (player.money < 0) {
        addLog(`❌ ${player.name} is bankrupt!`);
        player.money = 0;
        // Remove properties
        const board = document.getElementById('board');
        const tiles = board.querySelectorAll('.tile');
        player.properties.forEach(idx => {
            if (TILE_CONFIG[idx]) {
                TILE_CONFIG[idx].owner = undefined;
            }
            if (tiles[idx]) {
                tiles[idx].classList.remove('owned');
            }
        });
        player.properties = [];

        // Check win condition
        const alivePlayers = state.players.filter(p => p.money > 0);
        if (alivePlayers.length === 1) {
            setTimeout(() => {
                showModal('🏆 Game Over!', `${alivePlayers[0].name} WINS!\nFinal money: $${alivePlayers[0].money}`, [
                    { text: '🔄 Play Again', type: 'primary', callback: resetGame }
                ]);
            }, 500);
        }
    }
}

function endTurn() {
    // Next player
    state.currentPlayer = (state.currentPlayer + 1) % 4;
    state.phase = 'waiting';

    renderHUD();
    renderPawns();
    renderBoard();

    // Check if game is over
    const alivePlayers = state.players.filter(p => p.money > 0);
    if (alivePlayers.length === 1) {
        const winner = alivePlayers[0];
        showModal('🏆 Game Over!', `🏆 ${winner.name} WINS!\nFinal money: $${winner.money}`, [
            { text: '🔄 Play Again', type: 'primary', callback: resetGame }
        ]);
        return;
    }

    // Check pass turn limit
    if (state.rolls >= state.maxRolls) {
        addLog('🎯 500 rolls complete. Game over!');
        showModal('🎯 Game Over!', '500 rolls reached. No winner!', [
            { text: '🔄 Play Again', type: 'primary', callback: resetGame }
        ]);
        return;
    }

    // Check current player status
    const p = state.players[state.currentPlayer];
    if (p.money <= 0) {
        // Skip bankrupt player
        endTurn();
        return;
    }

    const btnRoll = document.getElementById('btn-roll');
    if (state.currentPlayer === 0) {
        setStatus('ถึงตาคุณแล้ว! กดปุ่มทอยลูกเต๋า');
        if (btnRoll) {
            btnRoll.disabled = false;
            btnRoll.innerHTML = '🎲 ทอยลูกเต๋า';
        }
    } else {
        setStatus(`ถึงตาของ ${p.name}...`);
        if (btnRoll) {
            btnRoll.disabled = true;
            btnRoll.innerHTML = `⏳ ${p.name}...`;
        }
        setTimeout(() => {
            if (state.phase === 'waiting' && state.currentPlayer !== 0) {
                rollDice();
            }
        }, 900);
    }
}

function resetGame() {
    hideModal();
    state.currentPlayer = 0;
    state.gameOver = false;
    state.rolls = 0;
    state.phase = 'waiting';

    // Reset tile owners
    TILE_CONFIG.forEach(tile => { tile.owner = undefined; });

    // Reset players
    state.players.forEach(p => {
        p.position = 0;
        p.money = START_MONEY;
        p.jailed = false;
        p.jailTurns = 0;
        p.properties = [];
    });

    addLog('Game reset!');
    renderBoard();
    renderHUD();
    renderPawns();
}

// ═══════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════

function init() {
    initPlayers();
    renderBoard();
    renderHUD();
    renderPawns();
    setStatus('กดปุ่มทอยลูกเต๋าเพื่อเริ่มเกม', 'normal');

    // Button handler
    const btnRoll = document.getElementById('btn-roll');
    btnRoll.addEventListener('click', rollDice);

    // Preload dice images
    for (let i = 1; i <= 6; i++) {
        const img = new Image();
        img.src = `/assets/kenney_boardgame-pack/PNG/Dice/dieRed${i}.png`;
    }

    // Check asset path
    fetch('/assets/kenney_boardgame-pack/PNG/Dice/dieRed1.png')
        .then(r => r.ok ? 'ok' : 'fail')
        .catch(() => 'fail')
        .then(status => {
            if (status === 'fail') {
                addLog('⚠️ Assets not found — using fallback dice');
            }
        });

    // Start game
    addLog('🎲 Welcome to Dice Quest!');
    addLog('💡 Tip: Try to reach $20,000 to win');
}

// Boot
window.addEventListener('DOMContentLoaded', init);
