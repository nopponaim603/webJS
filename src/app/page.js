'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import GameModal from '@/components/GameModal';
import PWAInstallButton from '@/components/PWAInstallButton';
import buildInfo from '../../public/build.json';

const initialGames = [
  // 1. กลุ่มปริศนา (Puzzle) & ซิมูเลชัน
  {
    id: "pong-wars",
    title: "⚔️ Dynamic Pong Wars (Day vs Night)",
    category: "ปริศนา / ฟิสิกส์",
    url: "/games/pong-wars/index.html",
    image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #0F172A 0%, #38BDF8 100%)"
  },
  {
    id: "card-memory",
    title: "Card Memory Match",
    category: "ปริศนา / ฝึกสมอง",
    url: "/games/card-memory/index.html",
    image: "https://images.unsplash.com/photo-1541278107931-e006523892df?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)"
  },
  {
    id: "emoji-match",
    title: "Emoji Memory Match",
    category: "ปริศนา / ฝึกสมอง",
    url: "/games/emoji-match/index.html",
    image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)"
  },
  {
    id: "goosl-marbles",
    title: "Goosl Glass Marbles",
    category: "ปริศนา / ฟิสิกส์",
    url: "/games/goosl-marbles/index.html",
    image: "/games/goosl-marbles/thumbnail.png",
    gradient: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)"
  },
  {
    id: "2048-cubes",
    title: "2048 Cubes",
    category: "ปริศนา / ฟิสิกส์",
    url: "/games/2048-cubes/index.html",
    image: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #FF9F43 0%, #FF6B6B 100%)"
  },
  {
    id: "mahjong-tile-match",
    title: "Mahjong Tile Match",
    category: "ปริศนา / จับคู่ทรีแมตช์",
    url: "/games/mahjong-tile-match/index.html",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #5D2A35 0%, #A04050 100%)"
  },

  // 2. กลุ่ม Phaser 2D Engine
  {
    id: "ocean-frenzy",
    title: "Ocean Frenzy",
    category: "Phaser 2D Engine",
    url: "/games/ocean-frenzy/index.html",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #0A1628 0%, #00F2FE 100%)"
  },
  {
    id: "tiny-dungeon-roguelike",
    title: "Tiny Dungeon Survivor",
    category: "Phaser 2D Engine",
    url: "/games/tiny-dungeon-roguelike/index.html",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #00F2FE 0%, #7F00FF 100%)"
  },
  {
    id: "tiny-dungeon-squad",
    title: "Tiny Dungeon Squad (SNKRX)",
    category: "Phaser 2D Engine",
    url: "/games/tiny-dungeon-squad/index.html",
    image: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #00F2FE 100%)"
  },
  {
    id: "space-shooter",
    title: "Space Shooter",
    category: "Phaser 2D Engine",
    url: "/games/phaser-demo/index.html",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)"
  },
  {
    id: "dice-quest",
    title: "Dice Quest (G010)",
    category: "กระดาน / วางกลยุทธ์",
    url: "/games/dice-quest/index.html",
    image: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)"
  },
  {
    id: "stateIO",
    title: "State.IO",
    category: "กระดาน / วางกลยุทธ์",
    url: "/games/stateIO/index.html",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #00F2FE 0%, #3B82F6 100%)"
  },
  {
    id: "warfront",
    title: "WarFront.io (RTS Strategy)",
    category: "กระดาน / วางกลยุทธ์",
    url: "/games/warfront/index.html",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #1E293B 0%, #3B82F6 100%)"
  },
  {
    id: "animated-card-game",
    title: "FOOL THE GAME (G022)",
    category: "กระดาน / วางกลยุทธ์",
    url: "/games/animated-card-game/index.html",
    image: "https://images.unsplash.com/photo-1541278107931-e006523892df?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #581C87 0%, #3B82F6 100%)"
  },
  {
    id: "webrtc-xo",
    title: "XO Multiplayer (WebRTC P2P)",
    category: "กระดาน / มัลติเพลเยอร์",
    url: "/games/webrtc-xo/index.html",
    image: "https://images.unsplash.com/photo-1668554245893-2430d0077217?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #6366F1 0%, #EC4899 100%)"
  },
  {
    id: "tile-swap",
    title: "Tile Swap",
    category: "ปริศนา / สลับไทล์",
    url: "/games/tile-swap/index.html",
    image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)"
  },

  // 3. กลุ่ม Babylon 3D Engine
  {
    id: "boba-pearl-drop",
    title: "BOBA PEARL DROP: 100% SUGAR",
    category: "Babylon 3D Engine",
    url: "/games/boba-pearl-drop/index.html",
    image: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #F59E0B 0%, #A855F7 100%)"
  },
  {
    id: "3d-platformer",
    title: "Kenney 3D Platformer",
    category: "Babylon 3D Engine",
    url: "/games/3d-platformer/index.html",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
  },
  {
    id: "cyber-sphere",
    title: "Cyber Sphere 3D",
    category: "Babylon 3D Engine",
    url: "/games/babylon-demo/index.html",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)"
  },

  // 4. กลุ่ม Three.js / WebGPU 3D Engine
  {
    id: "hole-io",
    title: "Hungry Manhole (Hole.io City)",
    category: "Three.js 3D Engine",
    url: "/games/hole-io/index.html",
    image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)"
  },
  {
    id: "skate-dog",
    title: "Skate Dog (3D Procedural)",
    category: "Three.js 3D Engine",
    url: "/games/skate-dog/index.html",
    image: "/games/skate-dog/og.webp",
    gradient: "linear-gradient(135deg, #F472B6 0%, #FB923C 100%)"
  },
  {
    id: "eggplant-wiggle",
    title: "🍆 Wiggle Eggplant 3D",
    category: "Three.js 3D Engine",
    url: "/games/eggplant-wiggle/index.html",
    image: "https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #610085 0%, #A855F7 100%)"
  },
  {
    id: "pretext-breaker",
    title: "Pretext Breaker (Typography Arkanoid)",
    category: "ปริศนา / อาเขต",
    url: "/games/pretext-breaker/index.html",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #0EA5E9 0%, #F59E0B 100%)"
  },
  {
    id: "overprint-404",
    title: "🎯 404 OVERPRINT (Tactical Shooter)",
    category: "ปริศนา / อาเขต",
    url: "/games/overprint-404/index.html",
    image: "/games/overprint-404/thumbnail.jpg",
    gradient: "linear-gradient(135deg, #EC0A63 0%, #161513 100%)"
  },
  {
    id: "starter-kit-racing",
    title: "🏎️ Starter Kit Racing 3D",
    category: "Three.js 3D Engine",
    url: "/games/starter-kit-racing/index.html",
    image: "/games/starter-kit-racing/screenshot.png",
    gradient: "linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)"
  },
  {
    id: "godawful",
    title: "⚡ GODAWFUL (Cute Town God Sim)",
    category: "Three.js 3D Engine",
    url: "/games/godawful/index.html",
    image: "/games/godawful/og.png",
    gradient: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)"
  },
  {
    id: "survive-10-waves",
    title: "🛡️ SURVIVE 10 WAVES (Extraction 3D)",
    category: "Three.js 3D Engine",
    url: "/games/survive-10-waves/index.html",
    image: "/games/survive-10-waves/assets/og-image.jpg",
    gradient: "linear-gradient(135deg, #0F172A 0%, #06B6D4 100%)"
  },
  {
    id: "dirtline",
    title: "🏍️ DIRT LINE (Trials Dirt Bike 3D)",
    category: "Three.js 3D Engine",
    url: "/games/dirtline/index.html",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #78350F 0%, #F59E0B 100%)"
  },
  {
    id: "water-ring-toss",
    title: "🌊 Water Ring Toss 3D",
    category: "Three.js 3D Engine",
    url: "/games/water-ring-toss/index.html",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)"
  },
  {
    id: "celadon",
    title: "🏺 CELADON: The Long Ash 3D",
    category: "Three.js 3D Engine",
    url: "/games/celadon/index.html",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #1F6B57 0%, #7FBFA4 100%)"
  },
  {
    id: "crumple",
    title: "📄 Crumple (Paper Arcade)",
    category: "Three.js 3D Engine",
    url: "/games/crumple/index.html",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=400&fit=crop",
    gradient: "linear-gradient(135deg, #57534E 0%, #A8A29E 100%)"
  }
];

const categories = ["ทั้งหมด", "ปริศนา", "กระดาน", "Phaser 2D", "Babylon 3D", "Three.js 3D"];

export default function Home() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [activeGame, setActiveGame] = useState(null);

  const filteredGames = initialGames.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesCategory = selectedCategory === 'ทั้งหมด' || game.category.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header searchKeyword={searchKeyword} setSearchKeyword={setSearchKeyword} />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {/* Banner Section */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(79, 172, 254, 0.15) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          padding: '2.5rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(12px)'
        }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.75rem' }}>
            🎮 HTML5 & Multi-Engine <span className="gradient-text">GameDevJS Hub</span>
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.05rem', maxWidth: '700px', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            ศูนย์รวมเกม HTML5, Phaser 2D, Babylon.js 3D และ Three.js / WebGPU บนสถาปัตยกรรม Next.js App Router พร้อมรองรับ PWA ออฟไลน์ และการแสดงผลระดับพรีเมียม
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <PWAInstallButton variant="hero" />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              ⚡ เล่นได้ทันที รองรับบราวเซอร์ทุกอุปกรณ์ และเล่นแบบออฟไลน์ได้
            </span>
          </div>
        </section>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat 
                  ? 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)' 
                  : 'rgba(30, 41, 59, 0.7)',
                color: selectedCategory === cat ? '#0f172a' : '#f8fafc',
                fontWeight: '700',
                fontSize: '0.9rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '9999px',
                border: selectedCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Games Grid grouped by Category Sections */}
        {selectedCategory === 'ทั้งหมด' && !searchKeyword ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Section 1: กลุ่มเกมปริศนา */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🧩 กลุ่มเกมปริศนา (Puzzle Games)
                </h2>
                <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.2rem 0.75rem', borderRadius: '9999px', fontWeight: '700' }}>
                  {initialGames.filter(g => g.category.includes('ปริศนา')).length} เกม
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.5rem'
              }}>
                {initialGames.filter(g => g.category.includes('ปริศนา')).map(game => (
                  <GameCard key={game.id} game={game} onPlay={setActiveGame} />
                ))}
              </div>
            </section>

            {/* Section 2: กลุ่มเกมกระดาน & วางกลยุทธ์ */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎲 กลุ่มเกมกระดาน & วางกลยุทธ์ (Board & Strategy)
                </h2>
                <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', padding: '0.2rem 0.75rem', borderRadius: '9999px', fontWeight: '700' }}>
                  {initialGames.filter(g => g.category.includes('กระดาน') || g.category.includes('วางกลยุทธ์')).length} เกม
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.5rem'
              }}>
                {initialGames.filter(g => g.category.includes('กระดาน') || g.category.includes('วางกลยุทธ์')).map(game => (
                  <GameCard key={game.id} game={game} onPlay={setActiveGame} />
                ))}
              </div>
            </section>

            {/* Section 3: กลุ่ม Phaser 2D Engine */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚡ Phaser 2D Engine
                </h2>
                <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '0.2rem 0.75rem', borderRadius: '9999px', fontWeight: '700' }}>
                  {initialGames.filter(g => g.category.includes('Phaser')).length} เกม
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.5rem'
              }}>
                {initialGames.filter(g => g.category.includes('Phaser')).map(game => (
                  <GameCard key={game.id} game={game} onPlay={setActiveGame} />
                ))}
              </div>
            </section>

            {/* Section 4: กลุ่ม Babylon 3D Engine */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🪐 Babylon 3D Engine
                </h2>
                <span style={{ fontSize: '0.8rem', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc', padding: '0.2rem 0.75rem', borderRadius: '9999px', fontWeight: '700' }}>
                  {initialGames.filter(g => g.category.includes('Babylon')).length} เกม
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.5rem'
              }}>
                {initialGames.filter(g => g.category.includes('Babylon')).map(game => (
                  <GameCard key={game.id} game={game} onPlay={setActiveGame} />
                ))}
              </div>
            </section>

            {/* Section 5: กลุ่ม Three.js 3D Engine */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🌌 Three.js & WebGPU 3D Engine
                </h2>
                <span style={{ fontSize: '0.8rem', background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#f472b6', padding: '0.2rem 0.75rem', borderRadius: '9999px', fontWeight: '700' }}>
                  {initialGames.filter(g => g.category.includes('Three.js')).length} เกม
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.5rem'
              }}>
                {initialGames.filter(g => g.category.includes('Three.js')).map(game => (
                  <GameCard key={game.id} game={game} onPlay={setActiveGame} />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredGames.map(game => (
                <GameCard key={game.id} game={game} onPlay={setActiveGame} />
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                <p style={{ fontSize: '1.2rem' }}>ไม่พบเกมที่คุณค้นหา</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '1.5rem',
        textAlign: 'center',
        color: '#64748b',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.875rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        alignItems: 'center'
      }}>
        <div>© 2026 GameDevJS Hub — Built with Next.js & Antigravity AI</div>
        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
          v{buildInfo.version} (Build #{buildInfo.build})
        </div>
      </footer>

      {/* Modal Loader */}
      <GameModal game={activeGame} onClose={() => setActiveGame(null)} />
    </div>
  );
}
