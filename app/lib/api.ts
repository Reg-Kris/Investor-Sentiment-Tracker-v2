import { SentimentData, SentimentLevel, APIResponse } from './types';

class APIService {
  private static instance: APIService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  private async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  async getFearGreedIndex(): Promise<number> {
    return this.fetchWithCache('fear-greed', async () => {
      const response = await fetch('https://api.alternative.me/fng/');
      const data = await response.json();
      return parseInt(data.data[0].value);
    });
  }

  async getStockData(symbol: string): Promise<{ change: number; price: number }> {
    return this.fetchWithCache(`stock-${symbol}`, async () => {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`
      );
      const data = await response.json();
      const prices = data.chart.result[0].indicators.quote[0].close;
      const current = prices[prices.length - 1];
      const previous = prices[prices.length - 2];
      const change = ((current - previous) / previous) * 100;
      return { change, price: current };
    });
  }

  async getVIXData(): Promise<number> {
    return this.fetchWithCache('vix', async () => {
      const response = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/^VIX?interval=1d&range=1d'
      );
      const data = await response.json();
      return data.chart.result[0].indicators.quote[0].close[0];
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