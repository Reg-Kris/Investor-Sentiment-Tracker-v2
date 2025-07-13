import alpha from 'alphavantage';

/**
 * Alpha Vantage API fetcher for enhanced market data collection
 * Handles Alpha Vantage API interactions with proper error handling and data formatting
 */
export class AlphaVantageFetcher {
  constructor(apiKey, mockDataGenerator) {
    this.alphaVantage = alpha({ key: apiKey });
    this.mock = mockDataGenerator;
    this.apiKey = apiKey;
  }

  /**
   * Validate API setup and log status
   */
  validateSetup() {
    const hasValidKey = this.apiKey && this.apiKey !== 'demo';

    console.log('🔑 Alpha Vantage API Setup:');
    console.log(`  Status: ${hasValidKey ? '✅' : '⚠️  demo key'}`);

    if (!hasValidKey) {
      console.warn('⚠️  Using demo Alpha Vantage key - expect limited data');
    }

    return hasValidKey;
  }

  /**
   * Fetch daily adjusted stock data from Alpha Vantage
   * @param {string} symbol - Stock symbol to fetch
   * @returns {Promise<Object>} - Formatted stock data
   */
  async fetchDailyData(symbol) {
    try {
      console.log(`📈 Fetching ${symbol} data from Alpha Vantage...`);

      // Get daily adjusted data
      const dailyData = await this.alphaVantage.data.daily_adjusted(symbol);

      if (!dailyData || !dailyData['Time Series (Daily)']) {
        throw new Error('Invalid response from Alpha Vantage');
      }

      return this.formatDailyData(symbol, dailyData);
    } catch (error) {
      console.error(
        `❌ Error fetching ${symbol} from Alpha Vantage:`,
        error.message,
      );
      return this.mock.getMockStockData(symbol);
    }
  }

  /**
   * Fetch intraday data from Alpha Vantage
   * @param {string} symbol - Stock symbol to fetch
   * @param {string} interval - Time interval (1min, 5min, 15min, 30min, 60min)
   * @returns {Promise<Object>} - Formatted intraday data
   */
  async fetchIntradayData(symbol, interval = '60min') {
    try {
      console.log(`📈 Fetching ${symbol} intraday data from Alpha Vantage...`);

      const intradayData = await this.alphaVantage.data.intraday(
        symbol,
        interval,
      );

      if (!intradayData || !intradayData[`Time Series (${interval})`]) {
        throw new Error('Invalid intraday response from Alpha Vantage');
      }

      return this.formatIntradayData(symbol, intradayData, interval);
    } catch (error) {
      console.error(
        `❌ Error fetching ${symbol} intraday from Alpha Vantage:`,
        error.message,
      );
      return this.mock.getMockStockData(symbol);
    }
  }

  /**
   * Fetch technical indicators from Alpha Vantage
   * @param {string} symbol - Stock symbol
   * @param {string} indicator - Technical indicator (SMA, EMA, RSI, etc.)
   * @param {Object} params - Indicator parameters
   * @returns {Promise<Object>} - Technical indicator data
   */
  async fetchTechnicalIndicator(symbol, indicator, params = {}) {
    try {
      console.log(
        `📊 Fetching ${indicator} for ${symbol} from Alpha Vantage...`,
      );

      let result;
      switch (indicator.toUpperCase()) {
        case 'SMA':
          result = await this.alphaVantage.data.sma(
            symbol,
            params.interval || 'daily',
            params.timePeriod || 20,
          );
          break;
        case 'EMA':
          result = await this.alphaVantage.data.ema(
            symbol,
            params.interval || 'daily',
            params.timePeriod || 20,
          );
          break;
        case 'RSI':
          result = await this.alphaVantage.data.rsi(
            symbol,
            params.interval || 'daily',
            params.timePeriod || 14,
          );
          break;
        case 'MACD':
          result = await this.alphaVantage.data.macd(
            symbol,
            params.interval || 'daily',
          );
          break;
        default:
          throw new Error(`Unsupported indicator: ${indicator}`);
      }

      return this.formatTechnicalData(symbol, indicator, result);
    } catch (error) {
      console.error(
        `❌ Error fetching ${indicator} for ${symbol}:`,
        error.message,
      );
      return {
        symbol,
        indicator,
        error: error.message,
        metadata: {
          source: 'alpha-vantage',
          fetchedAt: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Format daily adjusted data into standardized structure
   * @private
   */
  formatDailyData(symbol, dailyData) {
    const timeSeries = dailyData['Time Series (Daily)'];
    const dates = Object.keys(timeSeries).sort(
      (a, b) => new Date(b) - new Date(a),
    );
    const latestDate = dates[0];
    const previousDate = dates[1];

    const current = timeSeries[latestDate];
    const previous = timeSeries[previousDate];

    const currentPrice = parseFloat(current['4. close']);
    const previousPrice = parseFloat(previous['4. close']);
    const change = currentPrice - previousPrice;
    const changePercent = ((change / previousPrice) * 100).toFixed(2);

    return {
      symbol: symbol,
      current: {
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: parseInt(current['6. volume']),
        high: parseFloat(current['2. high']),
        low: parseFloat(current['3. low']),
        timestamp: new Date().toISOString(),
      },
      historical: dates.slice(0, 7).map((date) => ({
        date: date,
        close: parseFloat(timeSeries[date]['4. close']),
        volume: parseInt(timeSeries[date]['6. volume']),
        high: parseFloat(timeSeries[date]['2. high']),
        low: parseFloat(timeSeries[date]['3. low']),
      })),
      metadata: {
        source: 'alpha-vantage',
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Format intraday data into standardized structure
   * @private
   */
  formatIntradayData(symbol, intradayData, interval) {
    const timeSeries = intradayData[`Time Series (${interval})`];
    const timestamps = Object.keys(timeSeries).sort(
      (a, b) => new Date(b) - new Date(a),
    );
    const latest = timestamps[0];
    const previous = timestamps[1];

    const currentData = timeSeries[latest];
    const previousData = timeSeries[previous];

    const currentPrice = parseFloat(currentData['4. close']);
    const previousPrice = parseFloat(previousData['4. close']);
    const change = currentPrice - previousPrice;
    const changePercent = ((change / previousPrice) * 100).toFixed(2);

    return {
      symbol: symbol,
      interval: interval,
      current: {
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: parseInt(currentData['5. volume']),
        high: parseFloat(currentData['2. high']),
        low: parseFloat(currentData['3. low']),
        timestamp: new Date().toISOString(),
      },
      recent: timestamps.slice(0, 10).map((timestamp) => ({
        timestamp: timestamp,
        close: parseFloat(timeSeries[timestamp]['4. close']),
        volume: parseInt(timeSeries[timestamp]['5. volume']),
        high: parseFloat(timeSeries[timestamp]['2. high']),
        low: parseFloat(timeSeries[timestamp]['3. low']),
      })),
      metadata: {
        source: 'alpha-vantage',
        interval: interval,
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Format technical indicator data
   * @private
   */
  formatTechnicalData(symbol, indicator, data) {
    return {
      symbol: symbol,
      indicator: indicator,
      data: data,
      metadata: {
        source: 'alpha-vantage',
        fetchedAt: new Date().toISOString(),
      },
    };
  }
}
