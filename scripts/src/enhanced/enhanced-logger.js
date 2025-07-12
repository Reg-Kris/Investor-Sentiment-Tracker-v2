import { LogFormatter } from './log-formatter.js';

/**
 * Enhanced Logger for market data collection
 * Provides comprehensive logging and summary functionality
 */
export class EnhancedLogger {
  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Log API setup validation status
   * @param {boolean} hasAlphaVantageKey - Whether Alpha Vantage key is valid
   */
  logSetupValidation(hasAlphaVantageKey) {
    console.log('🔑 Financial API Setup:');
    console.log(`  Yahoo Finance: ✅ (no key required)`);
    console.log(`  Alpha Vantage: ${hasAlphaVantageKey ? '✅' : '⚠️  demo key'}`);
    
    if (!hasAlphaVantageKey) {
      console.warn('⚠️  Using demo Alpha Vantage key - expect limited data');
    }
  }

  /**
   * Log phase start
   * @param {string} phase - Phase description
   */
  logPhaseStart(phase) {
    console.log(`🔄 ${phase}...`);
  }

  /**
   * Log individual data fetch
   * @param {string} symbol - Symbol being fetched
   * @param {string} source - Data source (Yahoo Finance, Alpha Vantage, etc.)
   */
  logDataFetch(symbol, source) {
    const emoji = LogFormatter.getSourceEmoji(source);
    console.log(`${emoji} Fetching ${symbol} data from ${source}...`);
  }

  /**
   * Log error with appropriate formatting
   * @param {string} operation - Operation that failed
   * @param {Error} error - Error object
   */
  logError(operation, error) {
    console.error(`❌ Error ${operation}:`, error.message);
  }

  /**
   * Log warning with fallback information
   * @param {string} message - Warning message
   */
  logWarning(message) {
    console.warn(`⚠️ ${message}`);
  }

  /**
   * Log success message
   * @param {string} message - Success message
   */
  logSuccess(message) {
    console.log(`✅ ${message}`);
  }

  /**
   * Log comprehensive data summary
   * @param {Object} results - Complete market data results
   */
  logEnhancedSummary(results) {
    const elapsed = LogFormatter.formatExecutionTime(this.startTime);
    
    console.log('📈 Enhanced Data Summary:');
    console.log(`  ⏱️  Fetch time: ${elapsed}`);
    console.log(`  📊 Data version: ${results.version}`);
    console.log('');
    
    // Market Sentiment
    this.logSentimentSummary(results.sentiment);
    console.log('');
    
    // Core Indicators
    console.log('📈 Core Market Indicators:');
    console.log(`  Fear & Greed: ${results.fearGreed?.current?.value || 'N/A'} (${results.fearGreed?.current?.rating || 'N/A'})`);
    console.log(`  VIX: ${results.vix?.current?.value || 'N/A'} (${results.vix?.interpretation || 'N/A'})`);
    console.log('');
    
    // Major ETFs
    console.log('📊 Major ETFs:');
    console.log(`  SPY: $${results.spy?.current?.price || 'N/A'} (${LogFormatter.formatChange(results.spy?.current)})`);
    console.log(`  QQQ: $${results.qqq?.current?.price || 'N/A'} (${LogFormatter.formatChange(results.qqq?.current)})`);
    console.log(`  IWM: $${results.iwm?.current?.price || 'N/A'} (${LogFormatter.formatChange(results.iwm?.current)})`);
    console.log('');
    
    // Crypto & Commodities
    console.log('₿ Digital Assets & Commodities:');
    console.log(`  Bitcoin: $${results.cryptocurrency?.bitcoin?.current?.price || 'N/A'} (${LogFormatter.formatChange(results.cryptocurrency?.bitcoin?.current)})`);
    console.log(`  Ethereum: $${results.cryptocurrency?.ethereum?.current?.price || 'N/A'} (${LogFormatter.formatChange(results.cryptocurrency?.ethereum?.current)})`);
    console.log(`  Gold: $${results.commodities?.gold?.current?.price || 'N/A'} (${LogFormatter.formatChange(results.commodities?.gold?.current)})`);
    console.log(`  Oil: $${results.commodities?.oil?.current?.price || 'N/A'} (${LogFormatter.formatChange(results.commodities?.oil?.current)})`);
    console.log('');
    
    // Data Sources
    this.logDataSources(results);
  }

  /**
   * Log sentiment analysis summary
   * @private
   */
  logSentimentSummary(sentiment) {
    if (!sentiment) return;
    
    console.log('🎯 Market Sentiment Analysis:');
    console.log(`  Score: ${sentiment.score}/100 (${sentiment.rating})`);
    
    if (sentiment.components) {
      console.log('  Components:');
      if (sentiment.components.fearGreed) {
        console.log(`    Fear & Greed: ${sentiment.components.fearGreed.value} (${(sentiment.components.fearGreed.weight * 100)}% weight)`);
      }
      if (sentiment.components.vix) {
        console.log(`    VIX Impact: ${sentiment.components.vix.value.toFixed(2)} (${(sentiment.components.vix.weight * 100)}% weight)`);
      }
      if (sentiment.components.marketPerformance) {
        console.log(`    Market Perf: ${sentiment.components.marketPerformance.avgPerformance?.toFixed(2)}% avg (${(sentiment.components.marketPerformance.weight * 100)}% weight)`);
      }
    }
  }

  /**
   * Log data sources summary
   * @private
   */
  logDataSources(results) {
    const sources = LogFormatter.getUniqueSources(results);
    
    console.log('📡 Data Sources:');
    sources.forEach(source => {
      console.log(`  ${LogFormatter.getSourceEmoji(source)} ${source}`);
    });
  }


  /**
   * Log performance metrics
   * @param {Object} metrics - Performance metrics object
   */
  logPerformanceMetrics(metrics) {
    console.log('⚡ Performance Metrics:');
    console.log(`  Total requests: ${metrics.totalRequests || 0}`);
    console.log(`  Successful: ${metrics.successful || 0}`);
    console.log(`  Failed: ${metrics.failed || 0}`);
    console.log(`  Cache hits: ${metrics.cacheHits || 0}`);
    console.log(`  Average response time: ${metrics.avgResponseTime || 0}ms`);
  }

  /**
   * Log sector analysis
   * @param {Object} sectorData - Sector performance data
   */
  logSectorAnalysis(sectorData) {
    if (!sectorData?.analysis) return;
    
    const { analysis } = sectorData;
    
    console.log('🏗️ Sector Performance:');
    console.log(`  Market breadth: ${LogFormatter.formatMarketBreadth(analysis.breadth)}`);
    console.log(`  Average: ${analysis.averagePerformance}%`);
    
    if (analysis.topPerformers?.length > 0) {
      console.log('  🥇 Top performers:');
      console.log(LogFormatter.formatSectorPerformers(analysis.topPerformers, true));
    }
    
    if (analysis.bottomPerformers?.length > 0) {
      console.log('  🥉 Bottom performers:');
      console.log(LogFormatter.formatSectorPerformers(analysis.bottomPerformers, false));
    }
  }

  /**
   * Create execution summary for output file
   * @param {Object} results - Market data results
   * @returns {Object} - Summary object for JSON output
   */
  createExecutionSummary(results) {
    const elapsed = LogFormatter.formatExecutionTime(this.startTime);
    
    return {
      executionTime: elapsed,
      timestamp: new Date().toISOString(),
      dataVersion: results.version,
      summary: {
        fearGreedIndex: results.fearGreed?.current?.value,
        marketSentiment: results.sentiment?.score,
        vixLevel: results.vix?.current?.value,
        majorIndicesAvg: LogFormatter.calculateMajorIndicesAverage(results)
      },
      dataSources: LogFormatter.getUniqueSources(results),
      status: 'completed'
    };
  }
}