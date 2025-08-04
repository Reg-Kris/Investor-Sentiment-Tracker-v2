'use client';

import React, { useState, useEffect } from 'react';
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
    if (score < 20) return 'text-green-500'; // Extreme Fear = Buy
    if (score < 40) return 'text-green-400'; // Fear = Buy
    if (score < 60) return 'text-yellow-500'; // Neutral = Hold
    if (score < 80) return 'text-orange-500'; // Greed = Sell
    return 'text-red-500'; // Extreme Greed = Strong Sell
  };

  const getScoreBackground = (score: number): string => {
    if (score < 20) return 'bg-green-500/20'; // Extreme Fear
    if (score < 40) return 'bg-green-400/20'; // Fear
    if (score < 60) return 'bg-yellow-500/20'; // Neutral
    if (score < 80) return 'bg-orange-500/20'; // Greed
    return 'bg-red-500/20'; // Extreme Greed
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'STRONG_BUY': return 'text-green-600 bg-green-100';
      case 'BUY': return 'text-green-500 bg-green-50';
      case 'HOLD': return 'text-yellow-600 bg-yellow-100';
      case 'SELL': return 'text-orange-600 bg-orange-100';
      case 'STRONG_SELL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence) {
      case 'HIGH': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-red-600';
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Enhanced Sentiment Analysis
          </h2>
          
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBackground(compositeScore)} mb-4`}>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(compositeScore)}`}>
                <AnimatedNumber value={compositeScore} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">/ 100</div>
            </div>
          </div>
          
          <div className={`text-xl font-semibold mb-2 ${getScoreColor(compositeScore)}`}>
            {classification}
          </div>
          
          {primarySignal && (
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getActionColor(primarySignal.action)}`}>
              {primarySignal.action.replace('_', ' ')}
            </div>
          )}
        </div>
      </div>

      {/* Actionable Signals */}
      {sentimentData.actionable_signals && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Trading Signals
          </h3>
          
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
        </div>
      )}

      {/* Component Breakdown */}
      {sentimentData.sentiment_composite?.components && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Sentiment Components
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(sentimentData.sentiment_composite.components).map(([key, value]) => (
              <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(value)}`}>
                  <AnimatedNumber value={Math.round(value)} />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">/ 100</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Indicators Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VIX Analysis */}
        {sentimentData.market_structure && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              VIX Analysis
            </h3>
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
          </div>
        )}

        {/* Safe Haven Analysis */}
        {sentimentData.safe_haven_analysis && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Safe Haven Flows
            </h3>
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
          </div>
        )}
      </div>

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