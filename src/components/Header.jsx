'use client';

import { useState, useEffect } from 'react';

export default function Header({ searchKeyword, setSearchKeyword }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsStandalone(true);
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('[PWA Next.js] Service Worker registered:', reg.scope))
          .catch(err => console.warn('[PWA Next.js] SW registration error:', err));
      });
    }

    // Listen for PWA Install Prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (isStandalone) {
      triggerToast('✅ คุณกำลังใช้งานในโหมดแอป PWA เรียบร้อยแล้ว');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          triggerToast('🎉 ขอบคุณสำหรับการติดตั้ง GameDevJS Hub!');
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
      });
    } else {
      // Show PWA Instructions Modal for iOS / Desktop / Manual install
      setShowGuideModal(true);
    }
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.85rem 1.75rem',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <svg width="36" height="28" viewBox="0 0 60 40" fill="none">
            <path d="M10 5L20 5C25 5 28 8 28 13C28 18 25 21 20 21L10 21L10 5Z" fill="#00F2FE"/>
            <circle cx="45" cy="13" r="8" fill="#4FACFE"/>
            <rect x="10" y="25" width="18" height="10" rx="5" fill="#00F2FE"/>
          </svg>
          <span className="gradient-text" style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
            GameDevJS Hub <span style={{ fontSize: '0.75rem', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', fontWeight: '600' }}>v1.8 PWA</span>
          </span>
        </div>

        {/* Right Actions: Search & Install PWA Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <input 
            type="text" 
            placeholder="🔍 ค้นหาเกม..." 
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '9999px',
              padding: '0.5rem 1.15rem',
              color: '#fff',
              outline: 'none',
              fontSize: '0.875rem',
              width: '210px',
              transition: 'border-color 0.2s ease'
            }}
          />

          {/* PWA Install Button */}
          <button 
            onClick={handleInstallClick}
            title={isStandalone ? 'ใช้งานในโหมดแอป PWA' : 'ติดตั้งแอปเพื่อเล่นออฟไลน์'}
            style={{
              background: isStandalone 
                ? 'rgba(52, 211, 153, 0.15)'
                : 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
              color: isStandalone ? '#34d399' : '#0f172a',
              border: isStandalone ? '1px solid rgba(52, 211, 153, 0.4)' : 'none',
              fontWeight: '700',
              padding: '0.5rem 1.1rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: isStandalone ? 'none' : '0 4px 14px rgba(0, 242, 254, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{isStandalone ? '✅' : '📲'}</span>
            <span>{isStandalone ? 'ติดตั้งแล้ว' : 'ติดตั้งแอป (PWA)'}</span>
          </button>
        </div>
      </header>

      {/* PWA Installation Guide Modal */}
      {showGuideModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '24px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            width: '100%',
            maxWidth: '480px',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 242, 254, 0.25)',
            color: '#f8fafc',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowGuideModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📲</div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#00F2FE' }}>
                วิธีติดตั้งแอป GameDevJS Hub
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                ติดตั้งเป็นแอปเพื่อเข้าเล่นเกมได้ทันทีจากหน้าจอหลักและรองรับออฟไลน์
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <strong style={{ color: '#38bdf8' }}>📱 สำหรับ Android / Chrome / Edge:</strong>
                <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginTop: '0.25rem' }}>
                  กดปุ่มตัวเลือกเมนู <strong>⋮ (3 จุด)</strong> ด้านขวาบน ➔ เลือก <strong>"ติดตั้งแอป (Install App)"</strong> หรือ <strong>"เพิ่มไปยังหน้าจอหลัก"</strong>
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <strong style={{ color: '#ec4899' }}>🍎 สำหรับ iOS (Safari):</strong>
                <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginTop: '0.25rem' }}>
                  กดปุ่มแชร์ <strong>📤 (Share)</strong> ด้านล่างจอ ➔ เลื่อนลงแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"</strong>
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <strong style={{ color: '#34d399' }}>💻 สำหรับคอมพิวเตอร์ Desktop:</strong>
                <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginTop: '0.25rem' }}>
                  คลิกไอคอนติดตั้ง <strong>📲 (Install)</strong> ที่บริเวณด้านขวาของช่องกรอกที่อยู่เว็บ (Address Bar)
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowGuideModal(false)}
              style={{
                width: '100%',
                marginTop: '1.5rem',
                background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
                color: '#0f172a',
                fontWeight: '800',
                padding: '0.75rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 110,
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#38bdf8',
          padding: '0.75rem 1.5rem',
          borderRadius: '9999px',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
          fontSize: '0.9rem',
          fontWeight: '700'
        }}>
          {toastMessage}
        </div>
      )}
    </>
  );
}
