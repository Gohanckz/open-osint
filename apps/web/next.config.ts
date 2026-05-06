import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Standalone output: Docker copies only what's needed (smaller images)
  output: 'standalone',
  // En el monorepo, le decimos al build que el "tracing root" es la raíz del repo
  outputFileTracingRoot: process.cwd().replace(/[\\/]apps[\\/]web$/, ''),
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
  transpilePackages: ['@hilo/ui', '@hilo/canvas', '@hilo/shared', '@hilo/config'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  webpack: (config) => {
    // Allow `import './foo.js'` to resolve to `./foo.ts` in workspace packages.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default config;
