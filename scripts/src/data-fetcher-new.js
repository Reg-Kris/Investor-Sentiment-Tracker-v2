import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import our new modular components
import { CONFIG, SYMBOLS } from './config.js';
import { CacheManager } from './cache-manager.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { HttpClient } from './http-client.js';
import { MockDataGenerator } from './mock-data.js';
import { OptionsFetcher } from './options-fetcher.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../public/data');
const CACHE_DIR = join(DATA_DIR, 'cache');

// Ensure directories exist
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(CACHE_DIR, { recursive: true });

class ModularDataFetcher {
  constructor() {
    console.log('🔧 Initializing modular data fetcher...');

    // Initialize components
    this.cache = new CacheManager(CACHE_DIR);
    this.circuitBreaker = new CircuitBreaker();
    this.http = new HttpClient(this.cache, this.circuitBreaker);
    this.mock = new MockDataGenerator();
    this.options = new OptionsFetcher(this.http, this.mock);

    this.validateApiKeys();
  }

  validateApiKeys() {
    const keyStatus = {
      alphaVantage: CONFIG.alphaVantageKey && CONFIG.alphaVantageKey !== 'demo',
      fred: CONFIG.fredApiKey && CONFIG.fredApiKey !== 'demo',
      rapidApi: CONFIG.rapidApiKey && CONFIG.rapidApiKey !== 'demo',
    };

    console.log('🔑 API Key Status:');
    console.log(
      `  Alpha Vantage: ${keyStatus.alphaVantage ? '✅' : '❌ not configured'}`,
    );
    console.log(`  FRED: ${keyStatus.fred ? '✅' : '❌ not configured'}`);
    console.log(
      `  RapidAPI: ${keyStatus.rapidApi ? '✅' : '❌ not configured'}`,
    );
    console.log(`  Yahoo Finance: ✅ (no API key required)`);

    if (!keyStatus.alphaVantage && !keyStatus.fred && !keyStatus.rapidApi) {
      console.warn(
        '⚠️  No API keys configured - using Yahoo Finance and fallback data sources',
      );
      console.log('💡 For better data coverage, configure API keys:');
      console.log(
        '   - Alpha Vantage: https://www.alphavantage.co/support/#api-key',
      );
      console.log(
        '   - FRED: https://fred.stlouisfed.org/docs/api/api_key.html',
      );
      console.log('   - RapidAPI: https://rapidapi.com/');
    }

    return keyStatus;
  }

  async fetchAllData() {
    console.log('🚀 Starting modular market data collection...');

    const results = {
      lastUpdated: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
    };

    try {
      // Phase 1: Core market data (staggered)
      console.log('🔄 Phase 1: Fetching core market indicators...');

      results.fearGreed = await this.fetchFearGreedIndex();
      await this.sleep(CONFIG.rateLimitDelay);

      results.spy = await this.fetchStockData('SPY');
      await this.sleep(CONFIG.rateLimitDelay);

      results.vix = await this.fetchVixData();
      await this.sleep(CONFIG.rateLimitDelay);

      // Phase 2: Additional ETFs (staggered)
      console.log('🔄 Phase 2: Fetching additional ETF data...');

      results.qqq = await this.fetchStockData('QQQ');
      await this.sleep(CONFIG.rateLimitDelay);

      results.iwm = await this.fetchStockData('IWM');
      await this.sleep(CONFIG.rateLimitDelay);

      // Phase 3: Market Options data (consolidated)
      console.log('🔄 Phase 3: Fetching consolidated market options data...');

      results.options = await this.options.fetchMarketOptionsData();
    } catch (error) {
      console.error('❌ Critical error in data collection:', error.message);
      // Ensure we have fallback data for everything
      results.fearGreed = results.fearGreed || this.mock.getMockFearGreed();
      results.spy = results.spy || this.mock.getMockStockData('SPY');
      results.qqq = results.qqq || this.mock.getMockStockData('QQQ');
      results.iwm = results.iwm || this.mock.getMockStockData('IWM');
      results.vix = results.vix || this.mock.getMockVixData();
      results.options = results.options || this.mock.getMockMarketOptionsData();
    }

    // Validate and save data
    this.validateResults(results);

    writeFileSync(
      join(DATA_DIR, 'market-data.json'),
      JSON.stringify(results, null, 2),
    );

    console.log('✅ Market data saved to public/data/market-data.json');
    this.logDataSummary(results);

    return results;
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    console.log(
      `  SPY: $${results.spy.current.price} (${results.spy.current.changePercent > 0 ? '+' : ''}${results.spy.current.changePercent}%)`,
    );
    console.log(`  VIX: ${results.vix.current.value}`);
    console.log(
      `  Market Options: ${results.options.sentiment} (P/C: ${results.options.ratio})`,
    );
    console.log(
      `  Circuit breakers active: ${this.circuitBreaker.getActiveCount()}`,
    );
  }

  // Simplified fetch methods (to be implemented or moved to other modules)
  async fetchFearGreedIndex() {
    // Simplified implementation - move to separate module if needed
    return this.mock.getMockFearGreed();
  }

  async fetchStockData(symbol) {
    // Simplified implementation - move to separate module if needed
    return this.mock.getMockStockData(symbol);
  }

  async fetchVixData() {
    // Simplified implementation - move to separate module if needed
    return this.mock.getMockVixData();
  }
}

// Export the class
export default ModularDataFetcher;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new ModularDataFetcher();
  fetcher.fetchAllData().catch(console.error);
}
