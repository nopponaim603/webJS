'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import GameModal from '@/components/GameModal';
import buildInfo from '../../public/build.json';

const initialGames = [
  {
    id: "goosl-marbles",
    title: "Goosl Glass Marbles (구슬치기)",
    category: "ปริศนา / ฟิสิกส์",
    url: "/games/goosl-marbles/index.html",
    image: "/games/goosl-marbles/thumbnail.png",
    gradient: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)"
  },
  {
      id: "emoji-match",
      title: "Emoji Match",
      category: "ปริศนา / ฝึกสมอง",
      url: "/games/emoji-match/index.html",
      image: "https://images.unsplash.com/photo-1614332287897-cdc485fa562d?w=400&h=400&fit=crop",
      gradient: "linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)"
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
      id: "tile-match",
      title: "Tile Match",
      category: "ปริศนา / จับคู่ทรีแมตช์",
      url: "/games/tile-match/index.html",
      image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop",
      gradient: "linear-gradient(135deg, #5D2A35 0%, #A04050 100%)"
    },
    {
      id: "space-shooter",
      title: "Space Shooter (Phaser 2D)",
      category: "Phaser 2D Engine",
      url: "/games/phaser-demo/index.html",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop",
      gradient: "linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)"
    },
    {
      id: "cyber-sphere",
      title: "Cyber Sphere 3D (Babylon.js)",
      category: "Babylon 3D Engine",
      url: "/games/babylon-demo/index.html",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
      gradient: "linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)"
    },
    {
      id: "3d-platformer",
      title: "Kenney 3D Platformer (Babylon.js)",
      category: "Babylon 3D Engine",
      url: "/games/3d-platformer/index.html",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85f32e?w=400&h=400&fit=crop",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
    },
    {
      id: "match-3",
      title: "Kenney Match 3 (Phaser 2D)",
      category: "Phaser 2D Engine",
      url: "/games/match3/index.html",
      image: "https://images.unsplash.com/photo-1605901309584-818e25360a67?w=400&h=400&fit=crop",
      gradient: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)"
    },
];

const categories = ["ทั้งหมด", "ปริศนา", "Phaser 2D", "Babylon 3D"];

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
          <p style={{ color: '#cbd5e1', fontSize: '1.05rem', maxWidth: '700px', lineHeight: '1.6' }}>
            ศูนย์รวมเกม HTML5, Phaser 2D และ Babylon.js 3D บนสถาปัตยกรรม Next.js App Router พร้อมรองรับ PWA ออฟไลน์ และการแสดงผลระดับพรีเมียม
          </p>
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

        {/* Games Grid */}
        <section>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
