// ===== Global Variables =====
let peer = null;
let conn = null;
let myPeerId = '';
let isHost = false;
let mySymbol = '';
let opponentSymbol = '';
let isMyTurn = false;
let gameActive = false;
let boardState = ['', '', '', '', '', '', '', '', ''];

// ===== DOM Elements =====
const elements = {
    myPeerIdInput: document.getElementById('myPeerId'),
    friendIdInput: document.getElementById('friendId'),
    copyBtn: document.getElementById('copyBtn'),
    connectBtn: document.getElementById('connectBtn'),
    connectionStatus: document.getElementById('connectionStatus'),
    lobby: document.getElementById('lobby'),
    gameSection: document.getElementById('gameSection'),
    playerRole: document.getElementById('playerRole'),
    gameStatus: document.getElementById('gameStatus'),
    board: document.getElementById('board'),
    cells: document.querySelectorAll('.cell'),
    rematchBtn: document.getElementById('rematchBtn'),
    leaveBtn: document.getElementById('leaveBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    qrBtn: document.getElementById('qrBtn'),
    qrContainer: document.getElementById('qrContainer'),
    qrCanvas: document.getElementById('qrCanvas')
};

// ===== Initialize PeerJS =====
function initializePeer() {
    // Create a new Peer with auto-generated ID
    peer = new Peer();

    peer.on('open', (id) => {
        myPeerId = id;
        elements.myPeerIdInput.value = id;
        updateConnectionStatus('Ready to connect', 'waiting');
        console.log('My peer ID is: ' + id);
        generateQRCode(id);
    });

    peer.on('connection', (connection) => {
        // Someone is connecting to us (we are the host)
        conn = connection;
        isHost = true;
        mySymbol = 'X';
        opponentSymbol = 'O';
        isMyTurn = true; // Host goes first

        setupConnection();
        updateConnectionStatus('Connected!', 'connected');
        startGame();
    });

    peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        updateConnectionStatus('Connection error: ' + err.type, 'error');
    });
}

// ===== Connection Management =====
function connectToPeer() {
    const friendId = elements.friendIdInput.value.trim();

    if (!friendId) {
        alert('Please enter your friend\'s Peer ID');
        return;
    }

    if (friendId === myPeerId) {
        alert('You cannot connect to yourself!');
        return;
    }

    updateConnectionStatus('Connecting...', 'waiting');
    elements.cancelBtn.classList.remove('hidden');

    // Connect to the friend
    conn = peer.connect(friendId);
    isHost = false;
    mySymbol = 'O';
    opponentSymbol = 'X';
    isMyTurn = false; // Joiner waits for host to move first

    setupConnection();
}

function setupConnection() {
    conn.on('open', () => {
        console.log('Connection established!');
        updateConnectionStatus('Connected!', 'connected');
        elements.cancelBtn.classList.add('hidden');
        startGame();
    });

    conn.on('data', (data) => {
        handleIncomingData(data);
    });

    conn.on('close', () => {
        updateConnectionStatus('Connection closed', 'error');
        alert('Your opponent disconnected');
        resetToLobby();
    });

    conn.on('error', (err) => {
        console.error('Connection error:', err);
        updateConnectionStatus('Connection failed', 'error');
    });
}

function handleIncomingData(data) {
    console.log('Received data:', data);

    switch (data.type) {
        case 'MOVE':
            handleOpponentMove(data.index);
            break;
        case 'RESTART':
            resetGame();
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

// ===== Game Logic =====
function startGame() {
    // Hide lobby, show game
    elements.lobby.classList.add('hidden');
    elements.gameSection.classList.remove('hidden');

    // Update player role display
    elements.playerRole.innerHTML = `You are: <strong>${mySymbol}</strong>`;

    // Reset game state
    gameActive = true;
    boardState = ['', '', '', '', '', '', '', '', ''];

    // Clear board visually
    elements.cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('filled', 'x', 'o', 'winning');
    });

    // Update status
    updateGameStatus();

    // Add click listeners to cells
    elements.cells.forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(index));
    });
}

function handleCellClick(index) {
    // Validate move
    if (!gameActive) return;
    if (!isMyTurn) return;
    if (boardState[index] !== '') return;

    // Make the move
    makeMove(index, mySymbol);

    // Send move to opponent
    conn.send({
        type: 'MOVE',
        index: index
    });

    // Switch turn
    isMyTurn = false;
    updateGameStatus();

    // Check for win/draw
    checkGameEnd();
}

function handleOpponentMove(index) {
    // Update board with opponent's move
    makeMove(index, opponentSymbol);

    // Switch turn back to us
    isMyTurn = true;
    updateGameStatus();

    // Check for win/draw
    checkGameEnd();
}

function makeMove(index, symbol) {
    boardState[index] = symbol;
    const cell = elements.cells[index];
    cell.textContent = symbol;
    cell.classList.add('filled', symbol.toLowerCase());
}

function checkGameEnd() {
    const winner = checkWinner();

    if (winner) {
        gameActive = false;
        highlightWinningCells(winner.line);

        if (winner.symbol === mySymbol) {
            elements.gameStatus.textContent = '🎉 You Win!';
            elements.gameStatus.style.color = '#10b981';
        } else {
            elements.gameStatus.textContent = '😢 You Lose';
            elements.gameStatus.style.color = '#ef4444';
        }
        return;
    }

    // Check for draw
    if (boardState.every(cell => cell !== '')) {
        gameActive = false;
        elements.gameStatus.textContent = '🤝 Draw!';
        elements.gameStatus.style.color = '#f59e0b';
    }
}

function checkWinner() {
    const winPatterns = [
        [0, 1, 2], // Top row
        [3, 4, 5], // Middle row
        [6, 7, 8], // Bottom row
        [0, 3, 6], // Left column
        [1, 4, 7], // Middle column
        [2, 5, 8], // Right column
        [0, 4, 8], // Diagonal \
        [2, 4, 6]  // Diagonal /
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (boardState[a] &&
            boardState[a] === boardState[b] &&
            boardState[a] === boardState[c]) {
            return {
                symbol: boardState[a],
                line: pattern
            };
        }
    }

    return null;
}

function highlightWinningCells(line) {
    line.forEach(index => {
        elements.cells[index].classList.add('winning');
    });
}

function resetGame() {
    boardState = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;

    // Reset turn order (host always starts)
    if (isHost) {
        isMyTurn = true;
    } else {
        isMyTurn = false;
    }

    // Clear board
    elements.cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('filled', 'x', 'o', 'winning');
    });

    // Reset status colors
    elements.gameStatus.style.color = '';
    updateGameStatus();
}

function resetToLobby() {
    // Close connection if exists
    if (conn) {
        conn.close();
        conn = null;
    }

    // Reset game state
    gameActive = false;
    isHost = false;
    mySymbol = '';
    opponentSymbol = '';
    isMyTurn = false;
    boardState = ['', '', '', '', '', '', '', '', ''];

    // Show lobby, hide game
    elements.gameSection.classList.add('hidden');
    elements.lobby.classList.remove('hidden');

    // Clear friend ID input
    elements.friendIdInput.value = '';

    updateConnectionStatus('Ready to connect', 'waiting');
    elements.cancelBtn.classList.add('hidden');
}

function generateQRCode(id) {
    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded yet');
        return;
    }

    const joinUrl = `${window.location.origin}${window.location.pathname}?join=${id}`;
    console.log('Generating QR for:', joinUrl);

    QRCode.toCanvas(elements.qrCanvas, joinUrl, {
        width: 200,
        margin: 1,
        color: {
            dark: '#1a1f3a',
            light: '#ffffff'
        }
    }, function (error) {
        if (error) {
            console.error('QR Code error:', error);
        } else {
            console.log('QR Code generated successfully!');
        }
    });
}

function checkJoinUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');

    if (joinId) {
        elements.friendIdInput.value = joinId;
        // Wait a moment for PeerJS to be ready before connecting
        setTimeout(() => {
            if (myPeerId) {
                connectToPeer();
            } else {
                // If peer id not ready yet, wait and try again
                const checkInterval = setInterval(() => {
                    if (myPeerId) {
                        connectToPeer();
                        clearInterval(checkInterval);
                    }
                }, 500);
            }
        }, 1000);
    }
}

// ===== UI Updates =====
function updateGameStatus() {
    if (!gameActive) return;

    if (isMyTurn) {
        elements.gameStatus.textContent = '🎯 Your Turn';
        elements.gameStatus.style.color = '#6366f1';
    } else {
        elements.gameStatus.textContent = '⏳ Opponent\'s Turn';
        elements.gameStatus.style.color = '#94a3b8';
    }
}

function updateConnectionStatus(message, status) {
    const statusDot = elements.connectionStatus.querySelector('.status-dot');
    const statusText = elements.connectionStatus.querySelector('.status-text');

    statusText.textContent = message;

    // Remove all status classes
    elements.connectionStatus.classList.remove('connected', 'error');

    // Add appropriate class
    if (status === 'connected') {
        elements.connectionStatus.classList.add('connected');
    } else if (status === 'error') {
        elements.connectionStatus.classList.add('error');
    }
}

// ===== Event Listeners =====
elements.copyBtn.addEventListener('click', () => {
    elements.myPeerIdInput.select();
    elements.myPeerIdInput.setSelectionRange(0, 99999);

    const showSuccess = () => {
        const originalHTML = elements.copyBtn.innerHTML;
        elements.copyBtn.innerHTML = '✓';
        elements.copyBtn.style.background = '#10b981';

        setTimeout(() => {
            elements.copyBtn.innerHTML = originalHTML;
            elements.copyBtn.style.background = '';
        }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(myPeerId).then(showSuccess).catch(() => {
            try {
                document.execCommand('copy');
                showSuccess();
            } catch (err) {
                console.warn('Clipboard write failed, selected text manually');
            }
        });
    } else {
        try {
            document.execCommand('copy');
            showSuccess();
        } catch (err) {
            console.warn('Clipboard write failed, selected text manually');
        }
    }
});

elements.connectBtn.addEventListener('click', connectToPeer);

elements.friendIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        connectToPeer();
    }
});

elements.rematchBtn.addEventListener('click', () => {
    // Send restart signal to opponent
    if (conn && conn.open) {
        conn.send({ type: 'RESTART' });
    }

    // Reset our game
    resetGame();
});

elements.leaveBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave the game?')) {
        resetToLobby();
    }
});

elements.cancelBtn.addEventListener('click', () => {
    resetToLobby();
});

elements.qrBtn.addEventListener('click', () => {
    elements.qrContainer.classList.toggle('hidden');
});

// ===== Initialize on Page Load =====
window.addEventListener('DOMContentLoaded', () => {
    initializePeer();
    checkJoinUrl();
});
