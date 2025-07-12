import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import our existing components
import { CONFIG } from './config.js';
import { CacheManager } from './cache-manager.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { MockDataGenerator } from './mock-data.js';

// Import enhanced modules
import { YahooFinanceFetcher } from './enhanced/yahoo-finance-fetcher.js';
import { AlphaVantageFetcher } from './enhanced/alpha-vantage-fetcher.js';
import { MarketSentimentAnalyzer } from './enhanced/market-sentiment-analyzer.js';
import { EnhancedMarketFetcher } from './enhanced/enhanced-market-fetcher.js';
import { EnhancedLogger } from './enhanced/enhanced-logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../public/data');
const CACHE_DIR = join(DATA_DIR, 'cache');

// Ensure directories exist
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(CACHE_DIR, { recursive: true });

class EnhancedFinancialDataFetcher {
  constructor() {
    console.log('🚀 Initializing enhanced financial data fetcher...');
    
    // Initialize existing components
    this.cache = new CacheManager(CACHE_DIR);
    this.circuitBreaker = new CircuitBreaker();
    this.mock = new MockDataGenerator();
    
    // Initialize enhanced modules
    this.logger = new EnhancedLogger();
    this.yahooFetcher = new YahooFinanceFetcher(this.mock);
    this.alphaVantageFetcher = new AlphaVantageFetcher(CONFIG.alphaVantageKey, this.mock);
    this.sentimentAnalyzer = new MarketSentimentAnalyzer();
    this.marketFetcher = new EnhancedMarketFetcher(
      this.yahooFetcher,
      this.alphaVantageFetcher,
      this.sentimentAnalyzer,
      this.mock
    );
    
    this.validateSetup();
  }

  validateSetup() {
    const hasAlphaVantageKey = CONFIG.alphaVantageKey && CONFIG.alphaVantageKey !== 'demo';
    
    this.logger.logSetupValidation(hasAlphaVantageKey);
    this.alphaVantageFetcher.validateSetup();
  }

  // Delegated methods to maintain API compatibility
  async fetchYahooFinanceData(symbol) {
    return this.yahooFetcher.fetchStockData(symbol);
  }

  async fetchAlphaVantageData(symbol) {
    return this.alphaVantageFetcher.fetchDailyData(symbol);
  }

  async fetchVixData() {
    return this.yahooFetcher.fetchVixData();
  }

  async fetchFearGreedIndex() {
    return this.sentimentAnalyzer.fetchFearGreedIndex();
  }

  async fetchCryptocurrencyData() {
    return this.yahooFetcher.fetchCryptocurrencyData();
  }

  async fetchCommodityData() {
    return this.yahooFetcher.fetchCommodityData();
  }

  async fetchAllMarketData() {
    const results = await this.marketFetcher.fetchAllMarketData();
    
    // Save enhanced data with execution summary
    const executionSummary = this.logger.createExecutionSummary(results);
    results.execution = executionSummary;
    
    writeFileSync(
      join(DATA_DIR, 'market-data.json'),
      JSON.stringify(results, null, 2)
    );

    this.logger.logSuccess('Enhanced market data saved to public/data/market-data.json');
    this.logger.logEnhancedSummary(results);
    
    return results;
  }

  // Additional methods that use new modules
  async fetchSectorData() {
    return this.marketFetcher.fetchSectorData();
  }

  async fetchInternationalData() {
    return this.marketFetcher.fetchInternationalData();
  }

  calculateMarketSentiment(data) {
    return this.sentimentAnalyzer.calculateMarketSentiment(data);
  }

  analyzeSectorPerformance(sectorData) {
    return this.sentimentAnalyzer.analyzeSectorPerformance(sectorData);
  }

  generateSentimentSummary(sentimentData) {
    return this.sentimentAnalyzer.generateSentimentSummary(sentimentData);
  }

  // Legacy compatibility methods
  logEnhancedSummary(results) {
    this.logger.logEnhancedSummary(results);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export the class
export default EnhancedFinancialDataFetcher;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new EnhancedFinancialDataFetcher();
  fetcher.fetchAllMarketData().catch(console.error);
}