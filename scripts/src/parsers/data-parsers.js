export class DataParsers {
  static parseAlphaVantageData(data, symbol) {
    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) throw new Error('Invalid Alpha Vantage data format');

    const historical = Object.entries(timeSeries)
      .slice(0, 30)
      .map(([date, values]) => ({
        date,
        price: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
        change: parseFloat(values['4. close']) - parseFloat(values['1. open'])
      }));

    const current = historical[0];
    const previous = historical[1];
    const changePercent = previous ? ((current.price - previous.price) / previous.price) * 100 : 0;

    return {
      symbol,
      current: { ...current, changePercent: Math.round(changePercent * 100) / 100 },
      historical,
      lastUpdated: new Date().toISOString()
    };
  }

  static parseYahooFinanceData(data, symbol) {
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;
    const volumes = result.indicators.quote[0].volume;
    const opens = result.indicators.quote[0].open;

    const historical = timestamps.slice(-30).map((timestamp, index) => {
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      return {
        date,
        price: Math.round(closes[index] * 100) / 100,
        volume: volumes[index] || 0,
        change: closes[index] - opens[index]
      };
    }).reverse();

    const current = historical[0];
    const previous = historical[1];
    const changePercent = previous ? ((current.price - previous.price) / previous.price) * 100 : 0;

    return {
      symbol,
      current: { ...current, changePercent: Math.round(changePercent * 100) / 100 },
      historical,
      lastUpdated: new Date().toISOString()
    };
  }

  static parseFredVixData(data) {
    const historical = data.observations
      .filter(obs => obs.value !== '.')
      .map(obs => ({
        date: obs.date,
        value: parseFloat(obs.value)
      }));

    return {
      current: historical[0],
      historical,
      lastUpdated: new Date().toISOString()
    };
  }

  static parseYahooVixData(data) {
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;
    
    const historical = timestamps.slice(-30).map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      value: Math.round(closes[index] * 100) / 100
    })).reverse();
    
    return {
      current: historical[0],
      historical,
      lastUpdated: new Date().toISOString()
    };
  }
}