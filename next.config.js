/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  basePath: process.env.NODE_ENV === 'production' ? '/Investor-Sentiment-Tracker-v2' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Investor-Sentiment-Tracker-v2/' : '',
  
  // Add build-time environment variables for cache busting
  env: {
    BUILD_TIMESTAMP: Date.now().toString(),
    CACHE_VERSION: Date.now().toString(),
    BUILD_ID: process.env.GITHUB_SHA || Date.now().toString(),
    DEPLOYMENT_ENV: process.env.NODE_ENV || 'development',
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Build optimizations
  experimental: {
    optimizePackageImports: [
      '@tremor/react',
      'lucide-react',
      'framer-motion'
    ],
  },
  
  // Bundle analyzer (conditionally enabled)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-report.html'
          })
        );
      }
      return config;
    }
  }),
  
  // Note: Headers are not supported with output: 'export' for GitHub Pages
  // GitHub Pages will handle caching automatically
  
  // Development headers (only work in dev/serverless mode)
  ...(!process.env.NODE_ENV || process.env.NODE_ENV === 'development' ? {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY'
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin'
            }
          ]
        },
        {
          source: '/data/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate'
            }
          ]
        }
      ];
    }
  } : {})
}

module.exports = nextConfig