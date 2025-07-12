/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/Investor-Sentiment-Tracker-v2' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Investor-Sentiment-Tracker-v2/' : '',
}

module.exports = nextConfig