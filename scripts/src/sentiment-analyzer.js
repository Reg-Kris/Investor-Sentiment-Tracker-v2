import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../public/data');

class SentimentAnalyzer {
  constructor() {
    this.weights = {
      fearGreed: 0.35, // Primary sentiment indicator
      market: 0.25, // Price movements (SPY/QQQ/IWM average)
      volatility: 0.2, // VIX levels
      options: 0.2, // Put/Call ratios
    };
  }

  analyzeMarketSentiment(data) {
    console.log('🧠 Analyzing market sentiment...');

    // Calculate individual scores (0-100 scale)
    const fearGreedScore = this.analyzeFearGreed(data.fearGreed);
    const marketScore = this.analyzeMarketMovement(data);
    const volatilityScore = this.analyzeVolatility(data.vix);
    const optionsScore = this.analyzeOptions(data.options);

    // Weighted composite score
    const compositeScore = Math.round(
      fearGreedScore * this.weights.fearGreed +
        marketScore * this.weights.market +
        volatilityScore * this.weights.volatility +
        optionsScore * this.weights.options,
    );

    // Generate time-based data (1d, 5d, 1m)
    const timeframes = this.generateTimeframeData(data);

    return {
      overall: {
        score: compositeScore,
        sentiment: this.getSentimentLabel(compositeScore),
        message: this.getSentimentMessage(compositeScore),
        confidence: this.calculateConfidence(data),
        components: {
          fearGreed: { score: fearGreedScore, weight: this.weights.fearGreed },
          market: { score: marketScore, weight: this.weights.market },
          volatility: {
            score: volatilityScore,
            weight: this.weights.volatility,
          },
          options: { score: optionsScore, weight: this.weights.options },
        },
      },
      timeframes,
      indicators: this.generateIndicatorData(data),
      lastAnalyzed: new Date().toISOString(),
    };
  }

  analyzeFearGreed(fearGreedData) {
    const value = fearGreedData.current.value;
    // CNN's scale is already 0-100, so we use it directly
    return Math.round(value);
  }

  analyzeMarketMovement(data) {
    // Average the change percentages of major indices
    const spyChange = data.spy.current.changePercent || 0;
    const qqqChange = data.qqq.current.changePercent || 0;
    const iwmChange = data.iwm.current.changePercent || 0;

    const avgChange = (spyChange + qqqChange + iwmChange) / 3;

    // Convert percentage change to 0-100 sentiment scale
    // -5% = 0 (extreme fear), 0% = 50 (neutral), +5% = 100 (extreme greed)
    const score = Math.max(0, Math.min(100, 50 + avgChange * 10));
    return Math.round(score);
  }

  analyzeVolatility(vixData) {
    const vix = vixData.current.value;

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

  analyzeOptions(optionsData) {
    // Put/Call ratio interpretation: Lower ratio = More bullish
    const spyRatio = optionsData.spy?.putCallRatio || 1;
    const qqqRatio = optionsData.qqq?.putCallRatio || 1;
    const iwmRatio = optionsData.iwm?.putCallRatio || 1;

    const avgRatio = (spyRatio + qqqRatio + iwmRatio) / 3;

    // Convert ratio to sentiment score
    // Ratio 0.5 = 100 (very bullish), Ratio 1.0 = 50 (neutral), Ratio 2.0 = 0 (very bearish)
    const score = Math.max(0, Math.min(100, 100 - (avgRatio - 0.5) * 66.67));
    return Math.round(score);
  }

  generateTimeframeData(data) {
    // Analyze sentiment trends over different periods
    const fearGreedHist = data.fearGreed.historical;
    const spyHist = data.spy.historical;
    const vixHist = data.vix.historical;

    return {
      '1d': this.analyzeTimeframe(data, 1),
      '5d': this.analyzeTimeframe(data, 5),
      '1m': this.analyzeTimeframe(data, 30),
    };
  }

  analyzeTimeframe(data, days) {
    // Calculate average sentiment over the timeframe
    const fearGreedAvg = this.getAverageValue(
      data.fearGreed.historical,
      days,
      'value',
    );
    const spyChange = this.getPercentChange(data.spy.historical, days, 'price');
    const vixAvg = this.getAverageValue(data.vix.historical, days, 'value');

    // Use same scoring logic but with historical averages
    const fearGreedScore = Math.round(fearGreedAvg);
    const marketScore = Math.max(0, Math.min(100, 50 + spyChange * 10));
    const volatilityScore =
      vixAvg <= 15
        ? 80 + ((15 - vixAvg) / 5) * 20
        : vixAvg <= 25
          ? 40 + ((25 - vixAvg) / 10) * 40
          : Math.max(0, 40 - ((vixAvg - 25) / 15) * 40);

    const compositeScore = Math.round(
      fearGreedScore * 0.4 + marketScore * 0.4 + volatilityScore * 0.2,
    );

    return {
      score: compositeScore,
      sentiment: this.getSentimentLabel(compositeScore),
      message: this.getSentimentMessage(compositeScore),
      trend: this.calculateTrend(data, days),
    };
  }

  generateIndicatorData(data) {
    return {
      fearGreed: {
        value: Math.round(data.fearGreed.current.value),
        label: data.fearGreed.current.rating,
        message: this.getFearGreedMessage(data.fearGreed.current.value),
        color: this.getFearGreedColor(data.fearGreed.current.value),
      },
      spy: {
        price: data.spy.current.price,
        change: data.spy.current.changePercent,
        message: this.getMarketMessage(
          'S&P 500',
          data.spy.current.changePercent,
        ),
        color: this.getChangeColor(data.spy.current.changePercent),
      },
      qqq: {
        price: data.qqq.current.price,
        change: data.qqq.current.changePercent,
        message: this.getMarketMessage(
          'Nasdaq 100',
          data.qqq.current.changePercent,
        ),
        color: this.getChangeColor(data.qqq.current.changePercent),
      },
      iwm: {
        price: data.iwm.current.price,
        change: data.iwm.current.changePercent,
        message: this.getMarketMessage(
          'Russell 2000',
          data.iwm.current.changePercent,
        ),
        color: this.getChangeColor(data.iwm.current.changePercent),
      },
      vix: {
        value: Math.round(data.vix.current.value * 10) / 10,
        message: this.getVixMessage(data.vix.current.value),
        color: this.getVixColor(data.vix.current.value),
      },
      options: {
        spy: this.getOptionsMessage('SPY', data.options.spy?.putCallRatio),
        qqq: this.getOptionsMessage('QQQ', data.options.qqq?.putCallRatio),
        iwm: this.getOptionsMessage('IWM', data.options.iwm?.putCallRatio),
      },
    };
  }

  getSentimentLabel(score) {
    if (score >= 80) return 'EXTREME GREED';
    if (score >= 65) return 'GREED';
    if (score >= 55) return 'MILD GREED';
    if (score >= 45) return 'NEUTRAL';
    if (score >= 35) return 'MILD FEAR';
    if (score >= 20) return 'FEAR';
    return 'EXTREME FEAR';
  }

  getSentimentMessage(score) {
    if (score >= 80) return 'Markets are extremely optimistic';
    if (score >= 65) return 'Investors are greedy';
    if (score >= 55) return 'Markets are slightly bullish';
    if (score >= 45) return 'Markets are balanced';
    if (score >= 35) return 'Markets are slightly bearish';
    if (score >= 20) return 'Investors are fearful';
    return 'Markets are extremely pessimistic';
  }

  getFearGreedMessage(value) {
    if (value >= 75) return 'Extreme greed in markets';
    if (value >= 55) return 'Markets showing greed';
    if (value >= 45) return 'Market sentiment balanced';
    if (value >= 25) return 'Fear dominates markets';
    return 'Extreme fear in markets';
  }

  getMarketMessage(index, change) {
    if (change >= 2) return `${index} rallying strongly`;
    if (change >= 0.5) return `${index} trending higher`;
    if (change >= -0.5) return `${index} trading flat`;
    if (change >= -2) return `${index} under pressure`;
    return `${index} declining sharply`;
  }

  getVixMessage(vix) {
    if (vix >= 30) return 'Market fear is elevated';
    if (vix >= 20) return 'Volatility is moderate';
    if (vix >= 15) return 'Markets are calm';
    return 'Complacency in markets';
  }

  getOptionsMessage(symbol, ratio) {
    if (!ratio) return `${symbol} options data unavailable`;
    if (ratio >= 1.5) return `${symbol} traders very bearish`;
    if (ratio >= 1.1) return `${symbol} traders bearish`;
    if (ratio >= 0.9) return `${symbol} traders neutral`;
    if (ratio >= 0.7) return `${symbol} traders bullish`;
    return `${symbol} traders very bullish`;
  }

  // Helper methods
  getFearGreedColor(value) {
    if (value >= 75) return '#10b981'; // green
    if (value >= 55) return '#f59e0b'; // yellow
    if (value >= 45) return '#6b7280'; // gray
    if (value >= 25) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  getChangeColor(change) {
    return change >= 0 ? '#10b981' : '#ef4444';
  }

  getVixColor(vix) {
    if (vix >= 25) return '#ef4444';
    if (vix >= 18) return '#f59e0b';
    return '#10b981';
  }

  getAverageValue(array, days, key) {
    const slice = array.slice(0, Math.min(days, array.length));
    return slice.reduce((sum, item) => sum + item[key], 0) / slice.length;
  }

  getPercentChange(array, days, key) {
    if (array.length < 2) return 0;
    const endIndex = Math.min(days - 1, array.length - 1);
    const start = array[endIndex][key];
    const end = array[0][key];
    return ((end - start) / start) * 100;
  }

  calculateTrend(data, days) {
    // Simple trend calculation based on fear/greed movement
    const values = data.fearGreed.historical
      .slice(0, days)
      .map((item) => item.value);
    if (values.length < 2) return 'neutral';

    const start = values[values.length - 1];
    const end = values[0];
    const change = end - start;

    if (change > 5) return 'improving';
    if (change < -5) return 'deteriorating';
    return 'stable';
  }

  calculateConfidence(data) {
    // Calculate confidence based on data recency and completeness
    let confidence = 100;

    // Reduce confidence for missing options data
    if (!data.options.spy) confidence -= 10;
    if (!data.options.qqq) confidence -= 10;
    if (!data.options.iwm) confidence -= 10;

    // Reduce confidence for stale data (more than 1 day old)
    const dataAge = Date.now() - new Date(data.lastUpdated).getTime();
    const hoursOld = dataAge / (1000 * 60 * 60);
    if (hoursOld > 24) confidence -= 20;

    return Math.max(50, confidence);
  }

  async analyzeSentiment() {
    try {
      console.log('📊 Loading market data...');
      const rawData = JSON.parse(
        readFileSync(join(DATA_DIR, 'market-data.json'), 'utf8'),
      );

      const analysis = this.analyzeMarketSentiment(rawData);

      // Save analysis
      writeFileSync(
        join(DATA_DIR, 'sentiment-analysis.json'),
        JSON.stringify(analysis, null, 2),
      );

      console.log(
        '✅ Sentiment analysis saved to public/data/sentiment-analysis.json',
      );
      console.log(
        `📈 Overall sentiment: ${analysis.overall.score}/100 (${analysis.overall.sentiment})`,
      );

      return analysis;
    } catch (error) {
      console.error('❌ Sentiment analysis failed:', error.message);
      throw error;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new SentimentAnalyzer();
  analyzer.analyzeSentiment().catch(console.error);
}
