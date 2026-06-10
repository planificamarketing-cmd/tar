import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display, DM_Mono } from 'next/font/google';
import './globals.css';

// Familia tipográfica "DM" confirmada por el cliente (ronda 2 del prototipo):
// DM Sans (interfaz), DM Serif Display (títulos), DM Mono (cifras). Self-hosted
// vía next/font → sin CDN, sin bloquear el LCP.
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TAR Internacional',
  description: 'Portal inmobiliario TAR Internacional.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} ${dmSerif.variable} ${dmMono.variable}`}
    >
      <body className="bg-canvas text-navy antialiased">{children}</body>
    </html>
  );
}
