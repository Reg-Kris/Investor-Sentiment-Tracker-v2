/**
 * Market Sentiment Analyzer for enhanced market data collection
 * Calculates composite market sentiment scores based on multiple indicators
 */
export class MarketSentimentAnalyzer {
  constructor() {
    // Sentiment calculation weights
    this.weights = {
      fearGreedIndex: 0.3, // 30% weight
      vixIndex: 0.2, // 20% weight
      marketPerformance: 0.5, // 50% weight
    };
  }

  /**
   * Calculate comprehensive market sentiment score
   * @param {Object} marketData - Complete market data object
   * @returns {Object} - Sentiment analysis with score and rating
   */
  calculateMarketSentiment(marketData) {
    let score = 50; // Start neutral
    const components = {};

    // Fear & Greed Index influence (30% weight)
    if (marketData.fearGreed?.current?.value) {
      const fearGreedContribution =
        (marketData.fearGreed.current.value - 50) * this.weights.fearGreedIndex;
      score += fearGreedContribution;
      components.fearGreed = {
        value: marketData.fearGreed.current.value,
        contribution: fearGreedContribution,
        weight: this.weights.fearGreedIndex,
      };
    }

    // VIX influence (20% weight) - inverse relationship
    if (marketData.vix?.current?.value) {
      const vixScore = Math.max(
        0,
        Math.min(100, 100 - marketData.vix.current.value * 2),
      );
      const vixContribution = (vixScore - 50) * this.weights.vixIndex;
      score += vixContribution;
      components.vix = {
        value: marketData.vix.current.value,
        normalizedScore: vixScore,
        contribution: vixContribution,
        weight: this.weights.vixIndex,
      };
    }

    // Market performance influence (50% weight)
    const marketPerformance = this.calculateMarketPerformance(marketData);
    if (marketPerformance.avgPerformance !== null) {
      const performanceContribution = marketPerformance.avgPerformance * 2.5; // Amplify market moves
      score += performanceContribution * this.weights.marketPerformance;
      components.marketPerformance = {
        ...marketPerformance,
        contribution: performanceContribution * this.weights.marketPerformance,
        weight: this.weights.marketPerformance,
      };
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return {
      score: Math.round(score),
      rating: this.getSentimentRating(score),
      timestamp: new Date().toISOString(),
      methodology: `Composite of Fear/Greed Index (${this.weights.fearGreedIndex * 100}%), VIX (${this.weights.vixIndex * 100}%), Market Performance (${this.weights.marketPerformance * 100}%)`,
      components: components,
    };
  }

  /**
   * Calculate average market performance from major ETFs
   * @private
   */
  calculateMarketPerformance(marketData) {
    const performances = [];
    const details = {};

    // Collect performance data from major ETFs
    if (marketData.spy?.current?.changePercent) {
      const spyPerf = parseFloat(marketData.spy.current.changePercent);
      performances.push(spyPerf);
      details.spy = spyPerf;
    }

    if (marketData.qqq?.current?.changePercent) {
      const qqqPerf = parseFloat(marketData.qqq.current.changePercent);
      performances.push(qqqPerf);
      details.qqq = qqqPerf;
    }

    if (marketData.iwm?.current?.changePercent) {
      const iwmPerf = parseFloat(marketData.iwm.current.changePercent);
      performances.push(iwmPerf);
      details.iwm = iwmPerf;
    }

    const avgPerformance =
      performances.length > 0
        ? performances.reduce((a, b) => a + b, 0) / performances.length
        : null;

    return {
      avgPerformance: avgPerformance,
      individualPerformances: details,
      dataPoints: performances.length,
    };
  }

  /**
   * Get sentiment rating based on score
   * @private
   */
  getSentimentRating(score) {
    if (score < 25) return 'Extreme Fear';
    if (score < 45) return 'Fear';
    if (score < 55) return 'Neutral';
    if (score > 75) return 'Extreme Greed';
    if (score > 55) return 'Greed';
    return 'Neutral';
  }

  /**
   * Fetch and analyze Fear & Greed Index from CNN
   * @returns {Promise<Object>} - Fear & Greed Index data
   */
  async fetchFearGreedIndex() {
    try {
      console.log('😨 Fetching Fear & Greed Index...');

      // CNN Fear & Greed API endpoint
      const response = await fetch(
        'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
      );
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
          lastUpdated: new Date(current.timestamp * 1000).toISOString(),
        },
        historical: data.fear_and_greed_historical?.data?.slice(-30) || [],
        metadata: {
          source: 'cnn-fear-greed',
          fetchedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Error fetching Fear & Greed Index:', error.message);
      throw error; // Let caller handle with mock data
    }
  }

  /**
   * Analyze sector performance for additional sentiment context
   * @param {Object} marketData - Market data containing sector information
   * @returns {Object} - Sector analysis results
   */
  analyzeSectorPerformance(marketData) {
    const sectors = {
      technology: marketData.qqq?.current?.changePercent,
      smallCap: marketData.iwm?.current?.changePercent,
      broadMarket: marketData.spy?.current?.changePercent,
    };

    const performing = [];
    const underperforming = [];

    Object.entries(sectors).forEach(([sector, performance]) => {
      if (performance !== undefined) {
        const perf = parseFloat(performance);
        if (perf > 0.5) performing.push({ sector, performance: perf });
        if (perf < -0.5) underperforming.push({ sector, performance: perf });
      }
    });

    return {
      strongSectors: performing.sort((a, b) => b.performance - a.performance),
      weakSectors: underperforming.sort(
        (a, b) => a.performance - b.performance,
      ),
      marketBreadth: {
        positive: performing.length,
        negative: underperforming.length,
        neutral:
          Object.keys(sectors).length -
          performing.length -
          underperforming.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate sentiment summary text
   * @param {Object} sentimentData - Calculated sentiment data
   * @returns {string} - Human-readable sentiment summary
   */
  generateSentimentSummary(sentimentData) {
    const { score, rating, components } = sentimentData;

    let summary = `Market sentiment is currently showing ${rating.toLowerCase()} with a score of ${score}/100. `;

    if (components.fearGreed) {
      summary += `The Fear & Greed Index is at ${components.fearGreed.value} (${this.getFearGreedLabel(components.fearGreed.value)}). `;
    }

    if (components.vix) {
      summary += `Market volatility (VIX) is at ${components.vix.value.toFixed(2)}. `;
    }

    if (components.marketPerformance) {
      const avgPerf = components.marketPerformance.avgPerformance;
      if (avgPerf > 0) {
        summary += `Major market indices are up an average of ${avgPerf.toFixed(2)}%.`;
      } else {
        summary += `Major market indices are down an average of ${Math.abs(avgPerf).toFixed(2)}%.`;
      }
    }

    return summary;
  }

  /**
   * Get Fear & Greed label
   * @private
   */
  getFearGreedLabel(value) {
    if (value < 25) return 'Extreme Fear';
    if (value < 45) return 'Fear';
    if (value < 55) return 'Neutral';
    if (value > 75) return 'Extreme Greed';
    return 'Greed';
  }
}
