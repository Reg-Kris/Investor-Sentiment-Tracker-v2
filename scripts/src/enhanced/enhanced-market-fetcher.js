/**
 * Enhanced Market Data Fetcher
 * Coordinates fetching of all market data types with proper sequencing and error handling
 */
export class EnhancedMarketFetcher {
  constructor(yahooFetcher, alphaVantageFetcher, sentimentAnalyzer, mockDataGenerator) {
    this.yahoo = yahooFetcher;
    this.alphaVantage = alphaVantageFetcher;
    this.sentiment = sentimentAnalyzer;
    this.mock = mockDataGenerator;
  }

  /**
   * Fetch all market data in coordinated phases
   * @returns {Promise<Object>} - Complete market data object
   */
  async fetchAllMarketData() {
    console.log('🚀 Starting enhanced market data collection...');
    
    const results = {
      lastUpdated: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
      version: '2.0.0-enhanced'
    };
    
    try {
      // Phase 1: Core market indicators
      console.log('🔄 Phase 1: Core market indicators...');
      await this.fetchCoreIndicators(results);
      
      // Phase 2: Major ETFs (using Yahoo Finance for real-time data)
      console.log('🔄 Phase 2: Major ETFs...');
      await this.fetchMajorETFs(results);
      
      // Phase 3: Additional markets
      console.log('🔄 Phase 3: Additional markets...');
      await this.fetchAdditionalMarkets(results);
      
      // Phase 4: Market sentiment calculation
      console.log('🔄 Phase 4: Market sentiment analysis...');
      results.sentiment = this.sentiment.calculateMarketSentiment(results);
      
    } catch (error) {
      console.error('❌ Critical error in enhanced data collection:', error.message);
      // Ensure fallback data
      await this.ensureFallbackData(results);
    }

    return results;
  }

  /**
   * Fetch core market indicators (Fear & Greed, VIX)
   * @private
   */
  async fetchCoreIndicators(results) {
    try {
      results.fearGreed = await this.sentiment.fetchFearGreedIndex();
    } catch (error) {
      console.warn('⚠️ Using mock Fear & Greed data');
      results.fearGreed = this.mock.getMockFearGreed();
    }
    
    await this.sleep(1000);
    
    try {
      results.vix = await this.yahoo.fetchVixData();
    } catch (error) {
      console.warn('⚠️ Using mock VIX data');
      results.vix = this.mock.getMockVixData();
    }
    
    await this.sleep(1000);
  }

  /**
   * Fetch major ETF data
   * @private
   */
  async fetchMajorETFs(results) {
    const etfs = ['SPY', 'QQQ', 'IWM'];
    
    for (const etf of etfs) {
      try {
        results[etf.toLowerCase()] = await this.yahoo.fetchStockData(etf);
      } catch (error) {
        console.warn(`⚠️ Using mock ${etf} data`);
        results[etf.toLowerCase()] = this.mock.getMockStockData(etf);
      }
      await this.sleep(1000);
    }
  }

  /**
   * Fetch additional market data (crypto, commodities)
   * @private
   */
  async fetchAdditionalMarkets(results) {
    try {
      results.cryptocurrency = await this.yahoo.fetchCryptocurrencyData();
    } catch (error) {
      console.warn('⚠️ Using mock cryptocurrency data');
      results.cryptocurrency = {
        bitcoin: this.mock.getMockStockData('BTC-USD'),
        ethereum: this.mock.getMockStockData('ETH-USD')
      };
    }
    
    await this.sleep(1000);
    
    try {
      results.commodities = await this.yahoo.fetchCommodityData();
    } catch (error) {
      console.warn('⚠️ Using mock commodity data');
      results.commodities = {
        gold: this.mock.getMockStockData('GC=F'),
        oil: this.mock.getMockStockData('CL=F')
      };
    }
  }

  /**
   * Ensure fallback data exists for all required fields
   * @private
   */
  async ensureFallbackData(results) {
    results.fearGreed = results.fearGreed || this.mock.getMockFearGreed();
    results.spy = results.spy || this.mock.getMockStockData('SPY');
    results.qqq = results.qqq || this.mock.getMockStockData('QQQ');
    results.iwm = results.iwm || this.mock.getMockStockData('IWM');
    results.vix = results.vix || this.mock.getMockVixData();
    
    results.cryptocurrency = results.cryptocurrency || {
      bitcoin: this.mock.getMockStockData('BTC-USD'),
      ethereum: this.mock.getMockStockData('ETH-USD')
    };
    
    results.commodities = results.commodities || {
      gold: this.mock.getMockStockData('GC=F'),
      oil: this.mock.getMockStockData('CL=F')
    };
  }

  /**
   * Fetch sector-specific ETF data for broader market analysis
   * @returns {Promise<Object>} - Sector performance data
   */
  async fetchSectorData() {
    console.log('🏗️ Fetching sector ETF data...');
    
    const sectors = {
      technology: 'XLK',
      financials: 'XLF',
      healthcare: 'XLV',
      energy: 'XLE',
      utilities: 'XLU',
      industrials: 'XLI',
      materials: 'XLB',
      consumer_discretionary: 'XLY',
      consumer_staples: 'XLP',
      real_estate: 'XLRE',
      communications: 'XLC'
    };
    
    const sectorData = {};
    
    for (const [sectorName, symbol] of Object.entries(sectors)) {
      try {
        sectorData[sectorName] = await this.yahoo.fetchStockData(symbol);
        await this.sleep(500); // Shorter delay for sector data
      } catch (error) {
        console.warn(`⚠️ Failed to fetch ${sectorName} sector data (${symbol})`);
        sectorData[sectorName] = this.mock.getMockStockData(symbol);
      }
    }
    
    return {
      sectors: sectorData,
      analysis: this.analyzeSectorPerformance(sectorData),
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'sector-etfs'
      }
    };
  }

  /**
   * Analyze sector performance
   * @private
   */
  analyzeSectorPerformance(sectorData) {
    const performances = Object.entries(sectorData).map(([sector, data]) => ({
      sector,
      performance: parseFloat(data.current?.changePercent || 0),
      price: data.current?.price
    }));
    
    const topPerformers = performances
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 3);
    
    const bottomPerformers = performances
      .sort((a, b) => a.performance - b.performance)
      .slice(0, 3);
    
    const avgPerformance = performances.reduce((sum, p) => sum + p.performance, 0) / performances.length;
    
    return {
      topPerformers,
      bottomPerformers,
      averagePerformance: avgPerformance.toFixed(2),
      breadth: {
        positive: performances.filter(p => p.performance > 0).length,
        negative: performances.filter(p => p.performance < 0).length,
        neutral: performances.filter(p => p.performance === 0).length
      }
    };
  }

  /**
   * Fetch international market data
   * @returns {Promise<Object>} - International market indices
   */
  async fetchInternationalData() {
    console.log('🌍 Fetching international market data...');
    
    const internationalMarkets = {
      ftse: 'UKX', // FTSE 100
      dax: 'DAX',  // DAX 30
      nikkei: 'N225', // Nikkei 225
      shanghai: '000001.SS', // Shanghai Composite
      hangseng: 'HSI' // Hang Seng
    };
    
    const marketData = {};
    
    for (const [marketName, symbol] of Object.entries(internationalMarkets)) {
      try {
        marketData[marketName] = await this.yahoo.fetchStockData(symbol);
        await this.sleep(500);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch ${marketName} data (${symbol})`);
        marketData[marketName] = this.mock.getMockStockData(symbol);
      }
    }
    
    return {
      markets: marketData,
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'international-indices'
      }
    };
  }

  /**
   * Sleep utility for rate limiting
   * @private
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}