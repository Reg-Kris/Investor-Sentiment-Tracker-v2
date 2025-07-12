export const API_CONFIG = {
  ALPHA_VANTAGE_KEY: 'demo',
  CORS_PROXY: 'https://api.allorigins.win/raw?url=',
  
  ENDPOINTS: {
    yahoo: [
      'https://query1.finance.yahoo.com/v7/finance/options/',
      'https://query2.finance.yahoo.com/v7/finance/options/',
    ],
    fearGreed: 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
    fred: 'https://api.stlouisfed.org/fred/series/observations',
  },
  
  SYMBOLS: ['SPY', 'QQQ', 'IWM'],
};