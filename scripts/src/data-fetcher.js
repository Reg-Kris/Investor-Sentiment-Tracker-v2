import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { HttpClient } from './utils/http-client.js';
import { CacheManager } from './utils/cache-manager.js';
import { CircuitBreaker } from './utils/circuit-breaker.js';
import { FearGreedFetcher } from './fetchers/fear-greed-fetcher.js';
import { StockFetcher } from './fetchers/stock-fetcher.js';
import { VixFetcher } from './fetchers/vix-fetcher.js';
import { OptionsFetcher } from './fetchers/options-fetcher.js';
import { MockDataProvider } from './utils/mock-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../public/data');
const CACHE_DIR = join(DATA_DIR, 'cache');

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(CACHE_DIR, { recursive: true });

class MarketDataFetcher {
  constructor() {
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_KEY || 'demo';
    this.fredApiKey = process.env.FRED_API_KEY || 'demo';
    this.rapidApiKey = process.env.RAPIDAPI_KEY || 'demo';
    this.rateLimitDelay = 2000;
    
    this.httpClient = new HttpClient(15000);
    this.cacheManager = new CacheManager(CACHE_DIR);
    this.circuitBreaker = new CircuitBreaker(3);
    
    this.fearGreedFetcher = new FearGreedFetcher(this.httpClient, this.cacheManager, this.circuitBreaker, this.rapidApiKey);
    this.stockFetcher = new StockFetcher(this.httpClient, this.cacheManager, this.circuitBreaker, this.alphaVantageKey);
    this.vixFetcher = new VixFetcher(this.httpClient, this.cacheManager, this.circuitBreaker, this.fredApiKey);
    this.optionsFetcher = new OptionsFetcher(this.httpClient, this.cacheManager, this.circuitBreaker);
    
    console.log('🔧 Data fetcher initialized with robust error handling');
    this.validateApiKeys();
  }

  validateApiKeys() {
    const keyStatus = {
      alphaVantage: this.alphaVantageKey !== 'demo',
      fred: this.fredApiKey !== 'demo', 
      rapidApi: this.rapidApiKey !== 'demo'
    };
    
    console.log('🔑 API Key Status:');
    console.log(`  Alpha Vantage: ${keyStatus.alphaVantage ? '✅' : '⚠️  demo'}`);
    console.log(`  FRED: ${keyStatus.fred ? '✅' : '⚠️  demo'}`);
    console.log(`  RapidAPI: ${keyStatus.rapidApi ? '✅' : '⚠️  demo'}`);
    
    if (!keyStatus.alphaVantage && !keyStatus.fred && !keyStatus.rapidApi) {
      console.warn('⚠️  All APIs using demo keys - expect rate limits and mock data');
    }
    
    return keyStatus;
  }

  async fetchAllData() {
    console.log('🚀 Starting robust market data collection...');
    
    const results = {
      lastUpdated: new Date().toISOString(),
      generatedAt: new Date().toISOString()
    };
    
    try {
      console.log('🔄 Phase 1: Fetching core market indicators...');
      
      results.fearGreed = await this.fearGreedFetcher.fetch();
      await this.sleep(this.rateLimitDelay);
      
      results.spy = await this.stockFetcher.fetch('SPY');
      await this.sleep(this.rateLimitDelay);
      
      results.vix = await this.vixFetcher.fetch();
      await this.sleep(this.rateLimitDelay);
      
      console.log('🔄 Phase 2: Fetching additional ETF data...');
      
      results.qqq = await this.stockFetcher.fetch('QQQ');
      await this.sleep(this.rateLimitDelay);
      
      results.iwm = await this.stockFetcher.fetch('IWM');
      await this.sleep(this.rateLimitDelay);
      
      console.log('🔄 Phase 3: Fetching consolidated market options data...');
      
      results.options = await this.optionsFetcher.fetchMarketOptions();
      
    } catch (error) {
      console.error('❌ Critical error in data collection:', error.message);
      results.fearGreed = results.fearGreed || MockDataProvider.getFearGreed();
      results.spy = results.spy || MockDataProvider.getStockData('SPY');
      results.qqq = results.qqq || MockDataProvider.getStockData('QQQ');
      results.iwm = results.iwm || MockDataProvider.getStockData('IWM');
      results.vix = results.vix || MockDataProvider.getVixData();
      results.options = results.options || MockDataProvider.getMarketOptionsData();
    }

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
    console.log(`  Circuit breakers active: ${this.circuitBreaker.getStatus().activeCircuits}`);
  }
}

export default MarketDataFetcher;

if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new MarketDataFetcher();
  fetcher.fetchAllData().catch(console.error);
}