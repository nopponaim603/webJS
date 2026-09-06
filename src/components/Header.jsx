'use client';

import PWAInstallButton from '@/components/PWAInstallButton';

export default function Header({ searchKeyword, setSearchKeyword }) {
  return (
    <header suppressHydrationWarning style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 1.25rem',
      background: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      flexWrap: 'wrap',
      gap: '0.75rem'
    }}>
      {/* Brand / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 'max-content' }}>
        <svg width="32" height="26" viewBox="0 0 60 40" fill="none">
          <path d="M10 5L20 5C25 5 28 8 28 13C28 18 25 21 20 21L10 21L10 5Z" fill="#00F2FE"/>
          <circle cx="45" cy="13" r="8" fill="#4FACFE"/>
          <rect x="10" y="25" width="18" height="10" rx="5" fill="#00F2FE"/>
        </svg>
        <span className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
          GameDevJS Hub <span style={{ fontSize: '0.7rem', color: '#38bdf8', padding: '2px 6px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', fontWeight: '600' }}>PWA</span>
        </span>
      </div>

      {/* Right Actions: Search & PWA Install Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: '1 1 auto', justifyContent: 'flex-end', minWidth: '240px' }}>
        <input 
          type="text" 
          placeholder="🔍 ค้นหาเกม..." 
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '9999px',
            padding: '0.45rem 1rem',
            color: '#fff',
            outline: 'none',
            fontSize: '0.85rem',
            flex: '1 1 140px',
            maxWidth: '240px',
            minWidth: '120px'
          }}
        />

        <PWAInstallButton />
      </div>
    </header>
  );
}
