'use client';

import { useEffect, useState, useRef } from 'react';
import buildInfo from '../../public/build.json';

export default function GameModal({ game, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (modalRef.current?.requestFullscreen) {
        modalRef.current.requestFullscreen().catch(err => {
          console.error("Error attempting to enable fullscreen:", err);
        });
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  if (!game) return null;

  return (
    <div 
      ref={modalRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(7, 9, 19, 0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0' : '0.75rem'
      }}
    >
      <div style={{
        background: '#0f172a',
        borderRadius: isFullscreen ? '0' : '16px',
        border: isFullscreen ? 'none' : '1px solid rgba(56, 189, 248, 0.25)',
        width: isFullscreen ? '100vw' : '96vw',
        maxWidth: isFullscreen ? '100vw' : '1440px',
        height: isFullscreen ? '100vh' : '94vh',
        maxHeight: isFullscreen ? '100vh' : '96vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 242, 254, 0.2)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '0.75rem 1.25rem',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎮 {game.title}</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{game.category}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '0.85rem',
                fontWeight: '600',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              {isFullscreen ? '🗗 Window' : '⛶ Fullscreen'}
            </button>
            <button 
              onClick={onClose}
              title="Close Modal"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: '1.1rem',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content - Iframe (Stretches to fill vertical height) */}
        <div style={{ flex: 1, width: '100%', background: '#000', position: 'relative' }}>
          <iframe 
            ref={iframeRef}
            src={game.url} 
            title={game.title}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="fullscreen; autoplay; gamepad; clipboard-write; clipboard-read; pointer-lock"
            onLoad={() => {
              try {
                iframeRef.current?.focus();
                iframeRef.current?.contentWindow?.focus();
              } catch (err) {}
            }}
          />
        </div>

        {/* Modal Footer - Build Info */}
        <div style={{
          padding: '0.4rem 1.25rem',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          color: '#64748b',
          flexShrink: 0
        }}>
          <span>Build: v{buildInfo.version} #{buildInfo.build}</span>
          <span>{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}
