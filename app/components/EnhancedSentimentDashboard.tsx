'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import AnimatedNumber from './AnimatedNumber';

interface SentimentData {
  sentiment_composite?: {
    composite_score: number;
    classification: string;
    components: {
      vix?: number;
      safe_haven?: number;
      risk_appetite?: number;
      fear_greed_index?: number;
      crypto_correlation?: number;
    };
    data_completeness: number;
  };
  actionable_signals?: {
    primary_signal: {
      action: string;
      description: string;
    };
    confidence_level: string;
    market_regime: string;
    risk_level: string;
    tactical_recommendations: string[];
    spy_levels?: {
      current_price: number;
      support_level: number;
      resistance_level: number;
      stop_loss_suggestion: number;
    };
  };
  safe_haven_analysis?: {
    safe_haven_score: number;
    interpretation: string;
    gold_stock_ratio: {
      change_1d: number;
      change_7d: number;
    };
  };
  risk_appetite_signals?: {
    risk_appetite_score: number;
    interpretation: string;
    risk_appetite_spread: number;
  };
  market_structure?: {
    vix_level: number;
    vix_signal: string;
    volatility_interpretation: string;
  };
  fear_greed_indicators?: {
    cnn_fear_greed_index: number;
    classification: string;
  };
}

interface EnhancedSentimentDashboardProps {
  className?: string;
}

export function EnhancedSentimentDashboard({ className = '' }: EnhancedSentimentDashboardProps) {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Viewport animation hooks
  const { ref: mainRef, inView: mainInView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { ref: signalsRef, inView: signalsInView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { ref: componentsRef, inView: componentsInView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { ref: indicatorsRef, inView: indicatorsInView } = useInView({ threshold: 0.2, triggerOnce: true });

  useEffect(() => {
    fetchSentimentData();
    const interval = setInterval(fetchSentimentData, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchSentimentData = async () => {
    try {
      const response = await fetch('/data/enhanced-sentiment-data.json');
      if (!response.ok) {
        throw new Error('Failed to fetch sentiment data');
      }
      const data = await response.json();
      setSentimentData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching sentiment data:', err);
      setError('Failed to load sentiment data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score < 20) return 'text-[#93A386]'; // Extreme Fear = Buy (Sage green)
    if (score < 40) return 'text-[#A37F90]'; // Fear = Buy (Dusty mauve)
    if (score < 60) return 'text-[#F8B4C8]'; // Neutral = Hold (Blush pink)
    if (score < 80) return 'text-[#CDA45E]'; // Greed = Sell (Warm amber)
    return 'text-[#BC6C6C]'; // Extreme Greed = Strong Sell (Muted coral)
  };

  const getScoreBackground = (score: number): string => {
    if (score < 20) return 'bg-[#93A386]/20'; // Extreme Fear (Sage green)
    if (score < 40) return 'bg-[#A37F90]/20'; // Fear (Dusty mauve)
    if (score < 60) return 'bg-[#F8B4C8]/20'; // Neutral (Blush pink)
    if (score < 80) return 'bg-[#CDA45E]/20'; // Greed (Warm amber)
    return 'bg-[#BC6C6C]/20'; // Extreme Greed (Muted coral)
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'STRONG_BUY': return 'text-white bg-[#93A386] shadow-lg';
      case 'BUY': return 'text-white bg-[#A37F90] shadow-lg';
      case 'HOLD': return 'text-white bg-[#F8B4C8] shadow-lg';
      case 'SELL': return 'text-white bg-[#CDA45E] shadow-lg';
      case 'STRONG_SELL': return 'text-white bg-[#BC6C6C] shadow-lg';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence) {
      case 'HIGH': return 'text-[#93A386]';
      case 'MEDIUM': return 'text-[#F8B4C8]';
      case 'LOW': return 'text-[#BC6C6C]';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sentimentData) {
    return (
      <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ Data Unavailable</div>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'Enhanced sentiment data not available'}
          </p>
          <button 
            onClick={fetchSentimentData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const compositeScore = sentimentData.sentiment_composite?.composite_score ?? 50;
  const classification = sentimentData.sentiment_composite?.classification ?? 'Unknown';
  const primarySignal = sentimentData.actionable_signals?.primary_signal;
  const confidence = sentimentData.actionable_signals?.confidence_level ?? 'UNKNOWN';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Sentiment Score */}
      <motion.div 
        ref={mainRef}
        initial={{ opacity: 0, y: 50 }}
        animate={mainInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="glass-card fintech-card-hover rounded-xl p-8"
      >
        <div className="text-center">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={mainInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl font-bold mb-6 fintech-text-gradient"
          >
            Enhanced Sentiment Analysis
          </motion.h2>
          
          <motion.div 
            className={`inline-flex items-center justify-center w-36 h-36 rounded-full ${getScoreBackground(compositeScore)} mb-6 relative overflow-hidden`}
            initial={{ scale: 0, rotate: -180 }}
            animate={mainInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ duration: 0.8, delay: 0.4, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            style={{
              background: `radial-gradient(circle, ${getScoreBackground(compositeScore)}, transparent 70%)`,
              backdropFilter: 'blur(12px)',
              border: `2px solid ${getScoreColor(compositeScore).replace('text-', '').replace('[', '').replace(']', '')}40`
            }}
          >
            <motion.div 
              className="absolute inset-0 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{
                background: `conic-gradient(from 0deg, transparent, ${getScoreColor(compositeScore).replace('text-', '').replace('[', '').replace(']', '')}30, transparent)`
              }}
            />
            <div className="text-center relative z-10">
              <motion.div 
                className={`text-5xl font-bold ${getScoreColor(compositeScore)}`}
                initial={{ opacity: 0 }}
                animate={mainInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <AnimatedNumber value={compositeScore} />
              </motion.div>
              <div className="text-sm text-gray-600 dark:text-gray-400">/ 100</div>
            </div>
          </motion.div>
          
          <motion.div 
            className={`text-xl font-semibold mb-4 ${getScoreColor(compositeScore)}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={mainInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            {classification}
          </motion.div>
          
          {primarySignal && (
            <motion.div 
              className={`inline-block px-6 py-3 rounded-full text-sm font-medium ${getActionColor(primarySignal.action)}`}
              initial={{ opacity: 0, y: 20 }}
              animate={mainInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {primarySignal.action.replace('_', ' ')}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Actionable Signals */}
      {sentimentData.actionable_signals && (
        <motion.div 
          ref={signalsRef}
          initial={{ opacity: 0, x: -50 }}
          animate={signalsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-card fintech-card-hover rounded-xl p-6"
        >
          <motion.h3 
            className="text-lg font-semibold mb-4 fintech-text-gradient"
            initial={{ opacity: 0 }}
            animate={signalsInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Trading Signals
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Market Regime</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {sentimentData.actionable_signals.market_regime.replace(/_/g, ' ')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Confidence Level</div>
              <div className={`font-medium ${getConfidenceColor(confidence)}`}>
                {confidence}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Risk Level</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {sentimentData.actionable_signals.risk_level.replace(/_/g, ' ')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Data Quality</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {Math.round(sentimentData.sentiment_composite?.data_completeness ?? 0)}%
              </div>
            </div>
          </div>

          {primarySignal && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Recommendation</div>
              <div className="text-gray-900 dark:text-white">{primarySignal.description}</div>
            </div>
          )}

          {sentimentData.actionable_signals.tactical_recommendations && (
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tactical Recommendations</div>
              <ul className="space-y-1">
                {sentimentData.actionable_signals.tactical_recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Component Breakdown */}
      {sentimentData.sentiment_composite?.components && (
        <motion.div 
          ref={componentsRef}
          initial={{ opacity: 0, y: 50 }}
          animate={componentsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="glass-card fintech-card-hover rounded-xl p-6"
        >
          <motion.h3 
            className="text-lg font-semibold mb-4 fintech-text-gradient"
            initial={{ opacity: 0 }}
            animate={componentsInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Sentiment Components
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(sentimentData.sentiment_composite.components).map(([key, value], index) => (
              <motion.div 
                key={key} 
                className="glass-subtle rounded-lg p-4 warm-card-hover"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={componentsInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.02, 
                  transition: { duration: 0.2 },
                  boxShadow: `0 8px 25px ${getScoreColor(value).replace('text-', '').replace('[', '').replace(']', '')}20`
                }}
              >
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <motion.div 
                  className={`text-2xl font-bold ${getScoreColor(value)}`}
                  whileHover={{ scale: 1.1 }}
                >
                  <AnimatedNumber value={Math.round(value)} />
                </motion.div>
                <div className="text-xs text-gray-500 dark:text-gray-400">/ 100</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Market Indicators Summary */}
      <motion.div 
        ref={indicatorsRef}
        initial={{ opacity: 0 }}
        animate={indicatorsInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* VIX Analysis */}
        {sentimentData.market_structure && (
          <motion.div 
            className="glass-card fintech-card-hover rounded-xl p-6"
            initial={{ opacity: 0, x: -30 }}
            animate={indicatorsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ y: -4 }}
          >
            <motion.h3 
              className="text-lg font-semibold mb-4 fintech-text-gradient"
              initial={{ opacity: 0 }}
              animate={indicatorsInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              VIX Analysis
            </motion.h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">VIX Level</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  <AnimatedNumber value={sentimentData.market_structure.vix_level} decimals={2} />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Signal</div>
                <div className="font-medium text-gray-900 dark:text-white capitalize">
                  {sentimentData.market_structure.vix_signal}
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {sentimentData.market_structure.volatility_interpretation}
              </div>
            </div>
          </motion.div>
        )}

        {/* Safe Haven Analysis */}
        {sentimentData.safe_haven_analysis && (
          <motion.div 
            className="glass-card fintech-card-hover rounded-xl p-6"
            initial={{ opacity: 0, x: 30 }}
            animate={indicatorsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            whileHover={{ y: -4 }}
          >
            <motion.h3 
              className="text-lg font-semibold mb-4 fintech-text-gradient"
              initial={{ opacity: 0 }}
              animate={indicatorsInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              Safe Haven Flows
            </motion.h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Safe Haven Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(sentimentData.safe_haven_analysis.safe_haven_score)}`}>
                  <AnimatedNumber value={sentimentData.safe_haven_analysis.safe_haven_score} />
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {sentimentData.safe_haven_analysis.interpretation}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Price Levels (if available) */}
      {sentimentData.actionable_signals?.spy_levels && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            SPY Price Levels
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">Current</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                ${sentimentData.actionable_signals.spy_levels.current_price.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-green-500">Support</div>
              <div className="text-lg font-bold text-green-600">
                ${sentimentData.actionable_signals.spy_levels.support_level.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-red-500">Resistance</div>
              <div className="text-lg font-bold text-red-600">
                ${sentimentData.actionable_signals.spy_levels.resistance_level.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-orange-500">Stop Loss</div>
              <div className="text-lg font-bold text-orange-600">
                ${sentimentData.actionable_signals.spy_levels.stop_loss_suggestion.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedSentimentDashboard;