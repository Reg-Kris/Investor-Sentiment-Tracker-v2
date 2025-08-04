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
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Build optimizations
  experimental: {
    optimizeCss: true,
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
  
  // Headers for caching and security
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
            value: 'public, max-age=300, s-maxage=600' // 5 min browser, 10 min CDN
          }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable' // 1 year for static assets
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig