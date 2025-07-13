import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SentimentCalculator } from './core/sentiment-calculator.js';
import { TimeframeAnalyzer } from './analysis/timeframe-analyzer.js';
import { IndicatorGenerator } from './indicators/indicator-generator.js';
import { MessageGenerator } from './generators/message-generator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../../public/data');

/**
 * Main Sentiment Analyzer class - refactored for modularity
 */
export class SentimentAnalyzer {
  constructor() {
    this.calculator = new SentimentCalculator();
    this.timeframeAnalyzer = new TimeframeAnalyzer();
    this.indicatorGenerator = new IndicatorGenerator();
    this.messageGenerator = new MessageGenerator();
  }

  /**
   * Main sentiment analysis method
   */
  analyzeMarketSentiment(data) {
    console.log('🧠 Analyzing market sentiment...');

    // Calculate individual scores (0-100 scale)
    const fearGreedScore = this.calculator.analyzeFearGreed(data.fearGreed);
    const marketScore = this.calculator.analyzeMarketMovement(data);
    const volatilityScore = this.calculator.analyzeVolatility(data.vix);
    const optionsScore = this.calculator.analyzeOptions(data.options);

    // Weighted composite score
    const compositeScore = this.calculator.calculateComposite(
      fearGreedScore,
      marketScore,
      volatilityScore,
      optionsScore,
    );

    // Generate time-based data (1d, 5d, 1m)
    const timeframes = this.timeframeAnalyzer.generateTimeframeData(data);

    return {
      overall: {
        score: compositeScore,
        sentiment: this.messageGenerator.getSentimentLabel(compositeScore),
        message: this.messageGenerator.getSentimentMessage(compositeScore),
        confidence: this.calculator.calculateConfidence(data),
        components: {
          fearGreed: {
            score: fearGreedScore,
            weight: this.calculator.weights.fearGreed,
          },
          market: {
            score: marketScore,
            weight: this.calculator.weights.market,
          },
          volatility: {
            score: volatilityScore,
            weight: this.calculator.weights.volatility,
          },
          options: {
            score: optionsScore,
            weight: this.calculator.weights.options,
          },
        },
      },
      timeframes,
      indicators: this.indicatorGenerator.generateIndicatorData(data),
      lastAnalyzed: new Date().toISOString(),
    };
  }

  /**
   * Run sentiment analysis from market data file
   */
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
