import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const viewport = {
  themeColor: '#0f172a',
};

export const metadata = {
  title: 'GameDevJS Hub — Next.js & Multi-Engine Games Showcase',
  description: 'ศูนย์รวมเกม HTML5, Phaser 2D และ Babylon.js 3D บนระบบ Next.js Framework (PWA Ready)',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/assets/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GameDevJS Hub'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={inter.className}>
      <body>
        {children}
      </body>
    </html>
  );
}
