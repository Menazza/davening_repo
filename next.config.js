/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@stackframe/stack'],
  // Enable experimental features for faster compilation
  experimental: {
    optimizePackageImports: ['date-fns'],
  },
  // Reduce file watching overhead
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Client-side webpack config
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Optimize file watching in development
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Enable polling for OneDrive compatibility (check every 1 second)
        aggregateTimeout: 300, // Delay rebuild until 300ms after last change
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/.git/**',
        ],
      };
      
      // Speed up compilation - disable expensive optimizations in dev
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        moduleIds: 'named', // Faster builds
        chunkIds: 'named',
      };
      
      // Faster rebuilds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;

