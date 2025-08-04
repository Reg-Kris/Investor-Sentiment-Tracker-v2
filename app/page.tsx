'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Heart, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { Grid, Col, Title, Text, Flex, Button, Callout } from '@tremor/react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition, { StaggerContainer, StaggerItem, MetricCardTransition, ChartReveal } from './components/PageTransition';
import { MetricCardSkeleton, ChartSkeleton, NewsFeedSkeleton } from './components/SkeletonLoader';

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
      <div className="min-h-screen bg-tremor-background dark:bg-dark-tremor-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-shimmer" />
                <div className="h-4 w-96 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-shimmer" />
              </div>
              <div className="flex space-x-3">
                <div className="h-8 w-8 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-shimmer" />
                <div className="h-8 w-20 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-shimmer" />
              </div>
            </div>
          </div>
          
          {/* Dashboard Skeleton */}
          <Grid numItemsSm={1} numItemsLg={12} className="gap-6">
            {/* Fear & Greed Gauge Skeleton */}
            <Col numColSpan={12} numColSpanLg={4}>
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-5 w-32 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-shimmer" />
                  <div className="h-6 w-20 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded-full animate-shimmer" />
                </div>
                <div className="h-48 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded-lg animate-shimmer" />
              </div>
            </Col>
            
            {/* Metric Cards Skeleton */}
            <Col numColSpan={12} numColSpanLg={8}>
              <Grid numItemsSm={2} numItemsLg={4} className="gap-4 h-full">
                {Array.from({ length: 4 }, (_, i) => (
                  <Col key={i} numColSpan={1}>
                    <div className="glass-card">
                      <MetricCardSkeleton />
                    </div>
                  </Col>
                ))}
              </Grid>
            </Col>
            
            {/* Timeline Chart Skeleton */}
            <Col numColSpan={12} numColSpanLg={8}>
              <div className="glass-card">
                <ChartSkeleton />
              </div>
            </Col>
            
            {/* News Skeleton */}
            <Col numColSpan={12} numColSpanLg={4}>
              <div className="glass-card">
                <NewsFeedSkeleton />
              </div>
            </Col>
          </Grid>
          
          {/* Loading indicator */}
          <motion.div 
            className="fixed bottom-8 right-8 flex items-center space-x-2 bg-fintech-primary-500 text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="h-4 w-4" />
            </motion.div>
            <span className="text-sm font-medium">Loading market data...</span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-tremor-background dark:bg-dark-tremor-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <Flex justifyContent="between" alignItems="center" className="mb-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong heading-gradient text-2xl font-bold">
                Market Sentiment Dashboard
              </Title>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Text className="text-tremor-content dark:text-dark-tremor-content mt-1 flex items-center space-x-2">
                  <span>Professional trading intelligence</span>
                  <span className="text-fintech-primary-500">•</span>
                  <span>Last updated: {new Date(sentimentData.lastUpdated).toLocaleString()}</span>
                  <div className="w-2 h-2 bg-fintech-success-500 rounded-full animate-pulse" />
                </Text>
              </motion.div>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ThemeToggle />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={fetchData}
                  loading={loading}
                  icon={RefreshCw}
                  variant="secondary"
                  size="sm"
                  className="micro-bounce backdrop-blur-sm"
                >
                  Refresh
                </Button>
              </motion.div>
            </motion.div>
          </Flex>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Callout
                  title="Data Notice"
                  icon={AlertCircle}
                  color="yellow"
                  className="mt-4 backdrop-blur-sm border border-yellow-200/50 dark:border-yellow-700/50"
                >
                  Using cached/mock data: {error}
                </Callout>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main Dashboard Grid */}
        <StaggerContainer>
          <Grid numItemsSm={1} numItemsLg={12} className="gap-6">
          {/* Primary Sentiment Gauge */}
          <StaggerItem>
            <Col numColSpan={12} numColSpanLg={4}>
              <SentimentGauge 
                value={sentimentData.fearGreedIndex} 
                title="Fear & Greed Index"
                size="lg"
              />
            </Col>
          </StaggerItem>

          {/* Key Metrics */}
          <StaggerItem>
            <Col numColSpan={12} numColSpanLg={8}>
              <Grid numItemsSm={2} numItemsLg={4} className="gap-4 h-full">
                <Col numColSpan={1}>
                  <MetricCard
                  title="SPY Price"
                  value={`$${(sentimentData.spyPrice || 620).toFixed(2)}`}
                  change={sentimentData.spyChange}
                  changeType="percentage"
                  chart={{
                    data: generateMockChartData(sentimentData.spyPrice || 620, 0.02),
                    color: sentimentData.spyChange >= 0 ? 'emerald' : 'red'
                  }}
                  status={sentimentData.spyChange >= 2 ? 'excellent' : sentimentData.spyChange >= 0 ? 'good' : sentimentData.spyChange >= -2 ? 'fair' : 'poor'}
                  size="sm"
                />
              </Col>
              <Col numColSpan={1}>
                <MetricCard
                  title="QQQ Price"
                  value={`$${(sentimentData.qqqPrice || 540).toFixed(2)}`}
                  change={sentimentData.qqqqChange}
                  changeType="percentage"
                  chart={{
                    data: generateMockChartData(sentimentData.qqqPrice || 540, 0.02),
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
          </StaggerItem>

          {/* Timeline Chart */}
          <StaggerItem>
            <Col numColSpan={12} numColSpanLg={8}>
              <ChartReveal delay={0.1}>
                <TimelineChart
                  title="Sentiment Timeline"
                  data={generateTimelineData()}
                  height={400}
                  showControls={true}
                  defaultPeriod="1M"
                />
              </ChartReveal>
            </Col>
          </StaggerItem>

          {/* News Feed */}
          <StaggerItem>
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
          </StaggerItem>

          {/* Sector Heatmap */}
          <StaggerItem>
            <Col numColSpan={12}>
              <SectorHeatmap
                title="Sector Performance Heatmap"
                data={generateSectorData()}
                layout="grid"
                size="md"
              />
            </Col>
          </StaggerItem>

          {/* Additional Metrics */}
          <StaggerItem>
            <Col numColSpan={12} numColSpanLg={6}>
              <MetricCard
              title="IWM Small Cap Index"
              value={`$${(sentimentData.iwmPrice || 200).toFixed(2)}`}
              change={sentimentData.iwmChange}
              changeType="percentage"
              chart={{
                data: generateMockChartData(sentimentData.iwmPrice || 200, 0.02, 30),
                color: sentimentData.iwmChange >= 0 ? 'emerald' : 'red',
                showChart: true
              }}
              subtitle="Small-cap market performance indicator"
              target={210}
              status={sentimentData.iwmChange >= 2 ? 'excellent' : sentimentData.iwmChange >= 0 ? 'good' : sentimentData.iwmChange >= -2 ? 'fair' : 'poor'}
              icon={<TrendingUp className="h-5 w-5" />}
              />
            </Col>
          </StaggerItem>

          <StaggerItem>
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
          </StaggerItem>
        </Grid>
      </StaggerContainer>

        {/* Footer */}
        <motion.footer 
          className="mt-16 pt-8 border-t border-tremor-border/50 dark:border-dark-tremor-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Flex justifyContent="between" alignItems="center" className="flex-col sm:flex-row gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 1 }}
            >
              <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-sm">
                Professional Market Sentiment Tracker • Real-time Trading Intelligence
              </Text>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 1.1 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="light"
                  size="xs"
                  icon={Heart}
                  iconPosition="left"
                  className="text-xs backdrop-blur-sm border border-fintech-primary-200/50 dark:border-fintech-primary-700/50"
                  onClick={() => window.open('https://revolut.me/your-revolut-link', '_blank')}
                >
                  Support Development
                </Button>
              </motion.div>
              
              <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs flex items-center space-x-1">
                <span>Data updates every 5 minutes</span>
                <div className="w-1 h-1 bg-fintech-success-500 rounded-full animate-pulse" />
              </Text>
            </motion.div>
          </Flex>
        </motion.footer>
        </div>
      </main>
    </PageTransition>
  );
}