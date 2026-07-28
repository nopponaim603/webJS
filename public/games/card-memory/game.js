// ============================================================
// Card Memory Match — Game Logic
// Covers: US-08-02 to US-08-07
// ============================================================

(function() {
  'use strict';

  // ========================
  // Constants & State
  // ========================
  const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
  const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const ASSETS_PATH = '/assets/kenney_playing-cards-pack/PNG/Cards (small)/';
  const TOTAL_PAIRS = 8;
  const TOTAL_CARDS = TOTAL_PAIRS * 2; // 16

  let cards = [];          // array of card objects {suit, value, face, element, matched}
  let flippedCards = [];   // currently face-up (max 2)
  let locked = false;      // prevent clicks during flip animation
  let moves = 0;
  let matchedCount = 0;
  let timerInterval = null;
  let secondsElapsed = 0;
  let gameStarted = false;

  // ========================
  // Card Data
  // ========================
  function getCardImage(suit, value) {
    return `${ASSETS_PATH}card_${suit}_${value}.png`;
  }

  function getCardLabel(suit, value) {
    const suitEmojis = { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' };
    return `${suitEmojis[suit]} ${value}`;
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // ========================
  // Preload Assets (US-08-07)
  // ========================
  const preloadPromises = [];
  const preloadImages = {};

  function preloadImagesAsync() {
    const neededFaces = [];
    for (const suit of SUITS) {
      for (let i = 0; i < 13; i++) {
        neededFaces.push(`${ASSETS_PATH}card_${suit}_${VALUES[i]}.png`);
      }
    }
    // Also preloaded: card_back.png (used as background, not img)
    const count = Math.min(neededFaces.length, TOTAL_PAIRS * 2);
    return neededFaces.slice(0, count).map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // fail gracefully
        img.src = src;
      });
    });
  }

  // ========================
  // Create Card Element
  // ========================
  function createCardElement(suit, value, index) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.index = index;
    card.dataset.suit = suit;
    card.dataset.value = value;

    const front = document.createElement('div');
    front.classList.add('card-face', 'card-front');

    const img = document.createElement('img');
    img.src = getCardImage(suit, value);
    img.alt = getCardLabel(suit, value);
    img.style.opacity = '0';
    img.onload = () => {
      img.style.opacity = '1';
      img.style.transition = 'opacity 0.2s ease';
    };
    // Fallback: show text if image fails
    img.onerror = () => {
      img.style.opacity = '0';
      front.innerHTML = `<div style="text-align:center;font-size:18px;font-weight:bold;color:#333">${getCardLabel(suit, value)}</div>`;
    };

    front.appendChild(img);

    const back = document.createElement('div');
    back.classList.add('card-face', 'card-back');

    card.appendChild(front);
    card.appendChild(back);

    // Click handler (US-08-02: prevent double-click, max 2 open)
    card.addEventListener('click', () => handleCardClick(card));
    card.addEventListener('touchstart', (e) => {
      e.preventDefault(); // prevent delay on mobile
      handleCardClick(card);
    }, { passive: false });

    return card;
  }

  // ========================
  // Build Grid (US-08-01)
  // ========================
  function buildGrid() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    cards = [];

    // Create card pairs
    const selectedCards = [];
    for (let i = 0; i < TOTAL_PAIRS; i++) {
      const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
      const value = VALUES[Math.floor(Math.random() * VALUES.length)];
      selectedCards.push({ suit, value });
      selectedCards.push({ suit, value });
    }

    shuffle(selectedCards);

    selectedCards.forEach((data, index) => {
      const cardEl = createCardElement(data.suit, data.value, index);
      cards.push({
        element: cardEl,
        suit: data.suit,
        value: data.value,
        matched: false,
      });
      grid.appendChild(cardEl);
    });
  }

  // ========================
  // Handle Card Click (US-08-02)
  // ========================
  function handleCardClick(cardElement) {
    if (locked) return;
    if (cardElement.classList.contains('flipped') || cardElement.classList.contains('matched')) return;
    if (flippedCards.length >= 2) return; // prevent third card

    // Start game on first click
    if (!gameStarted) {
      gameStarted = true;
      startTimer();
    }

    // Flip animation
    cardElement.classList.add('flipped');
    flippedCards.push(cardElement);

    if (flippedCards.length === 2) {
      checkMatch();
    }
  }

  // ========================
  // Check Match (US-08-02)
  // ========================
  function checkMatch() {
    locked = true;
    const [card1, card2] = flippedCards;
    const data1 = cards.find(c => c.element === card1);
    const data2 = cards.find(c => c.element === card2);

    const isMatch = data1.suit === data2.suit && data1.value === data2.value;

    moves++;
    updateMovesCounter();

    if (isMatch) {
      // Matched — locked open
      card1.classList.remove('flipped');
      card1.classList.add('matched');
      card2.classList.remove('flipped');
      card2.classList.add('matched');
      data1.matched = true;
      data2.matched = true;

      if (matchedCount + 1 >= TOTAL_PAIRS) {
        setTimeout(() => showResults(), 500);
      }
      matchedCount++;
      flippedCards = [];
      locked = false;
    } else {
      // Mismatch — flip back after 1.5s
      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        flippedCards = [];
        locked = false;
      }, 1500);
    }
  }

  // ========================
  // Timer (US-08-03)
  // ========================
  function startTimer() {
    timerInterval = setInterval(() => {
      secondsElapsed++;
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function resetTimer() {
    stopTimer();
    secondsElapsed = 0;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    document.getElementById('timer-display').textContent =
      `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateMovesCounter() {
    document.getElementById('moves-count').textContent = moves;
  }

  // ========================
  // Results Modal (US-08-04)
  // ========================
  function calculateScore(moves, time) {
    // Base score 1000, penalize for moves and time
    const baseScore = 1000;
    const movePenalty = Math.max(0, (moves - 8) * 30); // lose 30 per extra move
    const timePenalty = Math.max(0, (time - 60) * 5); // lose 5 per extra second
    return Math.max(0, baseScore - movePenalty - timePenalty);
  }

  function calculateRating(moves, time) {
    if (moves < 10 || time < 30) return 5;
    if (moves <= 14 || time <= 60) return 4;
    if (moves <= 18 || time <= 90) return 3;
    if (moves <= 22 || time <= 120) return 2;
    return 1;
  }

  function getBestScore() {
    try {
      const saved = localStorage.getItem('card-memory-best');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  function saveBestScore(score) {
    try {
      localStorage.setItem('card-memory-best', JSON.stringify(score));
    } catch {
      // localStorage unavailable
    }
  }

  function showResults() {
    stopTimer();
    const score = calculateScore(moves, secondsElapsed);
    const rating = calculateRating(moves, secondsElapsed);

    document.getElementById('stat-time').textContent =
      `${String(Math.floor(secondsElapsed / 60)).padStart(2, '0')}:${String(secondsElapsed % 60).padStart(2, '0')}`;
    document.getElementById('stat-moves').textContent = moves;
    document.getElementById('stat-score').textContent = score;

    let stars = '';
    for (let i = 0; i < 5; i++) {
      stars += i < rating ? '⭐' : '☆';
    }
    document.getElementById('stat-stars').textContent = stars;

    // Best score
    const best = getBestScore();
    const highScoreEl = document.getElementById('high-score');
    if (best && score > best.score) {
      saveBestScore({ score, moves, time: secondsElapsed, date: new Date().toISOString() });
      highScoreEl.textContent = `🏆 Record ใหม่!`;
    } else if (best) {
      highScoreEl.textContent = `Best: ${best.score} pts (${best.moves} moves, ${formatTime(best.time)})`;
    }

    document.getElementById('results-modal').classList.remove('hidden');
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // ========================
  // Game Reset (US-08-05)
  // ========================
  function resetGame() {
    // Close modal if open
    document.getElementById('results-modal').classList.add('hidden');

    // Reset state
    flippedCards = [];
    locked = false;
    moves = 0;
    matchedCount = 0;
    gameStarted = false;
    secondsElapsed = 0;

    updateMovesCounter();
    updateTimerDisplay();
    resetTimer();

    buildGrid();
  }

  // ========================
  // Event Listeners
  // ========================
  document.getElementById('new-game-btn').addEventListener('click', resetGame);
  document.getElementById('play-again-btn').addEventListener('click', resetGame);
  document.getElementById('close-modal-btn').addEventListener('click', () => {
    document.getElementById('results-modal').classList.add('hidden');
  });

  // Prevent double-tap zoom on mobile (US-08-06)
  document.addEventListener('touchend', (e) => {
    if (e.detail > 1) e.preventDefault();
  }, { passive: false });

  // ========================
  // Init
  // ========================
  function init() {
    buildGrid();
  }

  // Start
  init();

})();