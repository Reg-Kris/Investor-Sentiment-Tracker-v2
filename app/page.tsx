'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Heart, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { Grid, Col, Title, Text, Flex, Button, Card, Callout } from '@tremor/react';

// Import new components
import SentimentGauge from './components/FearGreedGauge';
import MetricCard from './components/MetricCard';
import SectorHeatmap from './components/SectorHeatmap';
import TimelineChart from './components/TimelineChart';
import NewsCard from './components/NewsCard';
import ThemeToggle from './components/ThemeToggle';

// Import existing components and utilities
import APIService from './lib/api';
import { SentimentData } from './lib/types';

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

  // Generate mock data for components
  const generateMockChartData = (baseValue: number, volatility: number = 0.1, length: number = 20) => {
    return Array.from({ length }, (_, i) => ({
      name: `${i}`,
      value: baseValue + (Math.random() - 0.5) * volatility * baseValue
    }));
  };

  const generateTimelineData = () => {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString(),
        sentiment: 30 + Math.random() * 40 + Math.sin(i * 0.2) * 10,
        fearGreed: sentimentData?.fearGreedIndex || 50 + Math.random() * 30,
        vix: 15 + Math.random() * 20,
        spyPrice: 450 + Math.random() * 50
      };
    });
  };

  const generateSectorData = () => [
    { name: 'Technology', change: 2.1, volume: 45000000, marketCap: 2800000000000, symbol: 'XLK' },
    { name: 'Healthcare', change: -0.8, volume: 23000000, marketCap: 1200000000000, symbol: 'XLV' },
    { name: 'Financials', change: 1.5, volume: 67000000, marketCap: 890000000000, symbol: 'XLF' },
    { name: 'Energy', change: -2.3, volume: 34000000, marketCap: 567000000000, symbol: 'XLE' },
    { name: 'Consumer Disc.', change: 0.7, volume: 28000000, marketCap: 1500000000000, symbol: 'XLY' },
    { name: 'Utilities', change: -0.2, volume: 12000000, marketCap: 345000000000, symbol: 'XLU' },
    { name: 'Real Estate', change: 1.8, volume: 18000000, marketCap: 234000000000, symbol: 'XLRE' },
    { name: 'Materials', change: -1.1, volume: 21000000, marketCap: 456000000000, symbol: 'XLB' }
  ];

  const generateNewsData = () => [
    {
      id: '1',
      title: 'Fed Signals Potential Rate Adjustments Amid Market Volatility',
      summary: 'Federal Reserve officials hint at possible policy changes as market sentiment indicators show increased uncertainty.',
      source: 'MarketWatch',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      url: '#',
      sentiment: 'neutral' as const,
      impact: 'high' as const,
      category: 'Monetary Policy',
      keywords: ['Fed', 'Interest Rates', 'Market Sentiment']
    },
    {
      id: '2',
      title: 'Technology Sector Shows Resilience Despite Broader Market Concerns',
      summary: 'Major tech stocks continue to outperform as investors seek growth opportunities in uncertain times.',
      source: 'Bloomberg',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      url: '#',
      sentiment: 'positive' as const,
      impact: 'medium' as const,
      category: 'Sector Analysis',
      keywords: ['Technology', 'Growth', 'Performance']
    },
    {
      id: '3',
      title: 'VIX Spikes as Earnings Season Approaches',
      summary: 'Volatility index reaches elevated levels as market participants prepare for upcoming earnings announcements.',
      source: 'CNBC',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      url: '#',
      sentiment: 'negative' as const,
      impact: 'medium' as const,
      category: 'Market Volatility',
      keywords: ['VIX', 'Volatility', 'Earnings']
    }
  ];

  if (!sentimentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tremor-background dark:bg-dark-tremor-background">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-tremor-brand dark:text-dark-tremor-brand mx-auto mb-4" />
          <Text className="text-tremor-content dark:text-dark-tremor-content">
            Loading market intelligence...
          </Text>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-tremor-background dark:bg-dark-tremor-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Flex justifyContent="between" alignItems="center" className="mb-4">
            <div>
              <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
                Market Sentiment Dashboard
              </Title>
              <Text className="text-tremor-content dark:text-dark-tremor-content mt-1">
                Professional trading intelligence • Last updated: {new Date(sentimentData.lastUpdated).toLocaleString()}
              </Text>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Button
                onClick={fetchData}
                loading={loading}
                icon={RefreshCw}
                variant="secondary"
                size="sm"
              >
                Refresh
              </Button>
            </div>
          </Flex>

          {error && (
            <Callout
              title="Data Notice"
              icon={AlertCircle}
              color="yellow"
              className="mt-4"
            >
              Using cached/mock data: {error}
            </Callout>
          )}
        </div>

        {/* Main Dashboard Grid */}
        <Grid numItemsSm={1} numItemsLg={12} className="gap-6">
          {/* Primary Sentiment Gauge */}
          <Col numColSpan={12} numColSpanLg={4}>
            <SentimentGauge 
              value={sentimentData.fearGreedIndex} 
              title="Fear & Greed Index"
              size="lg"
            />
          </Col>

          {/* Key Metrics */}
          <Col numColSpan={12} numColSpanLg={8}>
            <Grid numItemsSm={2} numItemsLg={4} className="gap-4 h-full">
              <Col numColSpan={1}>
                <MetricCard
                  title="SPY Price"
                  value={`$${(500 + sentimentData.spyChange * 5).toFixed(2)}`}
                  change={sentimentData.spyChange}
                  changeType="percentage"
                  chart={{
                    data: generateMockChartData(500 + sentimentData.spyChange * 5, 0.02),
                    color: sentimentData.spyChange >= 0 ? 'emerald' : 'red'
                  }}
                  status={sentimentData.spyChange >= 2 ? 'excellent' : sentimentData.spyChange >= 0 ? 'good' : sentimentData.spyChange >= -2 ? 'fair' : 'poor'}
                  size="sm"
                />
              </Col>
              <Col numColSpan={1}>
                <MetricCard
                  title="QQQ Price"
                  value={`$${(400 + sentimentData.qqqqChange * 4).toFixed(2)}`}
                  change={sentimentData.qqqqChange}
                  changeType="percentage"
                  chart={{
                    data: generateMockChartData(400 + sentimentData.qqqqChange * 4, 0.02),
                    color: sentimentData.qqqqChange >= 0 ? 'emerald' : 'red'
                  }}
                  status={sentimentData.qqqqChange >= 2 ? 'excellent' : sentimentData.qqqqChange >= 0 ? 'good' : sentimentData.qqqqChange >= -2 ? 'fair' : 'poor'}
                  size="sm"
                />
              </Col>
              <Col numColSpan={1}>
                <MetricCard
                  title="VIX Level"
                  value={sentimentData.vixLevel.toFixed(2)}
                  trend={sentimentData.vixLevel > 25 ? 'up' : sentimentData.vixLevel < 15 ? 'down' : 'neutral'}
                  chart={{
                    data: generateMockChartData(sentimentData.vixLevel, 0.1),
                    color: sentimentData.vixLevel > 25 ? 'red' : 'emerald'
                  }}
                  status={sentimentData.vixLevel < 15 ? 'excellent' : sentimentData.vixLevel < 20 ? 'good' : sentimentData.vixLevel < 30 ? 'fair' : 'poor'}
                  size="sm"
                />
              </Col>
              <Col numColSpan={1}>
                <MetricCard
                  title="Put/Call Ratio"
                  value={sentimentData.putCallRatio.toFixed(3)}
                  trend={sentimentData.putCallRatio > 1.2 ? 'up' : sentimentData.putCallRatio < 0.8 ? 'down' : 'neutral'}
                  chart={{
                    data: generateMockChartData(sentimentData.putCallRatio, 0.1),
                    color: sentimentData.putCallRatio > 1.0 ? 'red' : 'emerald'
                  }}
                  status={sentimentData.putCallRatio < 0.8 ? 'excellent' : sentimentData.putCallRatio < 1.0 ? 'good' : sentimentData.putCallRatio < 1.2 ? 'fair' : 'poor'}
                  size="sm"
                />
              </Col>
            </Grid>
          </Col>

          {/* Timeline Chart */}
          <Col numColSpan={12} numColSpanLg={8}>
            <TimelineChart
              title="Sentiment Timeline"
              data={generateTimelineData()}
              height={400}
              showControls={true}
              defaultPeriod="1M"
            />
          </Col>

          {/* News Feed */}
          <Col numColSpan={12} numColSpanLg={4}>
            <NewsCard
              news={generateNewsData()}
              title="Market News"
              maxItems={5}
              showSentiment={true}
              showCategory={true}
              layout="list"
            />
          </Col>

          {/* Sector Heatmap */}
          <Col numColSpan={12}>
            <SectorHeatmap
              title="Sector Performance Heatmap"
              data={generateSectorData()}
              layout="grid"
              size="md"
            />
          </Col>

          {/* Additional Metrics */}
          <Col numColSpan={12} numColSpanLg={6}>
            <MetricCard
              title="IWM Small Cap Index"
              value={`$${(200 + sentimentData.iwmChange * 2).toFixed(2)}`}
              change={sentimentData.iwmChange}
              changeType="percentage"
              chart={{
                data: generateMockChartData(200 + sentimentData.iwmChange * 2, 0.02, 30),
                color: sentimentData.iwmChange >= 0 ? 'emerald' : 'red',
                showChart: true
              }}
              subtitle="Small-cap market performance indicator"
              target={210}
              status={sentimentData.iwmChange >= 2 ? 'excellent' : sentimentData.iwmChange >= 0 ? 'good' : sentimentData.iwmChange >= -2 ? 'fair' : 'poor'}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </Col>

          <Col numColSpan={12} numColSpanLg={6}>
            <MetricCard
              title="Market Volatility Index"
              value={`${(sentimentData.vixLevel * 1.2).toFixed(1)}%`}
              trend={sentimentData.vixLevel > 25 ? 'up' : 'down'}
              chart={{
                data: generateMockChartData(sentimentData.vixLevel * 1.2, 0.15, 30),
                color: sentimentData.vixLevel > 25 ? 'red' : 'blue',
                showChart: true
              }}
              subtitle="Expected 30-day volatility measure"
              target={20}
              status={sentimentData.vixLevel < 15 ? 'excellent' : sentimentData.vixLevel < 20 ? 'good' : sentimentData.vixLevel < 30 ? 'fair' : 'poor'}
              icon={<Activity className="h-5 w-5" />}
            />
          </Col>
        </Grid>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-tremor-border dark:border-dark-tremor-border">
          <Flex justifyContent="between" alignItems="center" className="flex-col sm:flex-row gap-4">
            <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-sm">
              Professional Market Sentiment Tracker • Real-time Trading Intelligence
            </Text>
            
            <div className="flex items-center gap-4">
              <Button
                variant="light"
                size="xs"
                icon={Heart}
                iconPosition="left"
                className="text-xs"
                onClick={() => window.open('https://revolut.me/your-revolut-link', '_blank')}
              >
                Support Development
              </Button>
              
              <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs">
                Data updates every 5 minutes
              </Text>
            </div>
          </Flex>
        </footer>
      </div>
    </main>
  );
}