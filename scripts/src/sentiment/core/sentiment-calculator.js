/**
 * Core sentiment calculation logic
 */
export class SentimentCalculator {
  constructor() {
    this.weights = {
      fearGreed: 0.35,      // Primary sentiment indicator
      market: 0.25,         // Price movements (SPY/QQQ/IWM average)
      volatility: 0.20,     // VIX levels
      options: 0.20         // Put/Call ratios
    };
  }

  /**
   * Calculate composite sentiment score
   */
  calculateComposite(fearGreedScore, marketScore, volatilityScore, optionsScore) {
    return Math.round(
      fearGreedScore * this.weights.fearGreed +
      marketScore * this.weights.market +
      volatilityScore * this.weights.volatility +
      optionsScore * this.weights.options
    );
  }

  /**
   * Analyze Fear & Greed Index
   */
  analyzeFearGreed(fearGreedData) {
    const value = fearGreedData?.current?.value || 50; // Default to neutral if missing
    // CNN's scale is already 0-100, so we use it directly
    return Math.round(value);
  }

  /**
   * Analyze market movement sentiment
   */
  analyzeMarketMovement(data) {
    // Average the change percentages of major indices
    const spyChange = parseFloat(data.spy?.current?.changePercent) || 0;
    const qqqChange = parseFloat(data.qqq?.current?.changePercent) || 0;
    const iwmChange = parseFloat(data.iwm?.current?.changePercent) || 0;
    
    const avgChange = (spyChange + qqqChange + iwmChange) / 3;
    
    // Convert percentage change to 0-100 sentiment scale
    // -5% = 0 (extreme fear), 0% = 50 (neutral), +5% = 100 (extreme greed)
    const score = Math.max(0, Math.min(100, 50 + (avgChange * 10)));
    return Math.round(score);
  }

  /**
   * Analyze volatility sentiment
   */
  analyzeVolatility(vixData) {
    const vix = vixData?.current?.value || 20; // Default to moderate VIX if missing
    
    // VIX interpretation: Lower VIX = Higher sentiment (inverted)
    // VIX 10-15 = Complacent (80-100), VIX 15-25 = Normal (40-80), VIX 25+ = Fear (0-40)
    let score;
    if (vix <= 15) {
      score = 80 + ((15 - vix) / 5) * 20; // 80-100
    } else if (vix <= 25) {
      score = 40 + ((25 - vix) / 10) * 40; // 40-80
    } else {
      score = Math.max(0, 40 - ((vix - 25) / 15) * 40); // 0-40
    }
    
    return Math.round(score);
  }

  /**
   * Analyze options sentiment
   */
  analyzeOptions(optionsData) {
    // Put/Call ratio interpretation: Lower ratio = More bullish
    if (!optionsData) return 50; // Default neutral score if no options data
    
    const spyRatio = optionsData.spy?.putCallRatio || 1;
    const qqqRatio = optionsData.qqq?.putCallRatio || 1;
    const iwmRatio = optionsData.iwm?.putCallRatio || 1;
    
    const avgRatio = (spyRatio + qqqRatio + iwmRatio) / 3;
    
    // Convert ratio to sentiment score
    // Ratio 0.5 = 100 (very bullish), Ratio 1.0 = 50 (neutral), Ratio 2.0 = 0 (very bearish)
    const score = Math.max(0, Math.min(100, 100 - (avgRatio - 0.5) * 66.67));
    return Math.round(score);
  }

  /**
   * Calculate confidence level based on data quality
   */
  calculateConfidence(data) {
    // Calculate confidence based on data recency and completeness
    let confidence = 100;
    
    // Reduce confidence for missing options data
    if (!data.options || !data.options.spy) confidence -= 10;
    if (!data.options || !data.options.qqq) confidence -= 10;
    if (!data.options || !data.options.iwm) confidence -= 10;
    
    // Reduce confidence for stale data (more than 1 day old)
    const dataAge = Date.now() - new Date(data.lastUpdated).getTime();
    const hoursOld = dataAge / (1000 * 60 * 60);
    if (hoursOld > 24) confidence -= 20;
    
    return Math.max(50, confidence);
  }
}