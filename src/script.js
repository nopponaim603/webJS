// Game Data
const gamesData = [
    {
        id: "emoji-match",
        title: "Emoji Match",
        category: "ปริศนา / ฝึกสมอง",
        url: "games/emoji-match/index.html",
        aspectRatio: "390 / 480", // Optimized for narrow tall screens
        image: "https://images.unsplash.com/photo-1614332287897-cdc485fa562d?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)"
    },
    {
        id: "2048-cubes",
        title: "2048 Cubes",
        category: "ปริศนา / ฟิสิกส์",
        url: "games/2048-cubes/index.html",
        aspectRatio: "450 / 600",
        image: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #FF9F43 0%, #FF6B6B 100%)"
    },
    {
        id: "tile-match",
        title: "Tile Match",
        category: "ปริศนา / จับคู่ทรีแมตช์",
        url: "games/tile-match/index.html",
        aspectRatio: "1 / 1.5",
        image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #5D2A35 0%, #A04050 100%)"
    },
    {
        id: "phaser-demo",
        title: "Cosmic Bouncer (Phaser 2D)",
        category: "Phaser 2D Engine",
        url: "games/phaser-demo/index.html",
        aspectRatio: "4 / 3",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)"
    },
    {
        id: "babylon-demo",
        title: "Cyber Sphere 3D (Babylon.js)",
        category: "Babylon 3D Engine",
        url: "games/babylon-demo/index.html",
        aspectRatio: "16 / 9",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)"
    },
    {
        id: 1,
        title: "Star Quest",
        category: "ผจญภัย",
        image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)"
    },
    {
        id: 2,
        title: "Puzzle Master",
        category: "ปริศนา",
        image: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)"
    },
    {
        id: 3,
        title: "Speed Runner",
        category: "แข่งรถ",
        image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #A8E6CF 0%, #3DDC84 100%)"
    },
    {
        id: 4,
        title: "Thunder Strike",
        category: "แอคชั่น",
        image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)"
    },
    {
        id: 5,
        title: "Magic Realm",
        category: "แฟนตาซี",
        image: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)"
    },
    {
        id: 6,
        title: "Platform Hero",
        category: "แพลตฟอร์ม",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #F093FB 0%, #F5576C 100%)"
    },
    {
        id: 7,
        title: "Ninja Warrior",
        category: "แอคชั่น",
        image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
        id: 8,
        title: "Candy Match",
        category: "ปริศนา",
        image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
        id: 9,
        title: "Space Shooter",
        category: "ยิงอวกาศ",
        image: "https://images.unsplash.com/photo-1614732484003-ef9881555dc3?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    },
    {
        id: 10,
        title: "Soccer Stars",
        category: "กีฬา",
        image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    },
    {
        id: 11,
        title: "Racing Fever",
        category: "แข่งรถ",
        image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    },
    {
        id: 12,
        title: "Tower Defense",
        category: "กลยุทธ์",
        image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
    },
    {
        id: 13,
        title: "Bubble Pop",
        category: "ปริศนา",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
    },
    {
        id: 14,
        title: "Zombie Survival",
        category: "สยองขวัญ",
        image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)"
    },
    {
        id: 15,
        title: "Chess Master",
        category: "กระดาน",
        image: "https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
    },
    {
        id: 16,
        title: "Fruit Ninja",
        category: "แอคชั่น",
        image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)"
    },
    {
        id: 17,
        title: "Mahjong Solitaire",
        category: "กระดาน",
        image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)"
    },
    {
        id: 18,
        title: "Cooking Mama",
        category: "จำลอง",
        image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)"
    },
    {
        id: 19,
        title: "Drift Racing",
        category: "แข่งรถ",
        image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)"
    },
    {
        id: 20,
        title: "Archery Master",
        category: "กีฬา",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)"
    },
    {
        id: 21,
        title: "Piano Tiles",
        category: "ดนตรี",
        image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
        id: 22,
        title: "Subway Surfers",
        category: "วิ่งไม่รู้จบ",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)"
    },
    {
        id: 23,
        title: "Angry Birds",
        category: "แอคชั่น",
        image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)"
    },
    {
        id: 24,
        title: "Temple Run",
        category: "วิ่งไม่รู้จบ",
        image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop",
        gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)"
    }
];

// DOM Elements
const gamesGrid = document.getElementById('gamesGrid');
const sidebarGameCards = document.querySelectorAll('.sidebar-game-card');
const gamePlaceholder = document.querySelector('.game-placeholder');
const gameTitleDisplay = document.querySelector('.game-title-display');
const gameAuthor = document.querySelector('.game-author');
const fullscreenBtn = document.querySelector('.fullscreen-btn');

// State
let currentGame = null;

// Initialize
function init() {
    renderGames();
    attachEventListeners();
    addScrollAnimations();
}

// Render Games Grid
function renderGames() {
    gamesGrid.innerHTML = '';

    gamesData.forEach((game, index) => {
        const gameCard = createGameCard(game, index);
        gamesGrid.appendChild(gameCard);
    });
}

// Create Game Card
function createGameCard(game, index) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.gameId = game.id;

    card.innerHTML = `
        <div class="game-card-image" style="background: ${game.gradient};">
            <img src="${game.image}" alt="${game.title}" 
                 style="width: 100%; height: 100%; object-fit: cover; mix-blend-mode: overlay; opacity: 0.8;"
                 onerror="this.style.display='none'">
        </div>
        <div class="game-card-content">
            <h3 class="game-card-title">${game.title}</h3>
            <p class="game-card-category">${game.category}</p>
        </div>
    `;

    card.addEventListener('click', () => loadGame(game));

    return card;
}

// Load Game
function loadGame(game) {
    currentGame = game;

    // Update game player
    const playerContainer = document.querySelector('.game-iframe-container');
    if (game.aspectRatio) {
        playerContainer.style.aspectRatio = game.aspectRatio;
        playerContainer.style.minHeight = 'unset';
        playerContainer.style.maxWidth = '500px';
        playerContainer.style.margin = '0 auto';
    } else {
        playerContainer.style.aspectRatio = '16 / 9';
        playerContainer.style.minHeight = '400px';
        playerContainer.style.maxWidth = '100%';
        playerContainer.style.margin = '0';
    }

    if (game.url) {
        gamePlaceholder.innerHTML = `
            <iframe src="${game.url}" style="width: 100%; height: 100%; border: none; background: #3c343b;" title="${game.title}"></iframe>
        `;
    } else {
        gamePlaceholder.innerHTML = `
            <div class="game-placeholder-content">
                <div style="width: 100%; height: 100%; background: ${game.gradient}; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1rem;">
                    <img src="${game.image}" alt="${game.title}" 
                         style="width: 120px; height: 120px; border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); object-fit: cover;"
                         onerror="this.style.display='none'">
                    <h2 style="color: white; font-size: 2rem; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.3);">${game.title}</h2>
                    <p style="color: rgba(255,255,255,0.9); font-size: 1.125rem;">กำลังโหลดเกม...</p>
                    <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
                        <div style="width: 100%; height: 100%; background: white; animation: loading 1.5s ease-in-out infinite;"></div>
                    </div>
                </div>
            </div>
        `;

        // Simulate loading
        setTimeout(() => {
            gamePlaceholder.innerHTML = `
                <div class="game-placeholder-content">
                    <div style="width: 100%; height: 100%; background: ${game.gradient}; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1.5rem; padding: 2rem;">
                        <img src="${game.image}" alt="${game.title}" 
                             style="width: 160px; height: 160px; border-radius: 24px; box-shadow: 0 16px 48px rgba(0,0,0,0.4); object-fit: cover;"
                             onerror="this.style.display='none'">
                        <div style="text-align: center;">
                            <h2 style="color: white; font-size: 2.5rem; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.3); margin-bottom: 0.5rem;">${game.title}</h2>
                            <p style="color: rgba(255,255,255,0.95); font-size: 1.25rem; margin-bottom: 1.5rem;">เกม ${game.category}</p>
                            <button onclick="alert('นี่คือตัวอย่างการแสดงผล! คุณสามารถเพิ่ม iframe หรือ canvas สำหรับเกมจริงได้')" 
                                    style="padding: 1rem 2rem; background: white; color: #0A1929; border: none; border-radius: 12px; font-size: 1.125rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.2); transition: all 0.3s;">
                                🎮 เริ่มเล่น
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }, 1500);
    }

    // Update game info
    gameTitleDisplay.textContent = game.title;
    gameAuthor.textContent = `หมวดหมู่: ${game.category}`;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Attach Event Listeners
function attachEventListeners() {
    // Sidebar game cards
    document.querySelectorAll('.sidebar-game-card').forEach((card) => {
        card.addEventListener('click', () => {
            const gameId = card.dataset.game;
            const game = gamesData.find(g => g.id === gameId);
            if (game) {
                loadGame(game);
            }
        });
    });


    // Fullscreen button
    fullscreenBtn.addEventListener('click', () => {
        const gamePlayer = gamePlaceholder; // Target the inner content directly
        if (!document.fullscreenElement) {
            gamePlayer.requestFullscreen().catch(err => {
                alert(`ไม่สามารถเปิดโหมดเต็มจอได้: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Search button
    const searchBtn = document.getElementById('searchBtn');
    searchBtn.addEventListener('click', () => {
        const query = prompt('ค้นหาเกม:');
        if (query) {
            searchGames(query);
        }
    });
}

// Search Games
function searchGames(query) {
    const filtered = gamesData.filter(game =>
        game.title.toLowerCase().includes(query.toLowerCase()) ||
        game.category.toLowerCase().includes(query.toLowerCase())
    );

    gamesGrid.innerHTML = '';

    if (filtered.length === 0) {
        gamesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto 1rem; opacity: 0.3;">
                    <circle cx="40" cy="40" r="30" stroke="currentColor" stroke-width="3"/>
                    <path d="M30 30L50 50M50 30L30 50" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                </svg>
                <h3 style="font-size: 1.5rem; color: var(--text-secondary); margin-bottom: 0.5rem;">ไม่พบเกมที่ค้นหา</h3>
                <p style="color: var(--text-muted);">ลองค้นหาด้วยคำอื่น</p>
                <button onclick="location.reload()" style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: var(--primary-gradient); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">
                    แสดงเกมทั้งหมด
                </button>
            </div>
        `;
    } else {
        filtered.forEach((game, index) => {
            const gameCard = createGameCard(game, index);
            gamesGrid.appendChild(gameCard);
        });
    }
}

// Add Scroll Animations
function addScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.game-card, .category-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s, transform 0.5s';
        observer.observe(el);
    });
}

// Add loading animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
`;
document.head.appendChild(style);

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {

    // F to fullscreen
    if (e.code === 'KeyF' && currentGame) {
        e.preventDefault();
        fullscreenBtn.click();
    }

    // Escape to exit fullscreen
    if (e.code === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

// PWA Service Worker & Install Prompt Registration
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log('[PWA] Service Worker registered successfully:', reg.scope))
            .catch((err) => console.warn('[PWA] Service Worker registration failed:', err));
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) {
        installBtn.style.display = 'inline-flex';
        installBtn.addEventListener('click', () => {
            installBtn.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('[PWA] User accepted the install prompt');
                }
                deferredPrompt = null;
            });
        });
    }
});

console.log('🎮 Game Portfolio & PWA Multi-Engine Loaded!');
console.log(`📊 Total Games: ${gamesData.length}`);

