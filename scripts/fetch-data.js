#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize cache with 5-minute TTL to respect API rate limits
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// API Configuration
const API_CONFIG = {
  alphaVantage: {
    key: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
    baseUrl: 'https://www.alphavantage.co/query',
    rateLimit: { requests: 5, per: 60000 } // 5 requests per minute
  },
  fred: {
    key: process.env.FRED_API_KEY || 'demo',
    baseUrl: 'https://api.stlouisfed.org/fred/series/observations',
    rateLimit: { requests: 120, per: 60000 } // 120 requests per minute
  },
  coinGecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    rateLimit: { requests: 50, per: 60000 } // 50 requests per minute for free tier
  },
  fearGreed: {
    baseUrl: 'https://api.alternative.me/fng'
  }
};

// Rate limiting tracking
const rateLimits = new Map();

class RateLimiter {
  constructor(requests, period) {
    this.requests = requests;
    this.period = period;
    this.tokens = requests;
    this.lastRefill = Date.now();
  }

  async acquire() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    // Refill tokens based on time passed
    this.tokens = Math.min(this.requests, this.tokens + (timePassed / this.period) * this.requests);
    this.lastRefill = now;

    if (this.tokens < 1) {
      const waitTime = (this.period / this.requests) * (1 - this.tokens);
      console.log(`Rate limit reached, waiting ${Math.ceil(waitTime)}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.tokens = 1;
    }
    
    this.tokens -= 1;
  }
}

// Initialize rate limiters
const limiters = {
  alphaVantage: new RateLimiter(API_CONFIG.alphaVantage.rateLimit.requests, API_CONFIG.alphaVantage.rateLimit.per),
  fred: new RateLimiter(API_CONFIG.fred.rateLimit.requests, API_CONFIG.fred.rateLimit.per),
  coinGecko: new RateLimiter(API_CONFIG.coinGecko.rateLimit.requests, API_CONFIG.coinGecko.rateLimit.per)
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      console.log(`Retrying in ${waitTime}ms...`);
      await sleep(waitTime);
    }
  }
};

// Data fetchers
class DataFetcher {
  async fetchStockData(symbol) {
    const cacheKey = `stock_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    await limiters.alphaVantage.acquire();

    const data = await retryRequest(async () => {
      const response = await axios.get(API_CONFIG.alphaVantage.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol,
          apikey: API_CONFIG.alphaVantage.key,
          outputsize: 'compact'
        },
        timeout: 10000
      });

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error(`No data available for ${symbol}`);
      }

      const dates = Object.keys(timeSeries).sort().reverse();
      const currentData = timeSeries[dates[0]];
      const previousData = timeSeries[dates[1]];

      const currentPrice = parseFloat(currentData['4. close']);
      const previousPrice = parseFloat(previousData['4. close']);
      const change = ((currentPrice - previousPrice) / previousPrice) * 100;
      
      return {
        symbol,
        price: currentPrice,
        change: change,
        volume: parseInt(currentData['5. volume']),
        timestamp: new Date().toISOString(),
        date: dates[0]
      };
    });

    cache.set(cacheKey, data);
    return data;
  }

  async fetchNewssentiment(symbol) {
    const cacheKey = `news_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    await limiters.alphaVantage.acquire();

    const data = await retryRequest(async () => {
      const response = await axios.get(API_CONFIG.alphaVantage.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbol,
          apikey: API_CONFIG.alphaVantage.key,
          limit: 50
        },
        timeout: 15000
      });

      const feed = response.data.feed || [];
      
      const sentimentData = {
        symbol,
        articles: feed.length,
        overall_sentiment_score: 0,
        overall_sentiment_label: 'Neutral',
        sentiment_breakdown: {
          bullish: 0,
          somewhat_bullish: 0,
          neutral: 0,
          somewhat_bearish: 0,
          bearish: 0
        },
        timestamp: new Date().toISOString()
      };

      if (feed.length > 0) {
        let totalScore = 0;
        feed.forEach(article => {
          const tickerSentiment = article.ticker_sentiment?.find(t => t.ticker === symbol);
          if (tickerSentiment) {
            totalScore += parseFloat(tickerSentiment.relevance_score) * parseFloat(tickerSentiment.ticker_sentiment_score);
            sentimentData.sentiment_breakdown[tickerSentiment.ticker_sentiment_label.toLowerCase()]++;
          }
        });
        
        sentimentData.overall_sentiment_score = totalScore / feed.length;
        
        // Determine overall sentiment label
        if (sentimentData.overall_sentiment_score > 0.15) {
          sentimentData.overall_sentiment_label = 'Bullish';
        } else if (sentimentData.overall_sentiment_score < -0.15) {
          sentimentData.overall_sentiment_label = 'Bearish';
        }
      }

      return sentimentData;
    });

    cache.set(cacheKey, data);
    return data;
  }

  async fetchEconomicIndicators() {
    const indicators = [
      { series: 'UNRATE', name: 'Unemployment Rate' },
      { series: 'CPIAUCSL', name: 'Consumer Price Index' },
      { series: 'FEDFUNDS', name: 'Federal Funds Rate' },
      { series: 'GDP', name: 'Gross Domestic Product' },
      { series: 'PAYEMS', name: 'Nonfarm Payrolls' }
    ];

    const data = {};
    
    for (const indicator of indicators) {
      const cacheKey = `fred_${indicator.series}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        data[indicator.series] = cached;
        continue;
      }

      await limiters.fred.acquire();

      try {
        const indicatorData = await retryRequest(async () => {
          const response = await axios.get(API_CONFIG.fred.baseUrl, {
            params: {
              series_id: indicator.series,
              api_key: API_CONFIG.fred.key,
              file_type: 'json',
              limit: 12, // Last 12 observations
              sort_order: 'desc'
            },
            timeout: 10000
          });

          const observations = response.data.observations || [];
          const validObservations = observations.filter(obs => obs.value !== '.');
          
          if (validObservations.length === 0) {
            throw new Error(`No valid data for ${indicator.series}`);
          }

          const latest = validObservations[0];
          const previous = validObservations[1];
          
          const currentValue = parseFloat(latest.value);
          const previousValue = previous ? parseFloat(previous.value) : currentValue;
          const change = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0;

          return {
            series: indicator.series,
            name: indicator.name,
            value: currentValue,
            change: change,
            date: latest.date,
            timestamp: new Date().toISOString(),
            history: validObservations.slice(0, 6).map(obs => ({
              date: obs.date,
              value: parseFloat(obs.value)
            }))
          };
        });

        data[indicator.series] = indicatorData;
        cache.set(cacheKey, indicatorData);
      } catch (error) {
        console.error(`Failed to fetch ${indicator.name}:`, error.message);
        data[indicator.series] = {
          series: indicator.series,
          name: indicator.name,
          value: null,
          change: null,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return data;
  }

  async fetchCryptoData() {
    const cryptos = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana'];
    const cacheKey = 'crypto_data';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    await limiters.coinGecko.acquire();

    const data = await retryRequest(async () => {
      const response = await axios.get(`${API_CONFIG.coinGecko.baseUrl}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          ids: cryptos.join(','),
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: true,
          price_change_percentage: '1h,24h,7d'
        },
        timeout: 10000
      });

      const cryptoData = response.data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        market_cap: coin.market_cap,
        volume_24h: coin.total_volume,
        change_1h: coin.price_change_percentage_1h_in_currency || 0,
        change_24h: coin.price_change_percentage_24h || 0,
        change_7d: coin.price_change_percentage_7d_in_currency || 0,
        sparkline: coin.sparkline_in_7d?.price || [],
        timestamp: new Date().toISOString()
      }));

      return {
        data: cryptoData,
        timestamp: new Date().toISOString(),
        total_market_cap: cryptoData.reduce((sum, coin) => sum + (coin.market_cap || 0), 0)
      };
    });

    cache.set(cacheKey, data);
    return data;
  }

  async fetchFearGreedIndex() {
    const cacheKey = 'fear_greed';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await retryRequest(async () => {
      const response = await axios.get(API_CONFIG.fearGreed.baseUrl, {
        params: { limit: 7 },
        timeout: 10000
      });

      const fngData = response.data.data || [];
      const current = fngData[0];
      
      return {
        value: parseInt(current.value),
        classification: current.value_classification,
        timestamp: new Date(parseInt(current.timestamp) * 1000).toISOString(),
        history: fngData.map(item => ({
          value: parseInt(item.value),
          classification: item.value_classification,
          date: new Date(parseInt(item.timestamp) * 1000).toISOString()
        }))
      };
    });

    cache.set(cacheKey, data);
    return data;
  }

  async fetchVIXData() {
    const cacheKey = 'vix_data';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    await limiters.alphaVantage.acquire();

    const data = await retryRequest(async () => {
      const response = await axios.get(API_CONFIG.alphaVantage.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: 'VIX',
          apikey: API_CONFIG.alphaVantage.key,
          outputsize: 'compact'
        },
        timeout: 10000
      });

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error('No VIX data available');
      }

      const dates = Object.keys(timeSeries).sort().reverse();
      const currentData = timeSeries[dates[0]];
      const previousData = timeSeries[dates[1]];

      const currentVIX = parseFloat(currentData['4. close']);
      const previousVIX = parseFloat(previousData['4. close']);
      const change = currentVIX - previousVIX;

      return {
        value: currentVIX,
        change: change,
        change_percent: (change / previousVIX) * 100,
        classification: currentVIX > 30 ? 'High Volatility' : currentVIX > 20 ? 'Medium Volatility' : 'Low Volatility',
        history: dates.slice(0, 7).map(date => ({
          date,
          value: parseFloat(timeSeries[date]['4. close'])
        })),
        timestamp: new Date().toISOString()
      };
    });

    cache.set(cacheKey, data);
    return data;
  }
}

// Main execution function
async function fetchAllData() {
  console.log('Starting data fetch process...');
  const fetcher = new DataFetcher();
  const results = {};

  try {
    // Stock symbols to fetch
    const stockSymbols = ['SPY', 'QQQ', 'IWM', 'DIA'];
    
    console.log('Fetching stock data...');
    results.stocks = {};
    for (const symbol of stockSymbols) {
      try {
        results.stocks[symbol] = await fetcher.fetchStockData(symbol);
        console.log(`✓ Fetched data for ${symbol}`);
      } catch (error) {
        console.error(`✗ Failed to fetch ${symbol}:`, error.message);
        results.stocks[symbol] = { error: error.message, timestamp: new Date().toISOString() };
      }
    }

    console.log('Fetching news sentiment...');
    results.news_sentiment = {};
    for (const symbol of ['SPY', 'AAPL', 'MSFT', 'TSLA']) {
      try {
        results.news_sentiment[symbol] = await fetcher.fetchNewssentiment(symbol);
        console.log(`✓ Fetched news sentiment for ${symbol}`);
      } catch (error) {
        console.error(`✗ Failed to fetch news sentiment for ${symbol}:`, error.message);
        results.news_sentiment[symbol] = { error: error.message, timestamp: new Date().toISOString() };
      }
    }

    console.log('Fetching economic indicators...');
    try {
      results.economic_indicators = await fetcher.fetchEconomicIndicators();
      console.log('✓ Fetched economic indicators');
    } catch (error) {
      console.error('✗ Failed to fetch economic indicators:', error.message);
      results.economic_indicators = { error: error.message, timestamp: new Date().toISOString() };
    }

    console.log('Fetching cryptocurrency data...');
    try {
      results.crypto = await fetcher.fetchCryptoData();
      console.log('✓ Fetched cryptocurrency data');
    } catch (error) {
      console.error('✗ Failed to fetch cryptocurrency data:', error.message);
      results.crypto = { error: error.message, timestamp: new Date().toISOString() };
    }

    console.log('Fetching Fear & Greed Index...');
    try {
      results.fear_greed = await fetcher.fetchFearGreedIndex();
      console.log('✓ Fetched Fear & Greed Index');
    } catch (error) {
      console.error('✗ Failed to fetch Fear & Greed Index:', error.message);
      results.fear_greed = { error: error.message, timestamp: new Date().toISOString() };
    }

    console.log('Fetching VIX data...');
    try {
      results.vix = await fetcher.fetchVIXData();
      console.log('✓ Fetched VIX data');
    } catch (error) {
      console.error('✗ Failed to fetch VIX data:', error.message);
      results.vix = { error: error.message, timestamp: new Date().toISOString() };
    }

    // Add metadata
    results.metadata = {
      last_updated: new Date().toISOString(),
      fetch_duration: Date.now() - process.startTime,
      cache_stats: {
        keys: cache.keys().length,
        hits: cache.getStats().hits,
        misses: cache.getStats().misses
      }
    };

    // Save to file
    const outputPath = path.resolve(__dirname, '../public/data/market-data.json');
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeJSON(outputPath, results, { spaces: 2 });
    
    console.log('✓ Data fetch completed successfully');
    console.log(`✓ Results saved to: ${outputPath}`);
    console.log(`✓ Total cache keys: ${cache.keys().length}`);
    
    return results;

  } catch (error) {
    console.error('✗ Data fetch failed:', error);
    throw error;
  }
}

// Error handling and execution
process.startTime = Date.now();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllData()
    .then(() => {
      console.log('Data fetch process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Data fetch process failed:', error);
      process.exit(1);
    });
}

export default fetchAllData;