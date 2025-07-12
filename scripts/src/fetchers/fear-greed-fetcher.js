import { DataGenerators } from '../utils/data-generators.js';
import { MockDataProvider } from '../utils/mock-data.js';

export class FearGreedFetcher {
  constructor(httpClient, cacheManager, circuitBreaker, rapidApiKey) {
    this.httpClient = httpClient;
    this.cacheManager = cacheManager;
    this.circuitBreaker = circuitBreaker;
    this.rapidApiKey = rapidApiKey;
  }

  async fetch() {
    try {
      console.log('📊 Fetching Fear & Greed Index...');
      
      const endpoints = [
        {
          url: 'https://fear-and-greed-index.p.rapidapi.com/v1/fgi',
          parser: 'fgi_v1'
        }
      ];
      
      let data = null;
      for (const endpoint of endpoints) {
        try {
          if (this.circuitBreaker.isOpen(endpoint.url)) {
            console.warn(`⚡ Circuit breaker open for ${endpoint.url}`);
            continue;
          }

          const cached = this.cacheManager.get(`fear-greed-${endpoint.parser}`);
          if (cached) {
            console.log(`📦 Using cached data for fear-greed-${endpoint.parser}`);
            return cached;
          }

          console.log(`🔄 Trying ${endpoint.url}...`);
          const urlObj = new URL(endpoint.url);
          const headers = this.httpClient.buildRapidApiHeaders(this.rapidApiKey, urlObj.hostname);
          
          data = await this.httpClient.fetchWithRetry(endpoint.url, 2, headers);
          if (data) {
            data._parser = endpoint.parser;
            this.circuitBreaker.reset(endpoint.url);
            break;
          }
        } catch (error) {
          console.warn(`Fear & Greed endpoint failed: ${endpoint.url}`);
          this.circuitBreaker.recordFailure(endpoint.url);
          continue;
        }
      }
      
      if (!data) {
        console.warn('🔄 Using mock Fear & Greed data');
        return MockDataProvider.getFearGreed();
      }
      
      const result = this.parseResponse(data);
      this.cacheManager.set(`fear-greed-${data._parser}`, result);
      return result;
    } catch (error) {
      console.error('❌ Fear & Greed fetch completely failed:', error.message);
      return MockDataProvider.getFearGreed();
    }
  }

  parseResponse(data) {
    let historical;
    let currentValue = 50;
    
    if (data._parser === 'fgi_v1') {
      if (data.fgi?.now?.value) {
        currentValue = data.fgi.now.value;
        
        const timePoints = [
          { date: new Date().toISOString().split('T')[0], value: data.fgi.now.value, rating: data.fgi.now.valueText },
          { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], value: data.fgi.previousClose?.value || currentValue, rating: data.fgi.previousClose?.valueText || 'Unknown' },
          { date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], value: data.fgi.oneWeekAgo?.value || currentValue, rating: data.fgi.oneWeekAgo?.valueText || 'Unknown' },
          { date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], value: data.fgi.oneMonthAgo?.value || currentValue, rating: data.fgi.oneMonthAgo?.valueText || 'Unknown' }
        ];
        
        historical = DataGenerators.interpolateHistoricalData(timePoints, 30);
      } else {
        currentValue = data.fgi?.value || data.value || 50;
        historical = DataGenerators.generateHistoricalFromCurrent(currentValue, 'fear-greed');
      }
    } else {
      currentValue = data.value || data.score || data.fgi?.value || 50;
      historical = DataGenerators.generateHistoricalFromCurrent(currentValue, 'fear-greed');
    }

    return {
      current: historical[0],
      historical,
      lastUpdated: new Date().toISOString()
    };
  }
}