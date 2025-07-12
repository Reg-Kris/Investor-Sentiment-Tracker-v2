/**
 * Message and color generation for sentiment indicators
 */
export class MessageGenerator {

  /**
   * Generate Fear & Greed specific messages
   */
  getFearGreedMessage(value) {
    if (value >= 75) return 'Extreme greed in markets';
    if (value >= 55) return 'Markets showing greed';
    if (value >= 45) return 'Market sentiment balanced';
    if (value >= 25) return 'Fear dominates markets';
    return 'Extreme fear in markets';
  }

  /**
   * Generate market index messages
   */
  getMarketMessage(index, change) {
    if (change >= 2) return `${index} rallying strongly`;
    if (change >= 0.5) return `${index} trending higher`;
    if (change >= -0.5) return `${index} trading flat`;
    if (change >= -2) return `${index} under pressure`;
    return `${index} declining sharply`;
  }

  /**
   * Generate VIX messages
   */
  getVixMessage(vix) {
    if (vix >= 30) return 'Market fear is elevated';
    if (vix >= 20) return 'Volatility is moderate';
    if (vix >= 15) return 'Markets are calm';
    return 'Complacency in markets';
  }

  /**
   * Generate options sentiment messages
   */
  getOptionsMessage(symbol, ratio) {
    if (!ratio) return `${symbol} options data unavailable`;
    if (ratio >= 1.5) return `${symbol} traders very bearish`;
    if (ratio >= 1.1) return `${symbol} traders bearish`;
    if (ratio >= 0.9) return `${symbol} traders neutral`;
    if (ratio >= 0.7) return `${symbol} traders bullish`;
    return `${symbol} traders very bullish`;
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