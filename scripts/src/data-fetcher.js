import fetch from 'node-fetch';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { subDays, format } from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../public/data');
const CACHE_DIR = join(DATA_DIR, 'cache');

// Ensure directories exist
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(CACHE_DIR, { recursive: true });

class MarketDataFetcher {
  constructor() {
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_KEY || 'demo';
    this.fredApiKey = process.env.FRED_API_KEY || 'demo';
    this.requestTimeout = 15000; // 15 seconds
    this.rateLimitDelay = 2000; // 2 seconds between requests
    this.circuitBreaker = new Map(); // Track failed APIs
    this.maxFailures = 3;
    console.log('🔧 Data fetcher initialized with robust error handling');
  }

  async fetchWithRetry(url, retries = 3, cacheKey = null) {
    // Check circuit breaker
    if (this.isCircuitOpen(url)) {
      console.warn(`⚡ Circuit breaker open for ${url}`);
      throw new Error('Circuit breaker open');
    }

    // Try cache first if available
    if (cacheKey) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log(`📦 Using cached data for ${cacheKey}`);
        return cached;
      }
    }

    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.requestTimeout);
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SentimentBot/1.0)',
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker(url);
        
        // Cache successful response
        if (cacheKey) {
          this.saveToCache(cacheKey, data);
        }
        
        return data;
      } catch (error) {
        console.warn(`⚠️  Attempt ${i + 1}/${retries} failed for ${url}:`, error.message);
        
        // Record failure
        this.recordFailure(url);
        
        if (i === retries - 1) {
          console.error(`❌ All attempts failed for ${url}`);
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = (2000 * Math.pow(2, i)) + (Math.random() * 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async fetchFearGreedIndex() {
    try {
      console.log('📊 Fetching Fear & Greed Index...');
      
      // Try alternative endpoints without CORS proxy
      const endpoints = [
        'https://fear-and-greed-index.p.rapidapi.com/v1/fgi',
        // Fallback to a simpler approach using cached or mock data
      ];
      
      let data = null;
      for (const endpoint of endpoints) {
        try {
          data = await this.fetchWithRetry(endpoint, 2, 'fear-greed');
          break;
        } catch (error) {
          console.warn(`Fear & Greed endpoint failed: ${endpoint}`);
          continue;
        }
      }
      
      if (!data) {
        console.warn('🔄 Using cached or mock Fear & Greed data');
        return this.getMockFearGreed();
      }
      
      // Handle different response formats
      let historical;
      if (data.fear_and_greed_historical?.data) {
        historical = data.fear_and_greed_historical.data
          .slice(0, 30)
          .map(point => ({
            date: new Date(point.x).toISOString().split('T')[0],
            value: Math.round(point.y * 100) / 100,
            rating: point.rating
          }));
      } else {
        // Generate historical data from current value
        const currentValue = data.fgi?.value || 50;
        historical = this.generateHistoricalFromCurrent(currentValue, 'fear-greed');
      }

      return {
        current: historical[0],
        historical,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Fear & Greed fetch completely failed:', error.message);
      return this.getMockFearGreed();
    }
  }

  async fetchStockData(symbol) {
    try {
      console.log(`📈 Fetching ${symbol} data...`);
      
      // Multiple fallback endpoints
      const endpoints = [
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${this.alphaVantageKey}`,
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`,
        // Add more free alternatives here
      ];
      
      for (const [index, endpoint] of endpoints.entries()) {
        try {
          const data = await this.fetchWithRetry(endpoint, 2, `${symbol}-${index}`);
          
          // Parse different response formats
          if (data['Time Series (Daily)']) {
            // Alpha Vantage format
            return this.parseAlphaVantageData(data, symbol);
          } else if (data.chart?.result?.[0]) {
            // Yahoo Finance format
            return this.parseYahooFinanceData(data, symbol);
          }
        } catch (error) {
          console.warn(`${symbol} endpoint ${index + 1} failed:`, error.message);
          continue;
        }
      }
      
      throw new Error(`All ${symbol} endpoints failed`);
    } catch (error) {
      console.error(`❌ ${symbol} fetch completely failed:`, error.message);
      return this.getMockStockData(symbol);
    }
  }

  async fetchVixData() {
    try {
      console.log('📉 Fetching VIX data...');
      const data = await this.fetchWithRetry(
        `https://api.stlouisfed.org/fred/series/observations?series_id=VIXCLS&api_key=${this.fredApiKey}&file_type=json&limit=30&sort_order=desc`
      );

      const historical = data.observations
        .filter(obs => obs.value !== '.')
        .map(obs => ({
          date: obs.date,
          value: parseFloat(obs.value)
        }));

      return {
        current: historical[0],
        historical,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('VIX fetch failed:', error.message);
      return this.getMockVixData();
    }
  }

  async fetchOptionsData(symbol) {
    try {
      console.log(`📋 Fetching ${symbol} options data...`);
      const data = await this.fetchWithRetry(
        `${this.corsProxy}https://query1.finance.yahoo.com/v7/finance/options/${symbol}`
      );

      const optionChain = data.optionChain.result[0];
      const calls = optionChain.options[0].calls || [];
      const puts = optionChain.options[0].puts || [];

      const totalCallVolume = calls.reduce((sum, call) => sum + (call.volume || 0), 0);
      const totalPutVolume = puts.reduce((sum, put) => sum + (put.volume || 0), 0);
      const putCallRatio = totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 1;

      return {
        symbol,
        putCallRatio: Math.round(putCallRatio * 100) / 100,
        totalCallVolume,
        totalPutVolume,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`${symbol} options fetch failed:`, error.message);
      return {
        symbol,
        putCallRatio: 0.8 + Math.random() * 0.4,
        totalCallVolume: Math.floor(Math.random() * 100000),
        totalPutVolume: Math.floor(Math.random() * 80000),
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Circuit breaker methods
  isCircuitOpen(url) {
    const failures = this.circuitBreaker.get(url) || 0;
    return failures >= this.maxFailures;
  }

  recordFailure(url) {
    const failures = this.circuitBreaker.get(url) || 0;
    this.circuitBreaker.set(url, failures + 1);
  }

  resetCircuitBreaker(url) {
    this.circuitBreaker.delete(url);
  }

  // Cache management
  getFromCache(key) {
    try {
      const cachePath = join(CACHE_DIR, `${key}.json`);
      if (!existsSync(cachePath)) return null;
      
      const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
      const age = Date.now() - new Date(cached.timestamp).getTime();
      
      // Cache valid for 1 hour
      if (age < 3600000) {
        return cached.data;
      }
      
      return null;
    } catch (error) {
      console.warn(`Cache read failed for ${key}:`, error.message);
      return null;
    }
  }

  saveToCache(key, data) {
    try {
      const cachePath = join(CACHE_DIR, `${key}.json`);
      const cached = {
        timestamp: new Date().toISOString(),
        data
      };
      writeFileSync(cachePath, JSON.stringify(cached, null, 2));
    } catch (error) {
      console.warn(`Cache write failed for ${key}:`, error.message);
    }
  }

  // Data parsing methods
  parseAlphaVantageData(data, symbol) {
    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) throw new Error('Invalid Alpha Vantage data format');

    const historical = Object.entries(timeSeries)
      .slice(0, 30)
      .map(([date, values]) => ({
        date,
        price: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
        change: parseFloat(values['4. close']) - parseFloat(values['1. open'])
      }));

    const current = historical[0];
    const previous = historical[1];
    const changePercent = previous ? ((current.price - previous.price) / previous.price) * 100 : 0;

    return {
      symbol,
      current: { ...current, changePercent: Math.round(changePercent * 100) / 100 },
      historical,
      lastUpdated: new Date().toISOString()
    };
  }

  parseYahooFinanceData(data, symbol) {
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;
    const volumes = result.indicators.quote[0].volume;
    const opens = result.indicators.quote[0].open;

    const historical = timestamps.slice(-30).map((timestamp, index) => {
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      return {
        date,
        price: Math.round(closes[index] * 100) / 100,
        volume: volumes[index] || 0,
        change: closes[index] - opens[index]
      };
    }).reverse();

    const current = historical[0];
    const previous = historical[1];
    const changePercent = previous ? ((current.price - previous.price) / previous.price) * 100 : 0;

    return {
      symbol,
      current: { ...current, changePercent: Math.round(changePercent * 100) / 100 },
      historical,
      lastUpdated: new Date().toISOString()
    };
  }

  generateHistoricalFromCurrent(currentValue, type) {
    return Array.from({ length: 30 }, (_, i) => {
      const variance = type === 'fear-greed' ? 15 : 5;
      const value = currentValue + (Math.random() - 0.5) * variance;
      return {
        date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
        value: Math.round(Math.max(0, Math.min(100, value)) * 100) / 100,
        rating: type === 'fear-greed' ? 'Neutral' : undefined
      };
    });
  }

  // Mock data generators for fallback
  getMockFearGreed() {
    const historical = Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      value: Math.round((30 + Math.random() * 40) * 100) / 100,
      rating: 'Neutral'
    }));

    return {
      current: historical[0],
      historical,
      lastUpdated: new Date().toISOString()
    };
  }

  getMockStockData(symbol) {
    const basePrices = { SPY: 450, QQQ: 380, IWM: 200 };
    const basePrice = basePrices[symbol] || 400;
    
    const historical = Array.from({ length: 30 }, (_, i) => {
      const price = basePrice + (Math.random() - 0.5) * 20;
      return {
        date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
        price: Math.round(price * 100) / 100,
        volume: Math.floor(50000000 + Math.random() * 50000000),
        change: (Math.random() - 0.5) * 10
      };
    });

    const current = historical[0];
    const changePercent = (Math.random() - 0.5) * 4;

    return {
      symbol,
      current: { ...current, changePercent: Math.round(changePercent * 100) / 100 },
      historical,
      lastUpdated: new Date().toISOString()
    };
  }

  getMockVixData() {
    const historical = Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      value: Math.round((15 + Math.random() * 25) * 100) / 100
    }));

    return {
      current: historical[0],
      historical,
      lastUpdated: new Date().toISOString()
    };
  }

  getMockOptionsData(symbol) {
    const baseRatios = { SPY: 0.9, QQQ: 0.8, IWM: 1.1 };
    const baseRatio = baseRatios[symbol] || 0.9;
    
    return {
      symbol,
      putCallRatio: Math.round((baseRatio + (Math.random() - 0.5) * 0.3) * 100) / 100,
      totalCallVolume: Math.floor(80000 + Math.random() * 40000),
      totalPutVolume: Math.floor(70000 + Math.random() * 35000),
      lastUpdated: new Date().toISOString()
    };
  }

  async fetchAllData() {
    console.log('🚀 Starting robust market data collection...');
    
    // Staggered execution to avoid rate limits
    const results = {
      lastUpdated: new Date().toISOString(),
      generatedAt: new Date().toISOString()
    };
    
    try {
      // Phase 1: Core market data (staggered)
      console.log('🔄 Phase 1: Fetching core market indicators...');
      
      results.fearGreed = await this.fetchFearGreedIndex();
      await this.sleep(this.rateLimitDelay);
      
      results.spy = await this.fetchStockData('SPY');
      await this.sleep(this.rateLimitDelay);
      
      results.vix = await this.fetchVixData();
      await this.sleep(this.rateLimitDelay);
      
      // Phase 2: Additional ETFs (staggered)
      console.log('🔄 Phase 2: Fetching additional ETF data...');
      
      results.qqq = await this.fetchStockData('QQQ');
      await this.sleep(this.rateLimitDelay);
      
      results.iwm = await this.fetchStockData('IWM');
      await this.sleep(this.rateLimitDelay);
      
      // Phase 3: Options data (concurrent but limited)
      console.log('🔄 Phase 3: Fetching options data...');
      
      const [spyOptions, qqqOptions, iwmOptions] = await Promise.allSettled([
        this.fetchOptionsData('SPY'),
        this.fetchOptionsData('QQQ'),
        this.fetchOptionsData('IWM')
      ]);
      
      results.options = {
        spy: spyOptions.status === 'fulfilled' ? spyOptions.value : this.getMockOptionsData('SPY'),
        qqq: qqqOptions.status === 'fulfilled' ? qqqOptions.value : this.getMockOptionsData('QQQ'),
        iwm: iwmOptions.status === 'fulfilled' ? iwmOptions.value : this.getMockOptionsData('IWM')
      };
      
    } catch (error) {
      console.error('❌ Critical error in data collection:', error.message);
      // Ensure we have fallback data for everything
      results.fearGreed = results.fearGreed || this.getMockFearGreed();
      results.spy = results.spy || this.getMockStockData('SPY');
      results.qqq = results.qqq || this.getMockStockData('QQQ');
      results.iwm = results.iwm || this.getMockStockData('IWM');
      results.vix = results.vix || this.getMockVixData();
      results.options = results.options || {
        spy: this.getMockOptionsData('SPY'),
        qqq: this.getMockOptionsData('QQQ'),
        iwm: this.getMockOptionsData('IWM')
      };
    }

    // Validate and save data
    this.validateResults(results);
    
    writeFileSync(
      join(DATA_DIR, 'market-data.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('✅ Market data saved to public/data/market-data.json');
    this.logDataSummary(results);
    
    return results;
  }
  
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  validateResults(results) {
    const required = ['fearGreed', 'spy', 'qqq', 'iwm', 'vix', 'options'];
    for (const field of required) {
      if (!results[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    console.log('✅ Data validation passed');
  }
  
  logDataSummary(results) {
    console.log('📈 Data Summary:');
    console.log(`  Fear & Greed: ${results.fearGreed.current.value}`);
    console.log(`  SPY: $${results.spy.current.price} (${results.spy.current.changePercent > 0 ? '+' : ''}${results.spy.current.changePercent}%)`);
    console.log(`  VIX: ${results.vix.current.value}`);
    console.log(`  Circuit breakers active: ${this.circuitBreaker.size}`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new MarketDataFetcher();
  fetcher.fetchAllData().catch(console.error);
}