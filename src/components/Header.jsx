'use client';

import { useState, useEffect } from 'react';

export default function Header({ searchKeyword, setSearchKeyword }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('[PWA Next.js] Service Worker registered:', reg.scope))
          .catch(err => console.warn('[PWA Next.js] SW registration error:', err));
      });
    }

    // PWA Install Prompt Listener
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User installed the app');
      }
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    });
  };

  return (
    <header className="sticky top-0 z-50 glass-panel px-6 py-4 flex items-center justify-between shadow-lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <svg width="40" height="32" viewBox="0 0 60 40" fill="none">
          <path d="M10 5L20 5C25 5 28 8 28 13C28 18 25 21 20 21L10 21L10 5Z" fill="#00F2FE"/>
          <circle cx="45" cy="13" r="8" fill="#4FACFE"/>
          <rect x="10" y="25" width="18" height="10" rx="5" fill="#00F2FE"/>
        </svg>
        <span className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
          GameDevJS Hub <span style={{ fontSize: '0.8rem', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)' }}>Next.js</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="🔍 ค้นหาเกม..." 
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '9999px',
            padding: '0.5rem 1.25rem',
            color: '#fff',
            outline: 'none',
            fontSize: '0.9rem',
            width: '220px'
          }}
        />

        {showInstallBtn && (
          <button 
            onClick={handleInstallClick}
            style={{
              background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
              color: '#0f172a',
              fontWeight: '700',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(0, 242, 254, 0.3)'
            }}
          >
            📲 ติดตั้งแอป
          </button>
        )}
      </div>
    </header>
  );
}
