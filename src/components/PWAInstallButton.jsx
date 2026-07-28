'use client';

import { useState, useEffect } from 'react';

export default function PWAInstallButton({ variant = 'default' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Detect standalone PWA mode
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
      setShowGuideModal(true);
    }
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const isHero = variant === 'hero';

  return (
    <>
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
          padding: isHero ? '0.65rem 1.4rem' : '0.45rem 0.9rem',
          borderRadius: '9999px',
          cursor: 'pointer',
          fontSize: isHero ? '0.95rem' : '0.825rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          whiteSpace: 'nowrap',
          boxShadow: isStandalone ? 'none' : isHero ? '0 6px 20px rgba(0, 242, 254, 0.4)' : '0 4px 12px rgba(0, 242, 254, 0.3)',
          transition: 'all 0.2s ease',
          flexShrink: 0
        }}
      >
        <span>{isStandalone ? '✅' : '📲'}</span>
        <span>{isStandalone ? 'ติดตั้งแล้ว' : isHero ? 'ติดตั้งแอปเล่นออฟไลน์ (PWA)' : 'ติดตั้ง PWA'}</span>
      </button>

      {/* Guide Modal */}
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
