/** @type {import('next').NextConfig} */

// Bundle analyzer for production build analysis (only in dev)
let withBundleAnalyzer = (config: any) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // Bundle analyzer not installed (production build)
}

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
      'viem',
      '@tanstack/react-query'
    ],
  },

  webpack: (config, { isServer, dev }) => {
    // Optimize for production
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Ignore React Native dependencies (MetaMask SDK)
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
        'react-native': false,
      };
    }

    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              reuseExistingChunk: true,
            },
            web3: {
              test: /[\\/]node_modules[\\/](wagmi|viem|@rainbow-me|@walletconnect)/,
              name: 'web3',
              priority: 10,
              reuseExistingChunk: true,
            },
            apollo: {
              test: /[\\/]node_modules[\\/](@apollo|graphql)/,
              name: 'apollo',
              priority: 5,
              reuseExistingChunk: true,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)/,
              name: 'react',
              priority: 15,
              reuseExistingChunk: true,
            },
          }
        }
      };
    }

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
        hostname: 'dweb.link',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.w3s.link',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'nftstorage.link',
        port: '',
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [128, 256, 384, 512],
    qualities: [40, 75, 85, 90, 95],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
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
          {
            key: 'Content-Security-Policy',
            // Secure CSP that allows necessary scripts for Web3/React
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for WalletConnect/Apollo
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https:",
            ].join('; '),
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
        // Cache Next.js optimized images for 30 days
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400, immutable',
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

export default withBundleAnalyzer(nextConfig);
