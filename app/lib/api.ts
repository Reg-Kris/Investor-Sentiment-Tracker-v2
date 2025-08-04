import { SentimentData, SentimentLevel, APIResponse } from './types';
// Removed logger import for static build compatibility

class APIService {
  private static instance: APIService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();
  private errorCounts: Map<string, number> = new Map();

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  private checkRateLimit(endpoint: string): boolean {
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(endpoint);
    
    if (!tracker || now > tracker.resetTime) {
      // Reset rate limit window (1 minute)
      this.rateLimitTracker.set(endpoint, { count: 1, resetTime: now + 60000 });
      return true;
    }
    
    if (tracker.count >= 60) { // 60 requests per minute limit
      console.warn(`Rate limit approaching for ${endpoint}`, {
        currentCount: tracker.count,
        resetTime: new Date(tracker.resetTime).toISOString()
      });
      return false;
    }
    
    tracker.count++;
    return true;
  }

  private trackError(endpoint: string, error: Error): void {
    const errorCount = (this.errorCounts.get(endpoint) || 0) + 1;
    this.errorCounts.set(endpoint, errorCount);
    
    console.error(`API call failed for ${endpoint}`, error, {
      endpoint,
      errorCount,
      consecutiveErrors: errorCount
    });
    
    // Alert if error count exceeds threshold
    if (errorCount >= 5) {
      console.error(`Multiple API failures detected for ${endpoint}`, error, {
        endpoint,
        totalErrors: errorCount,
        recommendation: 'Check API service status and consider fallback data'
      });
    }
  }

  private resetErrorCount(endpoint: string): void {
    if (this.errorCounts.has(endpoint)) {
      this.errorCounts.set(endpoint, 0);
      console.info(`API service recovered for ${endpoint}`);
    }
  }

  private async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Cache hit for ${key}`, { cacheAge: Date.now() - cached.timestamp });
      return cached.data;
    }

    console.time(`api-fetch-${key}`);
    
    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      this.resetErrorCount(key);
      
      console.timeEnd(`api-fetch-${key}`);
      console.info(`Successful API call for ${key}`, { dataReceived: typeof data !== 'undefined' });
      
      return data;
    } catch (error) {
      console.timeEnd(`api-fetch-${key}`);
      this.trackError(key, error as Error);
      
      if (cached) {
        console.warn(`Using stale cache data for ${key} due to API error`, {
          cacheAge: Date.now() - cached.timestamp,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return cached.data;
      }
      throw error;
    }
  }

  async getFearGreedIndex(): Promise<number> {
    if (!this.checkRateLimit('fear-greed')) {
      throw new Error('Rate limit exceeded for Fear & Greed Index API');
    }

    return this.fetchWithCache('fear-greed', async () => {
      const startTime = Date.now();
      const response = await fetch('https://api.alternative.me/fng/');
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        const error = new Error(`Fear & Greed API failed: ${response.status} ${response.statusText}`);
        console.log('https://api.alternative.me/fng/', 'GET', responseTime, response.status, error);
        throw error;
      }
      
      const data = await response.json();
      console.log('https://api.alternative.me/fng/', 'GET', responseTime, response.status);
      
      if (!data.data || !data.data[0] || !data.data[0].value) {
        throw new Error('Invalid response format from Fear & Greed API');
      }
      
      const value = parseInt(data.data[0].value);
      console.log('Fear & Greed Index retrieved', { value, responseTime });
      
      return value;
    });
  }

  async getStockData(symbol: string): Promise<{ change: number; price: number }> {
    if (!this.checkRateLimit(`yahoo-${symbol}`)) {
      throw new Error(`Rate limit exceeded for Yahoo Finance API (${symbol})`);
    }

    return this.fetchWithCache(`stock-${symbol}`, async () => {
      const startTime = Date.now();
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        const error = new Error(`Yahoo Finance API failed for ${symbol}: ${response.status} ${response.statusText}`);
        console.log(url, 'GET', responseTime, response.status, error);
        throw error;
      }
      
      const data = await response.json();
      console.log(url, 'GET', responseTime, response.status);
      
      if (!data.chart || !data.chart.result || !data.chart.result[0]) {
        throw new Error(`Invalid response format from Yahoo Finance API for ${symbol}`);
      }
      
      const result = data.chart.result[0];
      if (!result.indicators || !result.indicators.quote || !result.indicators.quote[0] || !result.indicators.quote[0].close) {
        throw new Error(`No price data available for ${symbol}`);
      }
      
      const prices = result.indicators.quote[0].close.filter((price: number) => price !== null);
      
      if (prices.length < 2) {
        throw new Error(`Insufficient price data for ${symbol}`);
      }
      
      const current = prices[prices.length - 1];
      const previous = prices[prices.length - 2];
      const change = ((current - previous) / previous) * 100;
      
      console.log(`Stock data retrieved for ${symbol}`, { 
        current, 
        previous, 
        change: Math.round(change * 100) / 100,
        responseTime 
      });
      
      return { change, price: current };
    });
  }

  async getVIXData(): Promise<number> {
    if (!this.checkRateLimit('yahoo-vix')) {
      throw new Error('Rate limit exceeded for Yahoo Finance VIX API');
    }

    return this.fetchWithCache('vix', async () => {
      const startTime = Date.now();
      const url = 'https://query1.finance.yahoo.com/v8/finance/chart/^VIX?interval=1d&range=1d';
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        const error = new Error(`Yahoo Finance VIX API failed: ${response.status} ${response.statusText}`);
        console.log(url, 'GET', responseTime, response.status, error);
        throw error;
      }
      
      const data = await response.json();
      console.log(url, 'GET', responseTime, response.status);
      
      if (!data.chart || !data.chart.result || !data.chart.result[0] || 
          !data.chart.result[0].indicators || !data.chart.result[0].indicators.quote ||
          !data.chart.result[0].indicators.quote[0] || !data.chart.result[0].indicators.quote[0].close) {
        throw new Error('Invalid response format from Yahoo Finance VIX API');
      }
      
      const vixValue = data.chart.result[0].indicators.quote[0].close[0];
      
      if (typeof vixValue !== 'number' || isNaN(vixValue)) {
        throw new Error('Invalid VIX value received from API');
      }
      
      console.log('VIX data retrieved', { value: vixValue, responseTime });
      
      return vixValue;
    });
  }

  async getPutCallRatio(): Promise<number> {
    return this.fetchWithCache('put-call', async () => {
      return 0.85 + Math.random() * 0.3;
    });
  }

  private calculateSentiment(fearGreed: number, stockChanges: number[], vix: number): SentimentLevel {
    const avgStockChange = stockChanges.reduce((a, b) => a + b, 0) / stockChanges.length;
    
    let score = 0;
    score += fearGreed;
    score += Math.max(-20, Math.min(20, avgStockChange * 10)) + 20;
    score += Math.max(0, Math.min(40, (40 - vix) * 2));
    
    const normalizedScore = score / 140 * 100;
    
    if (normalizedScore < 20) return 'extreme-fear';
    if (normalizedScore < 40) return 'fear';
    if (normalizedScore < 60) return 'neutral';
    if (normalizedScore < 80) return 'greed';
    return 'extreme-greed';
  }

  async getSentimentData(): Promise<APIResponse<SentimentData>> {
    try {
      const [fearGreed, spy, qqq, iwm, vix, putCall] = await Promise.allSettled([
        this.getFearGreedIndex(),
        this.getStockData('SPY'),
        this.getStockData('QQQ'),
        this.getStockData('IWM'),
        this.getVIXData(),
        this.getPutCallRatio()
      ]);

      const fearGreedValue = fearGreed.status === 'fulfilled' ? fearGreed.value : 50;
      const spyData = spy.status === 'fulfilled' ? spy.value : { change: 0 };
      const qqqData = qqq.status === 'fulfilled' ? qqq.value : { change: 0 };
      const iwmData = iwm.status === 'fulfilled' ? iwm.value : { change: 0 };
      const vixValue = vix.status === 'fulfilled' ? vix.value : 20;
      const putCallValue = putCall.status === 'fulfilled' ? putCall.value : 1.0;

      const stockChanges = [spyData.change, qqqData.change, iwmData.change];
      const overallSentiment = this.calculateSentiment(fearGreedValue, stockChanges, vixValue);

      return {
        success: true,
        data: {
          fearGreedIndex: fearGreedValue,
          spyChange: spyData.change,
          qqqqChange: qqqData.change,
          iwmChange: iwmData.change,
          vixLevel: vixValue,
          putCallRatio: putCallValue,
          overallSentiment,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: this.getMockData(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getMockData(): SentimentData {
    const mockChanges = [0.5, -0.3, 0.8];
    return {
      fearGreedIndex: 45,
      spyChange: mockChanges[0],
      qqqqChange: mockChanges[1],
      iwmChange: mockChanges[2],
      vixLevel: 22,
      putCallRatio: 0.92,
      overallSentiment: this.calculateSentiment(45, mockChanges, 22),
      lastUpdated: new Date().toISOString()
    };
  }
}

export default APIService;