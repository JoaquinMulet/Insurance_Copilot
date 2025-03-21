/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permitir importaciones con extensiones .jsx
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Si experimentas problemas de ESM con node-fetch, utiliza estos transpilePackages
  transpilePackages: ['node-fetch'],
  // Activamos los logs del servidor para depuración
  serverRuntimeConfig: {
    logging: true,
  }
};

module.exports = nextConfig;