'use client';

export default function GameCard({ game, onPlay }) {
  return (
    <div 
      onClick={() => onPlay(game)}
      style={{
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 242, 254, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ height: '160px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <img 
          src={game.image} 
          alt={game.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 60%)'
        }} />
        <span style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          color: '#38bdf8',
          fontSize: '0.75rem',
          fontWeight: '600',
          padding: '4px 10px',
          borderRadius: '9999px',
          border: '1px solid rgba(56, 189, 248, 0.3)'
        }}>
          {game.category}
        </span>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
          {game.title}
        </h3>
        <button style={{
          marginTop: '0.5rem',
          background: game.gradient || 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
          color: '#0f172a',
          fontWeight: '700',
          fontSize: '0.875rem',
          padding: '0.6rem 1rem',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          ▶️ เล่นเกม
        </button>
      </div>
    </div>
  );
}
