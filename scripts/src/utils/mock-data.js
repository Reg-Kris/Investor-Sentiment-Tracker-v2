import { subDays, format } from 'date-fns';

export class MockDataProvider {
  static getFearGreed() {
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

  static getStockData(symbol) {
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

  static getVixData() {
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

  static getOptionsData(symbol) {
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

  static getMarketOptionsData() {
    const ratio = 0.85 + (Math.random() - 0.5) * 0.4;
    
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
      lastUpdated: new Date().toISOString()
    };
  }
}