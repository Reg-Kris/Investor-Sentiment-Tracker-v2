import yahooFinance from 'yahoo-finance2';
import alpha from 'alphavantage';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import our existing components
import { CONFIG, SYMBOLS } from './config.js';
import { CacheManager } from './cache-manager.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { MockDataGenerator } from './mock-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../public/data');
const CACHE_DIR = join(DATA_DIR, 'cache');

// Ensure directories exist
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(CACHE_DIR, { recursive: true });

class EnhancedFinancialDataFetcher {
  constructor() {
    console.log('🚀 Initializing enhanced financial data fetcher...');
    
    // Initialize components
    this.cache = new CacheManager(CACHE_DIR);
    this.circuitBreaker = new CircuitBreaker();
    this.mock = new MockDataGenerator();
    
    // Initialize financial APIs
    this.alphaVantage = alpha({ key: CONFIG.alphaVantageKey });
    
    this.validateSetup();
  }

  validateSetup() {
    const hasAlphaVantageKey = CONFIG.alphaVantageKey && CONFIG.alphaVantageKey !== 'demo';
    
    console.log('🔑 Financial API Setup:');
    console.log(`  Yahoo Finance: ✅ (no key required)`);
    console.log(`  Alpha Vantage: ${hasAlphaVantageKey ? '✅' : '⚠️  demo key'}`);
    
    if (!hasAlphaVantageKey) {
      console.warn('⚠️  Using demo Alpha Vantage key - expect limited data');
    }
  }

  async fetchYahooFinanceData(symbol) {
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
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} from Yahoo Finance:`, error.message);
      return this.mock.getMockStockData(symbol);
    }
  }

  async fetchAlphaVantageData(symbol) {
    try {
      console.log(`📈 Fetching ${symbol} data from Alpha Vantage...`);
      
      // Get daily adjusted data
      const dailyData = await this.alphaVantage.data.daily_adjusted(symbol);
      
      if (!dailyData || !dailyData['Time Series (Daily)']) {
        throw new Error('Invalid response from Alpha Vantage');
      }
      
      const timeSeries = dailyData['Time Series (Daily)'];
      const dates = Object.keys(timeSeries).sort((a, b) => new Date(b) - new Date(a));
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
          timestamp: new Date().toISOString()
        },
        historical: dates.slice(0, 7).map(date => ({
          date: date,
          close: parseFloat(timeSeries[date]['4. close']),
          volume: parseInt(timeSeries[date]['6. volume']),
          high: parseFloat(timeSeries[date]['2. high']),
          low: parseFloat(timeSeries[date]['3. low'])
        })),
        metadata: {
          source: 'alpha-vantage',
          fetchedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} from Alpha Vantage:`, error.message);
      return this.mock.getMockStockData(symbol);
    }
  }

  async fetchVixData() {
    try {
      console.log('📊 Fetching VIX data...');
      const vixData = await this.fetchYahooFinanceData('^VIX');
      
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

  interpretVix(vixValue) {
    if (vixValue < 12) return 'Very Low Fear';
    if (vixValue < 20) return 'Low Fear';
    if (vixValue < 30) return 'Normal';
    if (vixValue < 40) return 'High Fear';
    return 'Extreme Fear';
  }

  async fetchFearGreedIndex() {
    try {
      console.log('😨 Fetching Fear & Greed Index...');
      
      // CNN Fear & Greed API endpoint
      const response = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata');
      const data = await response.json();
      
      if (!data.fear_and_greed) {
        throw new Error('Invalid Fear & Greed response');
      }

      const current = data.fear_and_greed;
      
      return {
        current: {
          value: current.score,
          rating: current.rating,
          timestamp: current.timestamp,
          lastUpdated: new Date(current.timestamp * 1000).toISOString()
        },
        historical: data.fear_and_greed_historical?.data?.slice(-30) || [],
        metadata: {
          source: 'cnn-fear-greed',
          fetchedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Error fetching Fear & Greed Index:', error.message);
      return this.mock.getMockFearGreed();
    }
  }

  async fetchCryptocurrencyData() {
    try {
      console.log('₿ Fetching cryptocurrency data...');
      
      const btcData = await this.fetchYahooFinanceData('BTC-USD');
      const ethData = await this.fetchYahooFinanceData('ETH-USD');
      
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

  async fetchCommodityData() {
    try {
      console.log('🏅 Fetching commodity data...');
      
      const goldData = await this.fetchYahooFinanceData('GC=F');
      const oilData = await this.fetchYahooFinanceData('CL=F');
      
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
      results.fearGreed = await this.fetchFearGreedIndex();
      await this.sleep(1000);
      
      results.vix = await this.fetchVixData();
      await this.sleep(1000);
      
      // Phase 2: Major ETFs (using Yahoo Finance for real-time data)
      console.log('🔄 Phase 2: Major ETFs...');
      results.spy = await this.fetchYahooFinanceData('SPY');
      await this.sleep(1000);
      
      results.qqq = await this.fetchYahooFinanceData('QQQ');
      await this.sleep(1000);
      
      results.iwm = await this.fetchYahooFinanceData('IWM');
      await this.sleep(1000);
      
      // Phase 3: Additional markets
      console.log('🔄 Phase 3: Additional markets...');
      results.cryptocurrency = await this.fetchCryptocurrencyData();
      await this.sleep(1000);
      
      results.commodities = await this.fetchCommodityData();
      
      // Phase 4: Market sentiment calculation
      console.log('🔄 Phase 4: Market sentiment analysis...');
      results.sentiment = this.calculateMarketSentiment(results);
      
    } catch (error) {
      console.error('❌ Critical error in enhanced data collection:', error.message);
      // Ensure fallback data
      results.fearGreed = results.fearGreed || this.mock.getMockFearGreed();
      results.spy = results.spy || this.mock.getMockStockData('SPY');
      results.qqq = results.qqq || this.mock.getMockStockData('QQQ');
      results.iwm = results.iwm || this.mock.getMockStockData('IWM');
      results.vix = results.vix || this.mock.getMockVixData();
    }

    // Save enhanced data
    writeFileSync(
      join(DATA_DIR, 'market-data.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('✅ Enhanced market data saved to public/data/market-data.json');
    this.logEnhancedSummary(results);
    
    return results;
  }

  calculateMarketSentiment(data) {
    // Simple sentiment scoring based on multiple factors
    let score = 50; // Start neutral
    
    // Fear & Greed Index influence (30% weight)
    if (data.fearGreed?.current?.value) {
      score += (data.fearGreed.current.value - 50) * 0.3;
    }
    
    // VIX influence (20% weight) - inverse relationship
    if (data.vix?.current?.value) {
      const vixScore = Math.max(0, Math.min(100, 100 - (data.vix.current.value * 2)));
      score += (vixScore - 50) * 0.2;
    }
    
    // Market performance influence (50% weight)
    const marketPerformance = [
      data.spy?.current?.changePercent,
      data.qqq?.current?.changePercent,
      data.iwm?.current?.changePercent
    ].filter(Boolean);
    
    if (marketPerformance.length > 0) {
      const avgPerformance = marketPerformance.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / marketPerformance.length;
      score += avgPerformance * 2.5; // Amplify market moves
    }
    
    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    let rating = 'Neutral';
    if (score < 25) rating = 'Extreme Fear';
    else if (score < 45) rating = 'Fear';
    else if (score > 75) rating = 'Extreme Greed';
    else if (score > 55) rating = 'Greed';
    
    return {
      score: Math.round(score),
      rating: rating,
      timestamp: new Date().toISOString(),
      methodology: 'Composite of Fear/Greed Index (30%), VIX (20%), Market Performance (50%)'
    };
  }

  logEnhancedSummary(results) {
    console.log('📈 Enhanced Data Summary:');
    console.log(`  Fear & Greed: ${results.fearGreed?.current?.value || 'N/A'} (${results.fearGreed?.current?.rating || 'N/A'})`);
    console.log(`  Market Sentiment: ${results.sentiment?.score || 'N/A'} (${results.sentiment?.rating || 'N/A'})`);
    console.log(`  SPY: $${results.spy?.current?.price || 'N/A'} (${results.spy?.current?.changePercent || 'N/A'}%)`);
    console.log(`  QQQ: $${results.qqq?.current?.price || 'N/A'} (${results.qqq?.current?.changePercent || 'N/A'}%)`);
    console.log(`  IWM: $${results.iwm?.current?.price || 'N/A'} (${results.iwm?.current?.changePercent || 'N/A'}%)`);
    console.log(`  VIX: ${results.vix?.current?.value || 'N/A'} (${results.vix?.interpretation || 'N/A'})`);
    console.log(`  BTC: $${results.cryptocurrency?.bitcoin?.current?.price || 'N/A'}`);
    console.log(`  Gold: $${results.commodities?.gold?.current?.price || 'N/A'}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export the class
export default EnhancedFinancialDataFetcher;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new EnhancedFinancialDataFetcher();
  fetcher.fetchAllMarketData().catch(console.error);
}