// Configuration and constants for data fetching
export const CONFIG = {
  alphaVantageKey: process.env.ALPHA_VANTAGE_KEY || 'demo',
  fredApiKey: process.env.FRED_API_KEY || 'demo',
  rapidApiKey: process.env.RAPIDAPI_KEY || 'demo',
  requestTimeout: 15000, // 15 seconds
  rateLimitDelay: 2000, // 2 seconds between requests
  maxFailures: 3,
};

export const CACHE_DURATIONS = {
  fearGreed: 1800000, // 30 minutes
  options: 900000, // 15 minutes
  stocks: 300000, // 5 minutes during market hours
  default: 3600000, // 1 hour
};

export const SYMBOLS = {
  etfs: ['SPY', 'QQQ', 'IWM'],
  basePrices: { SPY: 450, QQQ: 380, IWM: 200 },
  baseRatios: { SPY: 0.9, QQQ: 0.8, IWM: 1.1 },
};

export const API_ENDPOINTS = {
  yahoo: [
    'https://query1.finance.yahoo.com/v7/finance/options/',
    'https://query2.finance.yahoo.com/v7/finance/options/',
  ],
  fearGreed: [
    'https://fear-and-greed-index.p.rapidapi.com/v1/fgi',
  ],
  vix: 'https://query1.finance.yahoo.com/v8/finance/chart/^VIX?range=1mo&interval=1d',
};