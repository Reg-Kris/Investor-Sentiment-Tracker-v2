'use client';

import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import SentimentCard from './components/SentimentCard';
import FearGreedGauge from './components/FearGreedGauge';
import APIService from './lib/api';
import { SentimentData } from './lib/types';
import { RefreshCw, Heart } from 'lucide-react';

export default function Home() {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const api = APIService.getInstance();
      const response = await api.getSentimentData();
      
      if (response.success) {
        setSentimentData(response.data);
      } else {
        setError(response.error || 'Failed to fetch data');
        setSentimentData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const generateMockChartData = (baseValue: number, volatility: number = 0.1) => {
    return Array.from({ length: 20 }, (_, i) => ({
      name: `${i}`,
      value: baseValue + (Math.random() - 0.5) * volatility * baseValue
    }));
  };

  if (!sentimentData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-300">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Hero 
          sentiment={sentimentData.overallSentiment} 
          lastUpdated={sentimentData.lastUpdated}
        />

        {error && (
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <p className="text-yellow-300 text-sm">
              ⚠️ Using cached/mock data: {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <SentimentCard
            title="Fear & Greed Index"
            value={sentimentData.fearGreedIndex}
            sentiment={sentimentData.overallSentiment}
            chart={{
              data: generateMockChartData(sentimentData.fearGreedIndex, 0.2),
              color: '#60A5FA'
            }}
          />

          <SentimentCard
            title="SPY Performance"
            value={`$${(500 + sentimentData.spyChange * 5).toFixed(2)}`}
            change={sentimentData.spyChange}
            sentiment={sentimentData.spyChange >= 0 ? 'greed' : 'fear'}
            chart={{
              data: generateMockChartData(500 + sentimentData.spyChange * 5, 0.02),
              color: sentimentData.spyChange >= 0 ? '#10B981' : '#EF4444'
            }}
          />

          <SentimentCard
            title="QQQ Performance"
            value={`$${(400 + sentimentData.qqqqChange * 4).toFixed(2)}`}
            change={sentimentData.qqqqChange}
            sentiment={sentimentData.qqqqChange >= 0 ? 'greed' : 'fear'}
            chart={{
              data: generateMockChartData(400 + sentimentData.qqqqChange * 4, 0.02),
              color: sentimentData.qqqqChange >= 0 ? '#10B981' : '#EF4444'
            }}
          />

          <SentimentCard
            title="IWM Performance"
            value={`$${(200 + sentimentData.iwmChange * 2).toFixed(2)}`}
            change={sentimentData.iwmChange}
            sentiment={sentimentData.iwmChange >= 0 ? 'greed' : 'fear'}
            chart={{
              data: generateMockChartData(200 + sentimentData.iwmChange * 2, 0.02),
              color: sentimentData.iwmChange >= 0 ? '#10B981' : '#EF4444'
            }}
          />

          <SentimentCard
            title="VIX Level"
            value={sentimentData.vixLevel.toFixed(2)}
            sentiment={sentimentData.vixLevel > 30 ? 'fear' : sentimentData.vixLevel < 15 ? 'greed' : 'neutral'}
            chart={{
              data: generateMockChartData(sentimentData.vixLevel, 0.1),
              color: sentimentData.vixLevel > 25 ? '#EF4444' : '#10B981'
            }}
          />

          <SentimentCard
            title="Put/Call Ratio"
            value={sentimentData.putCallRatio.toFixed(3)}
            sentiment={sentimentData.putCallRatio > 1.2 ? 'fear' : sentimentData.putCallRatio < 0.8 ? 'greed' : 'neutral'}
            chart={{
              data: generateMockChartData(sentimentData.putCallRatio, 0.1),
              color: sentimentData.putCallRatio > 1.0 ? '#EF4444' : '#10B981'
            }}
          />
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        <footer className="mt-16 pt-8 border-t border-slate-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              Market Sentiment Tracker for Iron Condor Trading • Real-time Analysis
            </p>
            
            <div className="flex items-center gap-4">
              <a 
                href="https://revolut.me/your-revolut-link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm"
              >
                <Heart className="h-4 w-4 text-red-400" />
                Support via Revolut
              </a>
              
              <p className="text-slate-500 text-xs">
                Free API tiers • Updates every 5min
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}