import { format, subDays } from 'date-fns';
import { SYMBOLS } from './config.js';

export class MockDataGenerator {
  getMockFearGreed() {
    const historical = Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      value: Math.round((30 + Math.random() * 40) * 100) / 100,
      rating: 'Neutral',
    }));

    return {
      current: historical[0],
      historical,
      lastUpdated: new Date().toISOString(),
    };
  }

  getMockStockData(symbol) {
    const basePrice = SYMBOLS.basePrices[symbol] || 400;

    const historical = Array.from({ length: 30 }, (_, i) => {
      const price = basePrice + (Math.random() - 0.5) * 20;
      return {
        date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
        price: Math.round(price * 100) / 100,
        volume: Math.floor(50000000 + Math.random() * 50000000),
        change: (Math.random() - 0.5) * 10,
      };
    });

    const current = historical[0];
    const changePercent = (Math.random() - 0.5) * 4;

    return {
      symbol,
      current: {
        ...current,
        changePercent: Math.round(changePercent * 100) / 100,
      },
      historical,
      lastUpdated: new Date().toISOString(),
    };
  }

  getMockVixData() {
    const historical = Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      value: Math.round((15 + Math.random() * 25) * 100) / 100,
    }));

    return {
      current: historical[0],
      historical,
      lastUpdated: new Date().toISOString(),
    };
  }

  getMockMarketOptionsData() {
    const ratio = 0.85 + (Math.random() - 0.5) * 0.4; // Random ratio between 0.65-1.05

    let sentiment = 'neutral';
    if (ratio > 1.2) {
      sentiment = 'very bearish';
    } else if (ratio > 1.0) {
      sentiment = 'bearish';
    } else if (ratio > 0.8) {
      sentiment = 'neutral';
    } else if (ratio > 0.6) {
      sentiment = 'bullish';
    } else {
      sentiment = 'very bullish';
    }

    return {
      market: `Market options show ${sentiment} sentiment (P/C: ${ratio.toFixed(2)})`,
      ratio: Math.round(ratio * 100) / 100,
      putVolume: Math.floor(180000 + Math.random() * 80000),
      callVolume: Math.floor(200000 + Math.random() * 100000),
      sentiment,
      successfulFetches: 0,
      totalSymbols: 3,
      lastUpdated: new Date().toISOString(),
    };
  }

  getValueText(value) {
    if (value >= 75) return 'Extreme Greed';
    if (value >= 55) return 'Greed';
    if (value >= 45) return 'Neutral';
    if (value >= 25) return 'Fear';
    return 'Extreme Fear';
  }

  generateHistoricalFromCurrent(currentValue, type) {
    return Array.from({ length: 30 }, (_, i) => {
      const variance = type === 'fear-greed' ? 15 : 5;
      const value = currentValue + (Math.random() - 0.5) * variance;
      return {
        date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
        value: Math.round(Math.max(0, Math.min(100, value)) * 100) / 100,
        rating: type === 'fear-greed' ? this.getValueText(value) : undefined,
      };
    });
  }
}
