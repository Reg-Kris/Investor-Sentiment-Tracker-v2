/**
 * Log Formatter Utility
 * Handles formatting and display utilities for enhanced logging
 */
export class LogFormatter {
  /**
   * Format price change for display
   * @param {Object} current - Current price data
   * @returns {string} - Formatted change string
   */
  static formatChange(current) {
    if (!current?.changePercent) return 'N/A';
    
    const change = parseFloat(current.changePercent);
    const sign = change >= 0 ? '+' : '';
    const emoji = change >= 0 ? '📈' : '📉';
    
    return `${sign}${change}% ${emoji}`;
  }

  /**
   * Get emoji for data source
   * @param {string} source - Data source identifier
   * @returns {string} - Appropriate emoji
   */
  static getSourceEmoji(source) {
    const emojiMap = {
      'yahoo-finance2': '📊',
      'alpha-vantage': '📈',
      'cnn-fear-greed': '😨',
      'mock-data': '🎭',
      'sector-etfs': '🏗️',
      'international-indices': '🌍'
    };
    
    return emojiMap[source] || '📡';
  }

  /**
   * Calculate average performance of major indices
   * @param {Object} results - Market data results
   * @returns {string|null} - Average performance percentage
   */
  static calculateMajorIndicesAverage(results) {
    const performances = [
      results.spy?.current?.changePercent,
      results.qqq?.current?.changePercent,
      results.iwm?.current?.changePercent
    ].filter(p => p !== undefined).map(p => parseFloat(p));
    
    return performances.length > 0 
      ? (performances.reduce((a, b) => a + b, 0) / performances.length).toFixed(2)
      : null;
  }

  /**
   * Get unique data sources from results
   * @param {Object} results - Market data results
   * @returns {Array} - Array of unique data sources
   */
  static getUniqueSources(results) {
    const sources = new Set();
    
    const collectSources = (obj) => {
      if (obj?.metadata?.source) sources.add(obj.metadata.source);
      if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(collectSources);
      }
    };
    
    collectSources(results);
    return Array.from(sources);
  }

  /**
   * Format execution time
   * @param {number} startTime - Start timestamp in milliseconds
   * @returns {string} - Formatted execution time
   */
  static formatExecutionTime(startTime) {
    return ((Date.now() - startTime) / 1000).toFixed(1) + 's';
  }

  /**
   * Format sector performance display
   * @param {Array} performers - Array of sector performance data
   * @param {boolean} isTopPerformers - Whether these are top or bottom performers
   * @returns {string} - Formatted sector list
   */
  static formatSectorPerformers(performers, isTopPerformers = true) {
    if (!performers || performers.length === 0) return 'None';
    
    return performers.map((sector, index) => {
      const sign = isTopPerformers ? '+' : '';
      return `    ${index + 1}. ${sector.sector}: ${sign}${sector.performance.toFixed(2)}%`;
    }).join('\n');
  }

  /**
   * Format market breadth display
   * @param {Object} breadth - Market breadth data
   * @returns {string} - Formatted breadth string
   */
  static formatMarketBreadth(breadth) {
    return `${breadth.positive}↗️ ${breadth.negative}↘️ ${breadth.neutral}➡️`;
  }
}