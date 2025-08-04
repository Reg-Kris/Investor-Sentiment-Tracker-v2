#!/usr/bin/env node

/**
 * Enhanced Sentiment Data Collection Pipeline
 * Implements comprehensive fear vs greed indicators using FREE data sources
 * Designed for retail investors with clear buy/sell signals
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import NodeCache from 'node-cache';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize cache with 15-minute TTL for real-time sentiment analysis
const cache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

// Enhanced ticker configuration for sentiment analysis
const SENTIMENT_TICKERS = {
  // Core equity indices for put/call analysis
  equity_indices: ['SPY', 'QQQ', 'IWM', 'DIA'],
  
  // VIX family for term structure analysis
  volatility: ['^VIX', '^VIX9D'],
  
  // Safe haven assets
  safe_havens: ['GLD', 'IAU', 'TLT', 'SHY', 'BIL'],
  
  // Risk-on assets
  risk_assets: ['ARKK', 'EEM', 'HYG', 'TQQQ', 'SOXL'],
  
  // Defensive/Low volatility
  defensive: ['SPLV', 'LQD', 'USMV', 'VEA', 'VTEB'],
  
  // Crypto exposure ETFs
  crypto_etfs: ['BITO', 'ETHE'],
  
  // Sector rotation indicators
  growth_vs_value: ['QQQ', 'IWM', 'VTV', 'VUG'],
  
  // International risk indicators
  international: ['EEM', 'VEA', 'FXI', 'INDA']
};

// Sentiment interpretation thresholds
const SENTIMENT_THRESHOLDS = {
  fear_greed_composite: {
    extreme_fear: 20,
    fear: 40,
    neutral: 60,
    greed: 80,
    extreme_greed: 100
  },
  vix_levels: {
    complacency: 12,
    normal_low: 15,
    normal_high: 20,
    elevated: 25,
    fear: 30,
    panic: 40
  },
  put_call_proxy: {
    extreme_greed: 0.6,
    greed: 0.8,
    neutral: 1.0,
    fear: 1.2,
    extreme_fear: 1.5
  }
};

class EnhancedSentimentAnalyzer {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      metadata: {
        timestamp: new Date().toISOString(),
        pipeline_version: '3.0_sentiment_enhanced',
        data_sources: []
      },
      sentiment_composite: {},
      fear_greed_indicators: {},
      safe_haven_analysis: {},
      risk_appetite_signals: {},
      market_structure: {},
      crypto_correlation: {},
      actionable_signals: {}
    };
  }

  async executeSentimentPipeline() {
    console.log('🎯 Starting Enhanced Sentiment Analysis Pipeline');
    
    try {
      // Core market data collection
      await this.collectCoreMarketData();
      
      // Safe haven flow analysis
      await this.analyzeSafeHavenFlows();
      
      // Risk appetite measurement
      await this.measureRiskAppetite();
      
      // VIX term structure analysis
      await this.analyzeVIXTermStructure();
      
      // Crypto correlation analysis
      await this.analyzeCryptoCorrelation();
      
      // Fear & Greed Index integration
      await this.integrateFearGreedIndex();
      
      // Generate composite sentiment score
      await this.generateCompositeSentiment();
      
      // Create actionable trading signals
      await this.generateActionableSignals();
      
      // Save results
      await this.saveResults();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Sentiment pipeline failed:', error.message);
      throw error;
    }
  }

  async collectCoreMarketData() {
    console.log('📊 Collecting core market data...');
    
    const allTickers = [
      ...SENTIMENT_TICKERS.equity_indices,
      ...SENTIMENT_TICKERS.volatility,
      ...SENTIMENT_TICKERS.safe_havens,
      ...SENTIMENT_TICKERS.risk_assets,
      ...SENTIMENT_TICKERS.defensive,
      ...SENTIMENT_TICKERS.crypto_etfs
    ];

    this.results.core_data = {};
    
    for (const ticker of allTickers) {
      try {
        const data = await this.fetchTickerData(ticker);
        this.results.core_data[ticker] = data;
        
        // Add brief delay to respect rate limits
        await this.sleep(100);
        
      } catch (error) {
        console.warn(`⚠️  Failed to fetch ${ticker}: ${error.message}`);
        this.results.core_data[ticker] = { 
          error: error.message, 
          timestamp: new Date().toISOString() 
        };
      }
    }
    
    console.log(`✅ Collected data for ${Object.keys(this.results.core_data).length} tickers`);
  }

  async fetchTickerData(ticker) {
    const cacheKey = `ticker_${ticker}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
      params: {
        interval: '1d',
        range: '30d' // Extended range for better analysis
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SentimentTracker/3.0)'
      }
    });

    if (!response.data.chart?.result?.[0]) {
      throw new Error(`No data available for ${ticker}`);
    }

    const result = response.data.chart.result[0];
    const quote = result.indicators?.quote?.[0];
    
    if (!quote?.close) {
      throw new Error(`No price data for ${ticker}`);
    }

    // Filter out null values and calculate metrics
    const prices = quote.close.filter(p => p !== null);
    const volumes = quote.volume?.filter(v => v !== null) || [];
    const timestamps = result.timestamp || [];
    
    if (prices.length < 2) {
      throw new Error(`Insufficient data for ${ticker}`);
    }

    // Calculate key metrics
    const currentPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2];
    const weekAgoPrice = prices[Math.max(0, prices.length - 7)];
    const monthAgoPrice = prices[0];
    
    const dayChange = ((currentPrice - previousPrice) / previousPrice) * 100;
    const weekChange = ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100;
    const monthChange = ((currentPrice - monthAgoPrice) / monthAgoPrice) * 100;
    
    // Calculate volatility (standard deviation of returns)
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    const volatility = this.calculateStandardDeviation(returns) * Math.sqrt(252) * 100; // Annualized

    const tickerData = {
      symbol: ticker,
      price: currentPrice,
      change_1d: dayChange,
      change_7d: weekChange,
      change_30d: monthChange,
      volatility_30d: volatility,
      volume_latest: volumes.length > 0 ? volumes[volumes.length - 1] : 0,
      volume_avg_30d: volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0,
      price_history: prices.slice(-30), // Last 30 days for analysis
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, tickerData);
    return tickerData;
  }

  async analyzeSafeHavenFlows() {
    console.log('🏦 Analyzing safe haven flows...');
    
    const spy = this.results.core_data['SPY'];
    const gld = this.results.core_data['GLD'];
    const tlt = this.results.core_data['TLT'];
    const shy = this.results.core_data['SHY'];
    
    if (!spy || !gld || !tlt || spy.error || gld.error || tlt.error) {
      console.warn('⚠️  Missing safe haven data, using fallback analysis');
      this.results.safe_haven_analysis = { error: 'Insufficient data' };
      return;
    }

    // Gold vs Stocks ratio analysis
    const goldStockRatio = {
      current: gld.price / spy.price,
      change_1d: gld.change_1d - spy.change_1d,
      change_7d: gld.change_7d - spy.change_7d,
      change_30d: gld.change_30d - spy.change_30d
    };

    // Treasury performance analysis
    const treasurySignals = {
      tlt_vs_spy_1d: tlt.change_1d - spy.change_1d,
      tlt_vs_spy_7d: tlt.change_7d - spy.change_7d,
      tlt_vs_spy_30d: tlt.change_30d - spy.change_30d,
      flight_to_quality: tlt.change_1d > 1 && spy.change_1d < -1
    };

    // Safe haven score calculation
    let safeHavenScore = 50; // Neutral baseline
    
    // Gold outperformance indicates fear
    if (goldStockRatio.change_1d > 2) safeHavenScore -= 15;
    else if (goldStockRatio.change_1d > 0) safeHavenScore -= 5;
    else if (goldStockRatio.change_1d < -2) safeHavenScore += 15;
    else if (goldStockRatio.change_1d < 0) safeHavenScore += 5;
    
    // Treasury outperformance indicates fear
    if (treasurySignals.tlt_vs_spy_1d > 3) safeHavenScore -= 20;
    else if (treasurySignals.tlt_vs_spy_1d > 1) safeHavenScore -= 10;
    else if (treasurySignals.tlt_vs_spy_1d < -3) safeHavenScore += 20;
    else if (treasurySignals.tlt_vs_spy_1d < -1) safeHavenScore += 10;

    this.results.safe_haven_analysis = {
      gold_stock_ratio: goldStockRatio,
      treasury_signals: treasurySignals,
      safe_haven_score: Math.max(0, Math.min(100, safeHavenScore)),
      interpretation: this.interpretSafeHavenScore(safeHavenScore),
      timestamp: new Date().toISOString()
    };
  }

  async measureRiskAppetite() {
    console.log('⚡ Measuring risk appetite...');
    
    // Risk-on vs Risk-off asset performance comparison
    const riskOnTickers = ['QQQ', 'ARKK', 'EEM', 'HYG'];
    const riskOffTickers = ['SPLV', 'LQD', 'TLT', 'GLD'];
    
    let riskOnPerformance = 0;
    let riskOffPerformance = 0;
    let riskOnCount = 0;
    let riskOffCount = 0;

    // Calculate risk-on performance
    for (const ticker of riskOnTickers) {
      const data = this.results.core_data[ticker];
      if (data && !data.error) {
        riskOnPerformance += data.change_1d;
        riskOnCount++;
      }
    }

    // Calculate risk-off performance  
    for (const ticker of riskOffTickers) {
      const data = this.results.core_data[ticker];
      if (data && !data.error) {
        riskOffPerformance += data.change_1d;
        riskOffCount++;
      }
    }

    const avgRiskOn = riskOnCount > 0 ? riskOnPerformance / riskOnCount : 0;
    const avgRiskOff = riskOffCount > 0 ? riskOffPerformance / riskOffCount : 0;
    
    // Risk appetite score (100 = extreme risk-on, 0 = extreme risk-off)
    const riskAppetiteSpread = avgRiskOn - avgRiskOff;
    let riskAppetiteScore = 50 + (riskAppetiteSpread * 10); // Scale the spread
    riskAppetiteScore = Math.max(0, Math.min(100, riskAppetiteScore));

    this.results.risk_appetite_signals = {
      risk_on_performance: avgRiskOn,
      risk_off_performance: avgRiskOff,
      risk_appetite_spread: riskAppetiteSpread,
      risk_appetite_score: riskAppetiteScore,
      interpretation: this.interpretRiskAppetite(riskAppetiteScore),
      timestamp: new Date().toISOString()
    };
  }

  async analyzeVIXTermStructure() {
    console.log('📈 Analyzing VIX term structure...');
    
    const vix = this.results.core_data['^VIX'];
    const vix9d = this.results.core_data['^VIX9D'];
    
    if (!vix || vix.error) {
      console.warn('⚠️  VIX data unavailable');
      this.results.market_structure = { error: 'VIX data unavailable' };
      return;
    }

    // VIX level interpretation
    let vixSignal = 'normal';
    let vixScore = 50;
    
    if (vix.price > SENTIMENT_THRESHOLDS.vix_levels.panic) {
      vixSignal = 'panic';
      vixScore = 10;
    } else if (vix.price > SENTIMENT_THRESHOLDS.vix_levels.fear) {
      vixSignal = 'fear';
      vixScore = 25;
    } else if (vix.price > SENTIMENT_THRESHOLDS.vix_levels.elevated) {
      vixSignal = 'elevated';
      vixScore = 40;
    } else if (vix.price < SENTIMENT_THRESHOLDS.vix_levels.complacency) {
      vixSignal = 'complacency';
      vixScore = 85;
    } else if (vix.price < SENTIMENT_THRESHOLDS.vix_levels.normal_low) {
      vixSignal = 'low';
      vixScore = 70;
    }

    // Term structure analysis (if VIX9D available)
    let termStructure = null;
    if (vix9d && !vix9d.error) {
      const contango = vix.price > vix9d.price;
      termStructure = {
        vix_30d: vix.price,
        vix_9d: vix9d.price,
        structure: contango ? 'contango' : 'backwardation',
        spread: vix.price - vix9d.price,
        signal: contango ? 'normal_fear_structure' : 'elevated_near_term_fear'
      };
    }

    this.results.market_structure = {
      vix_level: vix.price,
      vix_signal: vixSignal,
      vix_score: vixScore,
      vix_change_1d: vix.change_1d,
      term_structure: termStructure,
      volatility_interpretation: this.interpretVIXLevel(vix.price),
      timestamp: new Date().toISOString()
    };
  }

  async analyzeCryptoCorrelation() {
    console.log('🚀 Analyzing crypto correlation...');
    
    // Use crypto ETF as proxy for Bitcoin correlation
    const bito = this.results.core_data['BITO'];
    const spy = this.results.core_data['SPY'];
    
    if (!bito || !spy || bito.error || spy.error) {
      console.warn('⚠️  Crypto correlation data unavailable');
      this.results.crypto_correlation = { error: 'Crypto data unavailable' };
      return;
    }

    // Calculate correlation using price history
    const correlation = this.calculateCorrelation(
      bito.price_history.slice(-20), // Last 20 days
      spy.price_history.slice(-20)
    );

    // Interpret correlation
    let correlationSignal = 'moderate';
    if (correlation > 0.7) correlationSignal = 'high_risk_asset_mode';
    else if (correlation < 0.3) correlationSignal = 'independent_hedge_mode';
    else if (correlation < 0) correlationSignal = 'negative_correlation';

    this.results.crypto_correlation = {
      btc_spy_correlation: correlation,
      correlation_signal: correlationSignal,
      crypto_change_1d: bito.change_1d,
      stocks_change_1d: spy.change_1d,
      divergence: Math.abs(bito.change_1d - spy.change_1d),
      interpretation: this.interpretCryptoCorrelation(correlation),
      timestamp: new Date().toISOString()
    };
  }

  async integrateFearGreedIndex() {
    console.log('😰 Integrating Fear & Greed Index...');
    
    try {
      const response = await axios.get('https://api.alternative.me/fng/', {
        params: { limit: 7 },
        timeout: 10000
      });

      const fngData = response.data.data?.[0];
      if (!fngData) {
        throw new Error('No Fear & Greed data available');
      }

      this.results.fear_greed_indicators = {
        cnn_fear_greed_index: parseInt(fngData.value),
        classification: fngData.value_classification,
        timestamp: new Date(parseInt(fngData.timestamp) * 1000).toISOString(),
        history: response.data.data.map(item => ({
          value: parseInt(item.value),
          classification: item.value_classification,
          date: new Date(parseInt(item.timestamp) * 1000).toISOString().split('T')[0]
        }))
      };
      
    } catch (error) {
      console.warn('⚠️  Fear & Greed Index unavailable:', error.message);
      this.results.fear_greed_indicators = { 
        error: error.message,
        cnn_fear_greed_index: null 
      };
    }
  }

  async generateCompositeSentiment() {
    console.log('🧮 Generating composite sentiment score...');
    
    // Weighted composite calculation
    const weights = {
      vix_score: 0.25,           // Market volatility
      safe_haven_score: 0.20,   // Flight to quality
      risk_appetite_score: 0.20, // Risk appetite
      fear_greed_index: 0.20,   // External sentiment
      crypto_correlation: 0.15   // Risk asset correlation
    };

    let compositeScore = 0;
    let totalWeight = 0;
    const components = {};

    // VIX component
    if (this.results.market_structure?.vix_score) {
      const vixScore = this.results.market_structure.vix_score;
      compositeScore += vixScore * weights.vix_score;
      totalWeight += weights.vix_score;
      components.vix = vixScore;
    }

    // Safe haven component
    if (this.results.safe_haven_analysis?.safe_haven_score) {
      const safeHavenScore = this.results.safe_haven_analysis.safe_haven_score;
      compositeScore += safeHavenScore * weights.safe_haven_score;
      totalWeight += weights.safe_haven_score;
      components.safe_haven = safeHavenScore;
    }

    // Risk appetite component
    if (this.results.risk_appetite_signals?.risk_appetite_score) {
      const riskScore = this.results.risk_appetite_signals.risk_appetite_score;
      compositeScore += riskScore * weights.risk_appetite_score;
      totalWeight += weights.risk_appetite_score;
      components.risk_appetite = riskScore;
    }

    // Fear & Greed Index component
    if (this.results.fear_greed_indicators?.cnn_fear_greed_index) {
      const fgScore = this.results.fear_greed_indicators.cnn_fear_greed_index;
      compositeScore += fgScore * weights.fear_greed_index;
      totalWeight += weights.fear_greed_index;
      components.fear_greed_index = fgScore;
    }

    // Crypto correlation component (inverted - high correlation = more risk)
    if (this.results.crypto_correlation?.btc_spy_correlation !== undefined) {
      const corrScore = (1 - Math.abs(this.results.crypto_correlation.btc_spy_correlation)) * 100;
      compositeScore += corrScore * weights.crypto_correlation;
      totalWeight += weights.crypto_correlation;
      components.crypto_correlation = corrScore;
    }

    // Normalize score
    const normalizedScore = totalWeight > 0 ? compositeScore / totalWeight : 50;
    
    this.results.sentiment_composite = {
      composite_score: Math.round(normalizedScore),
      classification: this.classifyCompositeSentiment(normalizedScore),
      components: components,
      weights_used: weights,
      data_completeness: (totalWeight / Object.values(weights).reduce((a, b) => a + b, 0)) * 100,
      timestamp: new Date().toISOString()
    };
  }

  async generateActionableSignals() {
    console.log('🎯 Generating actionable trading signals...');
    
    const compositeScore = this.results.sentiment_composite?.composite_score || 50;
    const vixLevel = this.results.market_structure?.vix_level || 20;
    const safeHavenScore = this.results.safe_haven_analysis?.safe_haven_score || 50;
    
    // Generate clear buy/sell signals
    const signals = {
      primary_signal: this.generatePrimarySignal(compositeScore),
      confidence_level: this.calculateConfidenceLevel(),
      market_regime: this.identifyMarketRegime(compositeScore, vixLevel),
      tactical_recommendations: this.generateTacticalRecommendations(compositeScore),
      risk_level: this.assessRiskLevel(compositeScore, vixLevel),
      timestamp: new Date().toISOString()
    };

    // Add specific entry/exit levels if available
    const spy = this.results.core_data['SPY'];
    if (spy && !spy.error) {
      signals.spy_levels = {
        current_price: spy.price,
        support_level: spy.price * 0.98, // 2% below current
        resistance_level: spy.price * 1.02, // 2% above current
        stop_loss_suggestion: spy.price * (compositeScore < 40 ? 0.95 : 0.93) // Tighter stops in fear markets
      };
    }

    this.results.actionable_signals = signals;
  }

  // Helper methods for calculations and interpretations
  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length < 2) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + (xi * y[i]), 0);
    const sumX2 = x.reduce((total, xi) => total + (xi * xi), 0);
    const sumY2 = y.reduce((total, yi) => total + (yi * yi), 0);
    
    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  interpretSafeHavenScore(score) {
    if (score < 20) return 'Strong flight to safety - extreme fear';
    if (score < 40) return 'Moderate safe haven demand - fear present';
    if (score < 60) return 'Neutral safe haven flows';
    if (score < 80) return 'Risk-on behavior - reduced safe haven demand';
    return 'Strong risk appetite - minimal safe haven interest';
  }

  interpretRiskAppetite(score) {
    if (score < 20) return 'Extreme risk-off - defensive positioning';
    if (score < 40) return 'Risk-off bias - cautious sentiment';
    if (score < 60) return 'Neutral risk appetite';
    if (score < 80) return 'Risk-on bias - growth seeking';
    return 'Extreme risk-on - maximum risk appetite';
  }

  interpretVIXLevel(level) {
    if (level > 40) return 'Market panic - extreme fear';
    if (level > 30) return 'High fear - significant uncertainty';
    if (level > 25) return 'Elevated concern - above normal fear';
    if (level > 20) return 'Normal volatility - moderate concern';
    if (level > 15) return 'Low volatility - calm markets';
    return 'Extreme complacency - potential danger';
  }

  interpretCryptoCorrelation(correlation) {
    if (correlation > 0.7) return 'High correlation - crypto as risk asset';
    if (correlation > 0.3) return 'Moderate correlation - mixed behavior';
    if (correlation > 0) return 'Low correlation - some independence';
    return 'Negative correlation - potential hedge';
  }

  classifyCompositeSentiment(score) {
    if (score < 20) return 'Extreme Fear';
    if (score < 40) return 'Fear';
    if (score < 60) return 'Neutral';
    if (score < 80) return 'Greed';
    return 'Extreme Greed';
  }

  generatePrimarySignal(score) {
    if (score < 20) return { action: 'STRONG_BUY', description: 'Markets oversold - excellent buying opportunity' };
    if (score < 40) return { action: 'BUY', description: 'Fear creating value - selective buying' };
    if (score < 60) return { action: 'HOLD', description: 'Mixed signals - maintain positions' };
    if (score < 80) return { action: 'SELL', description: 'Greed building - consider profit taking' };
    return { action: 'STRONG_SELL', description: 'Extreme greed - reduce risk exposure' };
  }

  calculateConfidenceLevel() {
    const completeness = this.results.sentiment_composite?.data_completeness || 0;
    if (completeness > 90) return 'HIGH';
    if (completeness > 70) return 'MEDIUM';
    return 'LOW';
  }

  identifyMarketRegime(score, vix) {
    if (vix > 30 && score < 30) return 'CRISIS_MODE';
    if (vix > 25 && score < 40) return 'FEAR_DRIVEN';
    if (vix < 15 && score > 70) return 'COMPLACENCY_RISK';
    if (score < 30) return 'OVERSOLD_OPPORTUNITY';
    if (score > 75) return 'OVERBOUGHT_CAUTION';
    return 'NORMAL_MARKETS';
  }

  generateTacticalRecommendations(score) {
    const recommendations = [];
    
    if (score < 30) {
      recommendations.push('Consider dollar-cost averaging into quality stocks');
      recommendations.push('Look for oversold blue-chip opportunities');
      recommendations.push('Reduce cash position gradually');
    } else if (score > 75) {
      recommendations.push('Take profits on overextended positions');
      recommendations.push('Increase cash reserves');
      recommendations.push('Consider hedging with VIX calls or puts');
    } else {
      recommendations.push('Maintain current allocation');
      recommendations.push('Monitor for trend changes');
      recommendations.push('Prepare for potential volatility');
    }
    
    return recommendations;
  }

  assessRiskLevel(score, vix) {
    if (vix > 35 || score < 15) return 'VERY_HIGH';
    if (vix > 25 || score < 25) return 'HIGH';
    if (vix > 20 || score < 35 || score > 75) return 'MODERATE';
    if (vix < 15 && score > 80) return 'ELEVATED_COMPLACENCY';
    return 'LOW';
  }

  async saveResults() {
    // Add final metadata
    this.results.metadata.processing_time_ms = Date.now() - this.startTime;
    this.results.metadata.total_indicators = Object.keys(this.results).length - 1; // Exclude metadata
    
    // Save enhanced results
    const outputPath = path.resolve(__dirname, '../public/data/enhanced-sentiment-data.json');
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeJSON(outputPath, this.results, { spaces: 2 });
    
    // Also update the main market data file for compatibility
    const compatPath = path.resolve(__dirname, '../public/data/market-data.json');
    const compatibleData = this.createCompatibleFormat();
    await fs.writeJSON(compatPath, compatibleData, { spaces: 2 });
    
    console.log(`✅ Enhanced sentiment data saved to: ${outputPath}`);
  }

  createCompatibleFormat() {
    // Convert enhanced format to original format for existing UI
    const spy = this.results.core_data?.['SPY'];
    const vix = this.results.core_data?.['^VIX'];
    const fearGreed = this.results.fear_greed_indicators;
    
    return {
      metadata: {
        last_updated: this.results.metadata.timestamp,
        enhanced_sentiment_available: true
      },
      stocks: this.results.core_data || {},
      vix: vix || { error: 'VIX data unavailable' },
      fear_greed: fearGreed || { error: 'Fear & Greed data unavailable' },
      sentiment_composite: this.results.sentiment_composite,
      actionable_signals: this.results.actionable_signals
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function runEnhancedSentimentAnalysis() {
  console.log('🚀 Enhanced Sentiment Analysis Pipeline v3.0');
  
  try {
    const analyzer = new EnhancedSentimentAnalyzer();
    const results = await analyzer.executeSentimentPipeline();
    
    console.log('✅ Enhanced sentiment analysis completed');
    console.log(`📊 Composite Score: ${results.sentiment_composite?.composite_score || 'N/A'}/100`);
    console.log(`🎯 Signal: ${results.actionable_signals?.primary_signal?.action || 'N/A'}`);
    console.log(`⏱️  Processing Time: ${results.metadata.processing_time_ms}ms`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Enhanced sentiment analysis failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEnhancedSentimentAnalysis()
    .then(() => {
      console.log('🎉 Enhanced sentiment analysis execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Enhanced sentiment analysis execution failed:', error);
      process.exit(1);
    });
}

export default runEnhancedSentimentAnalysis;