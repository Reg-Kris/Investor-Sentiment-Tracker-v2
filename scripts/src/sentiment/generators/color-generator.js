/**
 * Color generation for sentiment indicators
 */
export class ColorGenerator {
  /**
   * Get Fear & Greed color
   */
  getFearGreedColor(value) {
    if (value >= 75) return '#10b981'; // green
    if (value >= 55) return '#f59e0b'; // yellow
    if (value >= 45) return '#6b7280'; // gray
    if (value >= 25) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  /**
   * Get color based on change direction
   */
  getChangeColor(change) {
    return change >= 0 ? '#10b981' : '#ef4444';
  }

  /**
   * Get VIX color based on level
   */
  getVixColor(vix) {
    if (vix >= 25) return '#ef4444';
    if (vix >= 18) return '#f59e0b';
    return '#10b981';
  }

  /**
   * Get sentiment color based on score
   */
  getSentimentColor(score) {
    if (score >= 80) return '#10b981'; // extreme greed - green
    if (score >= 65) return '#16a34a'; // greed - darker green
    if (score >= 55) return '#84cc16'; // mild greed - lime
    if (score >= 45) return '#6b7280'; // neutral - gray
    if (score >= 35) return '#f59e0b'; // mild fear - amber
    if (score >= 20) return '#f97316'; // fear - orange
    return '#ef4444'; // extreme fear - red
  }

  /**
   * Get options sentiment color
   */
  getOptionsColor(ratio) {
    if (!ratio) return '#6b7280'; // gray for unavailable
    if (ratio >= 1.5) return '#ef4444'; // very bearish - red
    if (ratio >= 1.1) return '#f97316'; // bearish - orange
    if (ratio >= 0.9) return '#6b7280'; // neutral - gray
    if (ratio >= 0.7) return '#16a34a'; // bullish - green
    return '#10b981'; // very bullish - bright green
  }
}
