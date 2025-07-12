/**
 * Timeframe analysis for sentiment trends
 */
export class TimeframeAnalyzer {
  
  /**
   * Generate sentiment data for different timeframes
   */
  generateTimeframeData(data) {
    // Analyze sentiment trends over different periods
    const fearGreedHist = data.fearGreed.historical;
    const spyHist = data.spy.historical;
    const vixHist = data.vix.historical;

    return {
      '1d': this.analyzeTimeframe(data, 1),
      '5d': this.analyzeTimeframe(data, 5),
      '1m': this.analyzeTimeframe(data, 30)
    };
  }

  /**
   * Analyze sentiment for specific timeframe
   */
  analyzeTimeframe(data, days) {
    // Calculate average sentiment over the timeframe
    const fearGreedAvg = this.getAverageValue(data.fearGreed.historical, days, 'value');
    const spyChange = this.getPercentChange(data.spy.historical, days, 'price');
    const vixAvg = this.getAverageValue(data.vix.historical, days, 'value');

    // Use same scoring logic but with historical averages
    const fearGreedScore = Math.round(fearGreedAvg);
    const marketScore = Math.max(0, Math.min(100, 50 + (spyChange * 10)));
    const volatilityScore = vixAvg <= 15 ? 80 + ((15 - vixAvg) / 5) * 20 : 
                           vixAvg <= 25 ? 40 + ((25 - vixAvg) / 10) * 40 : 
                           Math.max(0, 40 - ((vixAvg - 25) / 15) * 40);

    const compositeScore = Math.round(
      fearGreedScore * 0.4 + marketScore * 0.4 + volatilityScore * 0.2
    );

    return {
      score: compositeScore,
      sentiment: this.getSentimentLabel(compositeScore),
      message: this.getSentimentMessage(compositeScore),
      trend: this.calculateTrend(data, days)
    };
  }

  /**
   * Calculate trend direction
   */
  calculateTrend(data, days) {
    // Simple trend calculation based on fear/greed movement
    const values = data.fearGreed.historical.slice(0, days).map(item => item.value);
    if (values.length < 2) return 'neutral';
    
    const start = values[values.length - 1];
    const end = values[0];
    const change = end - start;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'deteriorating';
    return 'stable';
  }

  /**
   * Get average value from array
   */
  getAverageValue(array, days, key) {
    const slice = array.slice(0, Math.min(days, array.length));
    return slice.reduce((sum, item) => sum + item[key], 0) / slice.length;
  }

  /**
   * Get percent change over period
   */
  getPercentChange(array, days, key) {
    if (array.length < 2) return 0;
    const endIndex = Math.min(days - 1, array.length - 1);
    const start = array[endIndex][key];
    const end = array[0][key];
    return ((end - start) / start) * 100;
  }

  /**
   * Get sentiment label from score
   */
  getSentimentLabel(score) {
    if (score >= 80) return 'EXTREME GREED';
    if (score >= 65) return 'GREED';
    if (score >= 55) return 'MILD GREED';
    if (score >= 45) return 'NEUTRAL';
    if (score >= 35) return 'MILD FEAR';
    if (score >= 20) return 'FEAR';
    return 'EXTREME FEAR';
  }

  /**
   * Get sentiment message from score
   */
  getSentimentMessage(score) {
    if (score >= 80) return 'Markets are extremely optimistic';
    if (score >= 65) return 'Investors are greedy';
    if (score >= 55) return 'Markets are slightly bullish';
    if (score >= 45) return 'Markets are balanced';
    if (score >= 35) return 'Markets are slightly bearish';
    if (score >= 20) return 'Investors are fearful';
    return 'Markets are extremely pessimistic';
  }
}