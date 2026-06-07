/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // @tar/shared se distribuye como fuente TS → Next debe transpilarlo.
  transpilePackages: ['@tar/shared'],
  images: {
    // El dominio de media se añade en la Fase B (MEDIA_BASE_URL).
    remotePatterns: [],
  },
};

export default nextConfig;
