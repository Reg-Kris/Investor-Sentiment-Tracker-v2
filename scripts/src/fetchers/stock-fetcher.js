import { DataParsers } from '../parsers/data-parsers.js';
import { MockDataProvider } from '../utils/mock-data.js';

export class StockFetcher {
  constructor(httpClient, cacheManager, circuitBreaker, alphaVantageKey) {
    this.httpClient = httpClient;
    this.cacheManager = cacheManager;
    this.circuitBreaker = circuitBreaker;
    this.alphaVantageKey = alphaVantageKey;
  }

  async fetch(symbol) {
    try {
      console.log(`📈 Fetching ${symbol} data...`);

      const endpoints = [
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${this.alphaVantageKey}`,
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`,
      ];

      for (const [index, endpoint] of endpoints.entries()) {
        try {
          if (this.circuitBreaker.isOpen(endpoint)) {
            console.warn(`⚡ Circuit breaker open for ${endpoint}`);
            continue;
          }

          const cached = this.cacheManager.get(`${symbol}-${index}`);
          if (cached) {
            console.log(`📦 Using cached data for ${symbol}-${index}`);
            return cached;
          }

          const data = await this.httpClient.fetchWithRetry(endpoint, 2);

          let result;
          if (data['Time Series (Daily)']) {
            result = DataParsers.parseAlphaVantageData(data, symbol);
          } else if (data.chart?.result?.[0]) {
            result = DataParsers.parseYahooFinanceData(data, symbol);
          } else {
            throw new Error('Unknown data format');
          }

          this.circuitBreaker.reset(endpoint);
          this.cacheManager.set(`${symbol}-${index}`, result);
          return result;
        } catch (error) {
          console.warn(
            `${symbol} endpoint ${index + 1} failed:`,
            error.message,
          );
          this.circuitBreaker.recordFailure(endpoint);
          continue;
        }
      }

      throw new Error(`All ${symbol} endpoints failed`);
    } catch (error) {
      console.error(`❌ ${symbol} fetch completely failed:`, error.message);
      return MockDataProvider.getStockData(symbol);
    }
  }
}
