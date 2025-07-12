'use client';

import { SentimentLevel } from '@/app/lib/types';
import { Activity, TrendingUp } from 'lucide-react';

interface HeroProps {
  sentiment: SentimentLevel;
  lastUpdated: string;
}

export default function Hero({ sentiment, lastUpdated }: HeroProps) {
  const getSentimentText = (sentiment: SentimentLevel) => {
    switch (sentiment) {
      case 'extreme-fear': return 'Extreme Fear';
      case 'fear': return 'Fear';
      case 'neutral': return 'Neutral';
      case 'greed': return 'Greed';
      case 'extreme-greed': return 'Extreme Greed';
    }
  };

  const getSentimentDescription = (sentiment: SentimentLevel) => {
    switch (sentiment) {
      case 'extreme-fear': return 'Market conditions suggest significant overselling. Consider contrarian iron condor strategies.';
      case 'fear': return 'Bearish sentiment prevails. Iron condors may benefit from elevated volatility.';
      case 'neutral': return 'Balanced market conditions. Standard iron condor strategies are suitable.';
      case 'greed': return 'Bullish sentiment with potential overbuying. Monitor for reversal opportunities.';
      case 'extreme-greed': return 'Market euphoria detected. Iron condors may capture mean reversion.';
    }
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 shadow-2xl">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white bg-opacity-10 rounded-full backdrop-blur-sm">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Market Sentiment Tracker
            </h1>
            <p className="text-slate-300 mt-1">
              Iron Condor Trading Intelligence
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-2">Current Market Sentiment</div>
              <div className="text-4xl font-bold text-white mb-2">
                {getSentimentText(sentiment)}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {getSentimentDescription(sentiment)}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} />
                <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div className="text-center p-8 bg-white bg-opacity-5 rounded-2xl backdrop-blur-sm">
              <div className="text-6xl font-bold text-white mb-2">SPY</div>
              <div className="text-xl text-slate-300">QQQ • IWM</div>
              <div className="text-sm text-slate-400 mt-2">Focus Instruments</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
    </div>
  );
}