import yahooFinance from 'yahoo-finance2';

/**
 * Yahoo Finance API fetcher for enhanced market data collection
 * Handles all Yahoo Finance API interactions with proper error handling
 */
export class YahooFinanceFetcher {
  constructor(mockDataGenerator) {
    this.mock = mockDataGenerator;
  }

  /**
   * Fetch comprehensive stock data from Yahoo Finance
   * @param {string} symbol - Stock symbol to fetch
   * @returns {Promise<Object>} - Formatted stock data
   */
  async fetchStockData(symbol) {
    try {
      console.log(`📊 Fetching ${symbol} data from Yahoo Finance...`);
      
      // Get current quote
      const quote = await yahooFinance.quote(symbol);
      
      // Get historical data (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const historical = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      });

      // Get key statistics
      const quoteSummary = await yahooFinance.quoteSummary(symbol, {
        modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData']
      });

      return this.formatStockData(symbol, quote, historical, quoteSummary);
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} from Yahoo Finance:`, error.message);
      return this.mock.getMockStockData(symbol);
    }
  }

  /**
   * Fetch VIX (Volatility Index) data
   * @returns {Promise<Object>} - Formatted VIX data with interpretation
   */
  async fetchVixData() {
    try {
      console.log('📊 Fetching VIX data...');
      const vixData = await this.fetchStockData('^VIX');
      
      return {
        current: {
          value: vixData.current.price,
          change: vixData.current.change,
          changePercent: vixData.current.changePercent,
          timestamp: vixData.current.timestamp
        },
        historical: vixData.historical,
        interpretation: this.interpretVix(vixData.current.price),
        metadata: vixData.metadata
      };
    } catch (error) {
      console.error('❌ Error fetching VIX data:', error.message);
      return this.mock.getMockVixData();
    }
  }

  /**
   * Fetch cryptocurrency data from Yahoo Finance
   * @returns {Promise<Object>} - Bitcoin and Ethereum data
   */
  async fetchCryptocurrencyData() {
    try {
      console.log('₿ Fetching cryptocurrency data...');
      
      const btcData = await this.fetchStockData('BTC-USD');
      const ethData = await this.fetchStockData('ETH-USD');
      
      return {
        bitcoin: btcData,
        ethereum: ethData,
        metadata: {
          source: 'yahoo-finance2',
          fetchedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error fetching cryptocurrency data:', error.message);
      return {
        bitcoin: this.mock.getMockStockData('BTC-USD'),
        ethereum: this.mock.getMockStockData('ETH-USD')
      };
    }
  }

  /**
   * Fetch commodity data from Yahoo Finance
   * @returns {Promise<Object>} - Gold and Oil futures data
   */
  async fetchCommodityData() {
    try {
      console.log('🏅 Fetching commodity data...');
      
      const goldData = await this.fetchStockData('GC=F');
      const oilData = await this.fetchStockData('CL=F');
      
      return {
        gold: goldData,
        oil: oilData,
        metadata: {
          source: 'yahoo-finance2',
          fetchedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error fetching commodity data:', error.message);
      return {
        gold: this.mock.getMockStockData('GC=F'),
        oil: this.mock.getMockStockData('CL=F')
      };
    }
  }

  /**
   * Format raw Yahoo Finance data into standardized structure
   * @private
   */
  formatStockData(symbol, quote, historical, quoteSummary) {
    return {
      symbol: symbol,
      current: {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: ((quote.regularMarketChange / quote.regularMarketPreviousClose) * 100).toFixed(2),
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        timestamp: new Date().toISOString()
      },
      historical: historical.slice(-7), // Last 7 days
      statistics: {
        peRatio: quoteSummary?.summaryDetail?.trailingPE,
        eps: quoteSummary?.defaultKeyStatistics?.trailingEps,
        dividendYield: quoteSummary?.summaryDetail?.dividendYield,
        fiftyTwoWeekHigh: quoteSummary?.summaryDetail?.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quoteSummary?.summaryDetail?.fiftyTwoWeekLow,
        beta: quoteSummary?.summaryDetail?.beta
      },
      metadata: {
        source: 'yahoo-finance2',
        fetchedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Interpret VIX value into human-readable fear level
   * @private
   */
  interpretVix(vixValue) {
    if (vixValue < 12) return 'Very Low Fear';
    if (vixValue < 20) return 'Low Fear';
    if (vixValue < 30) return 'Normal';
    if (vixValue < 40) return 'High Fear';
    return 'Extreme Fear';
  }
}