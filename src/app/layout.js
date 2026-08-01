import './globals.css';

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
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
