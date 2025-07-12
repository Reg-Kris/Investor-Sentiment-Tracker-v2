import { DataParsers } from '../parsers/data-parsers.js';
import { MockDataProvider } from '../utils/mock-data.js';

export class VixFetcher {
  constructor(httpClient, cacheManager, circuitBreaker, fredApiKey) {
    this.httpClient = httpClient;
    this.cacheManager = cacheManager;
    this.circuitBreaker = circuitBreaker;
    this.fredApiKey = fredApiKey;
  }

  async fetch() {
    try {
      console.log('📉 Fetching VIX data...');
      
      const cached = this.cacheManager.get('vix-data');
      if (cached) {
        console.log('📦 Using cached VIX data');
        return cached;
      }

      if (this.fredApiKey && this.fredApiKey !== 'demo') {
        try {
          const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=VIXCLS&api_key=${this.fredApiKey}&file_type=json&limit=30&sort_order=desc`;
          
          if (!this.circuitBreaker.isOpen(fredUrl)) {
            const data = await this.httpClient.fetchWithRetry(fredUrl);
            const result = DataParsers.parseFredVixData(data);
            this.circuitBreaker.reset(fredUrl);
            this.cacheManager.set('vix-data', result);
            return result;
          }
        } catch (error) {
          console.warn('FRED API failed, trying alternative sources:', error.message);
          this.circuitBreaker.recordFailure(fredUrl);
        }
      }
      
      try {
        const yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/^VIX?range=1mo&interval=1d';
        
        if (!this.circuitBreaker.isOpen(yahooUrl)) {
          const data = await this.httpClient.fetchWithRetry(yahooUrl);
          
          if (data.chart?.result?.[0]) {
            const result = DataParsers.parseYahooVixData(data);
            this.circuitBreaker.reset(yahooUrl);
            this.cacheManager.set('vix-data', result);
            return result;
          }
        }
      } catch (error) {
        console.warn('Yahoo Finance VIX fallback failed:', error.message);
        this.circuitBreaker.recordFailure(yahooUrl);
      }
      
      throw new Error('All VIX data sources failed');
    } catch (error) {
      console.error('VIX fetch failed:', error.message);
      return MockDataProvider.getVixData();
    }
  }
}