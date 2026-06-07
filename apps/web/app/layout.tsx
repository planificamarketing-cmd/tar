import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="es">
      <body className="bg-canvas text-navy antialiased">{children}</body>
    </html>
  );
}
