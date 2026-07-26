const emojis = ['🎮', '🕹️', '🎲', '🧩', '🚀', '🛸', '👾', '🤖', '👻', '🎃', '🐱', '🐶', '🦄', '🐼', '🦊', '🦁'];
let gameEmojis = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = 0;
let timerInterval = null;
let isLocked = false;

const grid = document.getElementById('gameGrid');
const movesDisplay = document.getElementById('moves');
const timerDisplay = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const finalMoves = document.getElementById('finalMoves');
const finalTime = document.getElementById('finalTime');

function initGame() {
    // Reset stats
    matchedPairs = 0;
    moves = 0;
    timer = 0;
    flippedCards = [];
    isLocked = false;
    movesDisplay.textContent = '0';
    timerDisplay.textContent = '0:00';
    overlay.classList.remove('active');

    clearInterval(timerInterval);
    timerInterval = null;

    // Pick 8 emojis and double them
    const selectedEmojis = emojis.sort(() => 0.5 - Math.random()).slice(0, 8);
    gameEmojis = [...selectedEmojis, ...selectedEmojis].sort(() => 0.5 - Math.random());

    // Create cards
    grid.innerHTML = '';
    gameEmojis.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.emoji = emoji;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">${emoji}</div>
                <div class="card-back"></div>
            </div>
        `;

        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
    });
}

function startTimer() {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
        timer++;
        const mins = Math.floor(timer / 60);
        const secs = timer % 60;
        timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

function flipCard(card) {
    if (isLocked) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    startTimer();

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    isLocked = true;
    moves++;
    movesDisplay.textContent = moves;

    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.emoji === card2.dataset.emoji;

    if (isMatch) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        flippedCards = [];
        isLocked = false;

        if (matchedPairs === 8) {
            victory();
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            isLocked = false;
        }, 1000);
    }
}

function victory() {
    clearInterval(timerInterval);
    finalMoves.textContent = moves;
    finalTime.textContent = timerDisplay.textContent;

    setTimeout(() => {
        overlay.classList.add('active');
    }, 500);
}

// Start game
initGame();
