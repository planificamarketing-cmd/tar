/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // @tar/shared se distribuye como fuente TS → Next debe transpilarlo.
  transpilePackages: ['@tar/shared'],
  images: {
    // Hosts de imágenes permitidos para el optimizador de next/image.
    // Dev: media local (localhost:4000) + hosts del seed de muestra.
    // Prod: el host real de media vía NEXT_PUBLIC_MEDIA_HOSTNAME.
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: 'assets.easybroker.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      ...(process.env.NEXT_PUBLIC_MEDIA_HOSTNAME
        ? [{ protocol: 'https', hostname: process.env.NEXT_PUBLIC_MEDIA_HOSTNAME }]
        : []),
    ],
  },
};

export default nextConfig;
