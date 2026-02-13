// Game Configuration
let peer = null;
let conn = null;
let myPlayerSymbol = null; // 'X' or 'O'
let isMyTurn = false;
let gameState = Array(9).fill(null);
let gameActive = false;

// DOM Elements
const lobbyEl = document.getElementById('lobby');
const gameRoomEl = document.getElementById('game-room');
const myIdInput = document.getElementById('my-id');
const peerIdInput = document.getElementById('peer-id-input');
const connectBtn = document.getElementById('connect-btn');
const copyIdBtn = document.getElementById('copy-id');
const statusText = document.getElementById('status-text');
const peerStatus = document.getElementById('peer-status');
const cells = document.querySelectorAll('.cell');
const turnIndicator = document.getElementById('turn-indicator');
const resetBtn = document.getElementById('reset-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const toastEl = document.getElementById('toast');
const p1Info = document.getElementById('p1-info');
const p2Info = document.getElementById('p2-info');
const showQrBtn = document.getElementById('show-qr');
const closeQrBtn = document.getElementById('close-qr');
const qrModal = document.getElementById('qr-modal');
const qrcodeContainer = document.getElementById('qrcode');

// Initialize PeerJS
function initPeer() {
    peer = new Peer({
        debug: 2
    });

    peer.on('open', (id) => {
        myIdInput.value = id;
        statusText.innerText = "Online - Ready to play";
        peerStatus.classList.add('online');
        showToast("Logged in to Peer Server");

        // Check for join parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const joinId = urlParams.get('join');
        if (joinId && joinId !== id) {
            peerIdInput.value = joinId;
            showToast("Connecting to friend...");
            setTimeout(() => connectBtn.click(), 500);
        }
    });

    peer.on('connection', (connection) => {
        // If already in a game, decline? (For simplicity, we just accept the latest)
        if (conn) conn.close();

        conn = connection;
        setupConnection();
        // Host is always X
        myPlayerSymbol = 'X';
        isMyTurn = true;
        startGame();
    });

    peer.on('error', (err) => {
        console.error(err);
        showToast("Error: " + err.type, true);
        statusText.innerText = "Connection error";
        peerStatus.classList.remove('online');
    });
}

// Setup Data Connection Listeners
function setupConnection() {
    conn.on('open', () => {
        showToast("Connected to opponent!");
        // If we are the one who initiated (Guest), we are O
        if (!myPlayerSymbol) {
            myPlayerSymbol = 'O';
            isMyTurn = false;
            startGame();
        }
    });

    conn.on('data', (data) => {
        handleReceivedData(data);
    });

    conn.on('close', () => {
        showToast("Opponent left the game", true);
        backToLobby();
    });
}

// Handle Incoming Game Data
function handleReceivedData(data) {
    switch (data.type) {
        case 'MOVE':
            updateBoard(data.index, data.symbol);
            isMyTurn = true;
            updateUI();
            checkGameOver();
            break;
        case 'RESET':
            resetGameLocal();
            showToast("Game restarted by opponent");
            break;
        case 'CHAT':
            // Optional: Chat logic
            break;
    }
}

// Logic: Create/Join
connectBtn.addEventListener('click', () => {
    const peerId = peerIdInput.value.trim();
    if (!peerId) return showToast("Please enter a Peer ID", true);

    conn = peer.connect(peerId);
    setupConnection();
});

// Logic: Game Interactions
cells.forEach(cell => {
    cell.addEventListener('click', (e) => {
        const index = e.target.dataset.index;

        if (gameActive && isMyTurn && !gameState[index]) {
            makeMove(index);
        }
    });
});

function makeMove(index) {
    updateBoard(index, myPlayerSymbol);

    // Send to peer
    conn.send({
        type: 'MOVE',
        index: index,
        symbol: myPlayerSymbol
    });

    isMyTurn = false;
    updateUI();
    checkGameOver();
}

function updateBoard(index, symbol) {
    gameState[index] = symbol;
    const cell = cells[index];
    cell.innerText = symbol;
    cell.classList.add(symbol.toLowerCase(), 'pop');
}

function updateUI() {
    if (!gameActive) return;

    if (isMyTurn) {
        turnIndicator.innerText = "Your Turn (" + myPlayerSymbol + ")";
        p1Info.classList.add('active');
        p2Info.classList.remove('active');
    } else {
        turnIndicator.innerText = "Opponent's Turn...";
        p1Info.classList.remove('active');
        p2Info.classList.add('active');
    }
}

function startGame() {
    lobbyEl.classList.add('hidden');
    gameRoomEl.classList.remove('hidden');
    gameActive = true;
    resetGameLocal();
    updateUI();

    p1Info.querySelector('.symbol').innerText = myPlayerSymbol;
    p1Info.querySelector('.name').innerText = "You";
    p2Info.querySelector('.symbol').innerText = myPlayerSymbol === 'X' ? 'O' : 'X';
    p2Info.querySelector('.name').innerText = "Peer";
}

function checkGameOver() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            endGame(gameState[a]);
            return;
        }
    }

    if (!gameState.includes(null)) {
        endGame('Draw');
    }
}

function endGame(winner) {
    gameActive = false;
    resetBtn.classList.remove('hidden');
    resetBtn.disabled = false;

    if (winner === 'Draw') {
        turnIndicator.innerText = "It's a Draw!";
        turnIndicator.style.color = "var(--text-secondary)";
    } else {
        turnIndicator.innerText = (winner === myPlayerSymbol ? "You Win!" : "You Lose!");
        turnIndicator.style.color = (winner === myPlayerSymbol ? "var(--o-color)" : "var(--x-color)");
    }
}

function resetGameLocal() {
    gameState = Array(9).fill(null);
    cells.forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('x', 'o', 'pop');
    });
    gameActive = true;
    resetBtn.classList.add('hidden');
    turnIndicator.style.color = "";
    // Turn is maintained based on who was supposed to go next or reset to X?
    // Let's reset so X always starts
    isMyTurn = (myPlayerSymbol === 'X');
    updateUI();
}

resetBtn.addEventListener('click', () => {
    resetGameLocal();
    conn.send({ type: 'RESET' });
});

disconnectBtn.addEventListener('click', () => {
    if (conn) conn.close();
    backToLobby();
});

function backToLobby() {
    conn = null;
    myPlayerSymbol = null;
    gameActive = false;
    lobbyEl.classList.remove('hidden');
    gameRoomEl.classList.add('hidden');
}

// Helpers
function showToast(msg, isError = false) {
    toastEl.innerText = msg;
    toastEl.classList.remove('hidden');
    if (isError) toastEl.classList.add('error');
    else toastEl.classList.remove('error');

    setTimeout(() => {
        toastEl.classList.add('hidden');
    }, 3000);
}

copyIdBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(myIdInput.value);
    showToast("ID Copied!");
});

// QR Code Logic
showQrBtn.addEventListener('click', () => {
    const peerId = myIdInput.value;
    if (!peerId) return;

    // Clear previous QR
    qrcodeContainer.innerHTML = '';

    // Create join URL
    const joinUrl = `${window.location.origin}${window.location.pathname}?join=${peerId}`;

    // Generate new QR
    new QRCode(qrcodeContainer, {
        text: joinUrl,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    qrModal.classList.remove('hidden');
});

closeQrBtn.addEventListener('click', () => {
    qrModal.classList.add('hidden');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === qrModal) {
        qrModal.classList.add('hidden');
    }
});

// Boot
initPeer();
