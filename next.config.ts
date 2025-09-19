/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: [
      '@apollo/client',
      '@rainbow-me/rainbowkit',
      'wagmi',
      'viem'
    ],
  },
  webpack: (config, { isServer }) => {
    // Optimize for production
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Bundle analyzer optimization
    // config.optimization = {
    //   ...config.optimization,
    //   splitChunks: {
    //     chunks: 'all',
    //     cacheGroups: {
    //       default: {
    //         minChunks: 2,
    //         priority: -20,
    //         reuseExistingChunk: true,
    //       },
    //       vendor: {
    //         test: /[\\/]node_modules[\\/]/,
    //         name: 'vendors',
    //         priority: -10,
    //         reuseExistingChunk: true,
    //       },
    //       web3: {
    //         test: /[\\/]node_modules[\\/](wagmi|viem|@rainbow-me|@walletconnect)/,
    //         name: 'web3',
    //         priority: 10,
    //         reuseExistingChunk: true,
    //       },
    //       apollo: {
    //         test: /[\\/]node_modules[\\/]@apollo/,
    //         name: 'apollo',
    //         priority: 5,
    //         reuseExistingChunk: true,
    //       }
    //     }
    //   }
    // };

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dweb.link',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [128, 256, 384, 512],
    formats: ['image/webp', 'image/avif'],
    qualities: [40, 50, 75, 85, 90, 95], // Add quality 90 for components that use it
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days for better caching
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    loaderFile: '',
    domains: [], // Deprecated but kept for compatibility
    unoptimized: false, // Ensure images are optimized
  },
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
