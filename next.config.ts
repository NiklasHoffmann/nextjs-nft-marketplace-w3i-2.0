/** @type {import('next').NextConfig} */

const { withSentryConfig } = require('@sentry/nextjs');

// Bundle analyzer for production build analysis (only in dev)
let withBundleAnalyzer = (config: any) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // Bundle analyzer not installed (production build)
}

const defaultCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for WalletConnect/Apollo in dev/prod
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
].join('; ');

const strictCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
].join('; ');

const cspMode = process.env.CSP_MODE || 'relaxed';
const cspValue = cspMode === 'strict' ? strictCsp : defaultCsp;

const nextConfig: import('next').NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,

  // Skip ESLint during builds (deprecated options in Next.js 15.5.9)
  eslint: {
    ignoreDuringBuilds: true,
  },

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
    // Suppress MetaMask SDK React Native warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@metamask\/sdk/,
        message: /Can't resolve '@react-native-async-storage\/async-storage'/,
      },
    ];

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
        moduleIds: 'deterministic'
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
    qualities: [35, 40, 72, 75, 85, 90, 95],
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
            key: process.env.CSP_REPORT_ONLY === 'true'
              ? 'Content-Security-Policy-Report-Only'
              : 'Content-Security-Policy',
            value: cspValue,
          },
          ...(process.env.CSP_REPORT_URI
            ? [{
                key: 'Report-To',
                value: JSON.stringify({
                  group: 'csp-endpoint',
                  max_age: 10886400,
                  endpoints: [{ url: process.env.CSP_REPORT_URI }],
                  include_subdomains: true,
                }),
              }]
            : []),
          ...(process.env.CSP_REPORT_URI
            ? [{
                key: 'Reporting-Endpoints',
                value: `csp-endpoint=\"${process.env.CSP_REPORT_URI}\"`,
              }]
            : []),
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

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};

const sentryOptions = {
  hideSourceMaps: true,
  disableLogger: true,
};

const configWithSentry = withSentryConfig(nextConfig, sentryWebpackPluginOptions, sentryOptions);

export default withBundleAnalyzer(configWithSentry);
