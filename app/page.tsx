'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Heart, Activity, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Grid, Col, Title, Text, Flex, Button, Callout } from '@tremor/react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition, { ViewportAnimation, HoverScale, FloatingAnimation } from './components/PageTransition';

// Import essential components (loaded immediately)
import ThemeToggle from './components/ThemeToggle';
import SentimentHero from './components/SentimentHero';
import EducationalMetricCard from './components/EducationalMetricCard';

// Import utilities
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


  if (!sentimentData) {
    return (
      <div className="min-h-screen bg-tremor-background dark:bg-dark-tremor-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-6 py-6 lg:py-8 xl:py-10">
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
                    <div className="glass-card p-6">
                      <div className="h-4 w-20 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-pulse mb-4"></div>
                      <div className="h-8 w-16 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-24 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-pulse"></div>
                    </div>
                  </Col>
                ))}
              </Grid>
            </Col>
            
            {/* Timeline Chart Skeleton */}
            <Col numColSpan={12} numColSpanLg={8}>
              <div className="glass-card p-6">
                <div className="h-4 w-32 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-pulse mb-4"></div>
                <div className="h-40 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-pulse"></div>
              </div>
            </Col>
            
            {/* News Skeleton */}
            <Col numColSpan={12} numColSpanLg={4}>
              <div className="glass-card p-6">
                <div className="h-4 w-20 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-full bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-pulse"></div>
                      <div className="h-3 w-3/4 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
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
      <main className="min-h-screen bg-fintech-surface-light dark:bg-fintech-surface-dark transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-6 py-6 lg:py-8 xl:py-10 relative overflow-hidden">
        {/* Hero Section with Giant Sentiment Gauge */}
        <ViewportAnimation animation="bounce" threshold={0.2}>
          <SentimentHero 
            value={sentimentData.fearGreedIndex} 
            lastUpdated={sentimentData.lastUpdated} 
          />
        </ViewportAnimation>

        {/* Quick Actions */}
        <ViewportAnimation animation="fadeUp" delay={0.2} className="mb-8">
          <Flex justifyContent="between" alignItems="center" className="mb-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-lg lg:text-xl font-semibold">
                Market Indicators Explained
              </Title>
              <Text className="text-tremor-content dark:text-dark-tremor-content mt-1 text-sm lg:text-base">
                Each metric tells you what investors are thinking and feeling
              </Text>
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
                  Refresh Data
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
        </ViewportAnimation>

        {/* Educational Metric Cards */}
        <ViewportAnimation animation="slideUp" delay={0.1}>
          <Grid numItemsSm={1} numItemsMd={2} numItemsLg={4} className="gap-4 lg:gap-6">
            {/* Market Price Indicators */}
            <HoverScale className="h-full">
              <Col numColSpan={1}>
                <div className="float-subtle">
                  <EducationalMetricCard
                  title="S&P 500 Price (SPY)"
                  value={`$${(sentimentData.spyPrice || 450).toFixed(2)}`}
                  change={sentimentData.spyChange}
                  changeType="percentage"
                  explanation={{
                    whatItIs: "The price of the SPDR S&P 500 ETF, which tracks America's 500 largest companies. Think of it as the temperature of the entire U.S. stock market.",
                    whyItMatters: "When SPY goes up, most stocks go up too. When it falls, most stocks fall. It's like watching the health of the whole economy in one number.",
                    currentMeaning: sentimentData.spyChange >= 2 ? "Strong market performance - investors are confident and buying" : 
                                   sentimentData.spyChange >= 0 ? "Steady market performance - cautious optimism" :
                                   sentimentData.spyChange >= -2 ? "Market under pressure - some selling activity" :
                                   "Significant market decline - investors are worried and selling",
                    historicalContext: "SPY typically returns 7-10% annually over long periods, but can swing ±20% in any given year."
                  }}
                  trafficLight={sentimentData.spyChange >= 1 ? 'green' : sentimentData.spyChange >= -1 ? 'yellow' : 'red'}
                  icon={<TrendingUp className="h-5 w-5" />}
                  size="md"
                  />
                </div>
              </Col>
            </HoverScale>

            <HoverScale className="h-full">
              <Col numColSpan={1}>
                <div className="float-delayed">
                  <EducationalMetricCard
                    title="Tech Stocks Price (QQQ)"
                  value={`$${(sentimentData.qqqPrice || 380).toFixed(2)}`}
                  change={sentimentData.qqqqChange}
                  changeType="percentage"
                  explanation={{
                    whatItIs: "The price of the Invesco QQQ Trust, which tracks the 100 largest technology companies like Apple, Microsoft, Google, and Amazon.",
                    whyItMatters: "Technology stocks often lead market trends. When investors are optimistic about the future, they buy tech stocks. When worried, they sell them first.",
                    currentMeaning: sentimentData.qqqqChange >= 2 ? "Technology sector is thriving - high investor confidence in innovation and growth" :
                                   sentimentData.qqqqChange >= 0 ? "Tech sector stable - moderate growth expectations" :
                                   sentimentData.qqqqChange >= -2 ? "Tech sector facing headwinds - growth concerns" :
                                   "Tech sector selling off - investors reducing risk and growth exposure",
                    historicalContext: "QQQ tends to move more dramatically than SPY - rising faster in bull markets but falling harder in bear markets."
                  }}
                  trafficLight={sentimentData.qqqqChange >= 1 ? 'green' : sentimentData.qqqqChange >= -1 ? 'yellow' : 'red'}
                  icon={<Activity className="h-5 w-5" />}
                  size="md"
                  />
                </div>
              </Col>
            </HoverScale>

            {/* Volatility Indicators */}
            <HoverScale className="h-full">
              <Col numColSpan={1}>
                <div className="float-slow">
                  <EducationalMetricCard
                    title="Market Fear Gauge (VIX)"
                  value={sentimentData.vixLevel.toFixed(1)}
                  explanation={{
                    whatItIs: "The VIX measures how much volatility (big price swings) investors expect over the next 30 days. It's often called the 'fear gauge' of the market.",
                    whyItMatters: "When the VIX is high, investors expect wild price swings and uncertainty. When it's low, they expect calm, steady markets. It helps you understand market stress levels.",
                    currentMeaning: sentimentData.vixLevel < 15 ? "Market is very calm - investors expect small, steady price movements" :
                                   sentimentData.vixLevel < 25 ? "Normal market conditions - typical day-to-day volatility expected" :
                                   sentimentData.vixLevel < 35 ? "Elevated stress - investors expect larger price swings and uncertainty" :
                                   "High market stress - investors expect dramatic price movements and potential crisis conditions",
                    historicalContext: "VIX typically ranges from 10-30. Readings above 40 often coincide with market crashes, while readings below 12 suggest complacency."
                  }}
                  trafficLight={sentimentData.vixLevel < 20 ? 'green' : sentimentData.vixLevel < 30 ? 'yellow' : 'red'}
                  icon={<AlertCircle className="h-5 w-5" />}
                  size="md"
                  />
                </div>
              </Col>
            </HoverScale>

            <HoverScale className="h-full">
              <Col numColSpan={1}>
                <div className="float-card">
                  <EducationalMetricCard
                    title="Options Sentiment (Put/Call)"
                  value={sentimentData.putCallRatio.toFixed(2)}
                  explanation={{
                    whatItIs: "This ratio compares put options (bets that stocks will fall) to call options (bets that stocks will rise). It shows what options traders are expecting.",
                    whyItMatters: "When the ratio is high, more traders are betting on falling prices (pessimistic). When low, more are betting on rising prices (optimistic). It reveals professional trader sentiment.",
                    currentMeaning: sentimentData.putCallRatio > 1.2 ? "Heavy bearish sentiment - professional traders expect significant market declines" :
                                   sentimentData.putCallRatio > 1.0 ? "Moderate bearish sentiment - more traders betting on declines than gains" :
                                   sentimentData.putCallRatio > 0.8 ? "Balanced sentiment - roughly equal bets on market direction" :
                                   "Bullish sentiment - more traders betting on market gains than losses",
                    historicalContext: "Extreme readings (above 1.4 or below 0.6) often signal market turning points, as crowd sentiment tends to be wrong at extremes."
                  }}
                  trafficLight={sentimentData.putCallRatio > 1.3 || sentimentData.putCallRatio < 0.7 ? 'red' : 
                               sentimentData.putCallRatio > 1.1 || sentimentData.putCallRatio < 0.9 ? 'yellow' : 'green'}
                  icon={<TrendingDown className="h-5 w-5" />}
                  size="md"
                  />
                </div>
              </Col>
            </HoverScale>
          </Grid>
        </ViewportAnimation>

        {/* Educational Guide Section */}
        <ViewportAnimation 
          animation="scale" 
          delay={0.3}
          className="mt-8 lg:mt-12 bg-fintech-surface-light/60 dark:bg-fintech-surface-dark/60 backdrop-blur-sm rounded-xl p-6 lg:p-8 border border-fintech-primary-200/30 dark:border-fintech-primary-700/30 warm-glow"
        >
          <div className="text-center mb-6 lg:mb-8">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Understanding Market Sentiment: A Beginner&apos;s Guide
            </h3>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Learn how to read the market&apos;s emotional state and what it means for your investments
            </p>
          </div>
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="space-y-3 lg:space-y-4 p-4 lg:p-6 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-center">
                <div className="text-4xl mb-2">🟢</div>
                <h4 className="font-bold text-green-800 dark:text-green-200 text-base lg:text-lg mb-2">
                  Markets Are Calm
                </h4>
                <p className="text-xs lg:text-sm text-green-700 dark:text-green-300 mb-2 lg:mb-3">
                  Low VIX • Balanced Put/Call Ratios • Steady Price Movement
                </p>
              </div>
              <p className="text-xs lg:text-sm text-green-800 dark:text-green-200">
                Investors are confident and trading normally. This is a good time for regular investment strategies. 
                Prices move predictably based on company earnings and economic fundamentals.
              </p>
              <div className="bg-green-100 dark:bg-green-900/50 p-2 lg:p-3 rounded text-xs text-green-800 dark:text-green-200">
                <strong>What to do:</strong> Execute your normal investment plan. Good time for dollar-cost averaging.
              </div>
            </div>
            
            <div className="space-y-3 lg:space-y-4 p-4 lg:p-6 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-center">
                <div className="text-4xl mb-2">🟡</div>
                <h4 className="font-bold text-yellow-800 dark:text-yellow-200 text-base lg:text-lg mb-2">
                  Markets Are Nervous
                </h4>
                <p className="text-xs lg:text-sm text-yellow-700 dark:text-yellow-300 mb-2 lg:mb-3">
                  Moderate VIX • Slightly Elevated Ratios • Some Uncertainty
                </p>
              </div>
              <p className="text-xs lg:text-sm text-yellow-800 dark:text-yellow-200">
                Some uncertainty is in the air. Investors are more cautious but not panicking. 
                This is a good time to be patient and avoid making impulsive decisions.
              </p>
              <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 lg:p-3 rounded text-xs text-yellow-800 dark:text-yellow-200">
                <strong>What to do:</strong> Stay disciplined. Watch for opportunities but don&apos;t rush into decisions.
              </div>
            </div>
            
            <div className="space-y-3 lg:space-y-4 p-4 lg:p-6 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-center">
                <div className="text-4xl mb-2">🔴</div>
                <h4 className="font-bold text-red-800 dark:text-red-200 text-base lg:text-lg mb-2">
                  Markets Are Extreme
                </h4>
                <p className="text-xs lg:text-sm text-red-700 dark:text-red-300 mb-2 lg:mb-3">
                  High VIX • Extreme Ratios • Fear or Greed Dominates
                </p>
              </div>
              <p className="text-xs lg:text-sm text-red-800 dark:text-red-200">
                Fear or greed dominates rational thinking. These extreme moments often create 
                the best opportunities - buying during fear or being cautious during greed.
              </p>
              <div className="bg-red-100 dark:bg-red-900/50 p-2 lg:p-3 rounded text-xs text-red-800 dark:text-red-200">
                <strong>What to do:</strong> Consider contrarian moves. When others panic, stay calm. When others are euphoric, be cautious.
              </div>
            </div>
          </div>
        </ViewportAnimation>

        {/* Educational Note */}
        <ViewportAnimation 
          animation="fadeUp" 
          delay={0.4}
          className="mt-8 lg:mt-12 p-4 lg:p-6 bg-gradient-to-r from-fintech-secondary-50 to-fintech-accent-50 dark:from-fintech-secondary-950/50 dark:to-fintech-accent-950/50 rounded-xl border border-fintech-secondary-200/50 dark:border-fintech-secondary-800/50 champagne-glow"
        >
          <div className="text-center">
            <h3 className="text-base lg:text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Remember: Markets are Emotional
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-xs lg:text-sm max-w-3xl mx-auto">
              These indicators show you what other investors are feeling - fear, greed, optimism, or panic. 
              The best investment opportunities often come when others are being too emotional. 
              When everyone is fearful, markets may be oversold. When everyone is greedy, markets may be overpriced.
            </p>
          </div>
        </ViewportAnimation>

        {/* Footer */}
        <ViewportAnimation 
          animation="fadeUp" 
          delay={0.5}
          className="mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-fintech-primary-200/30 dark:border-fintech-primary-700/30"
        >
          <Flex justifyContent="between" alignItems="center" className="flex-col lg:flex-row gap-3 lg:gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 1.3 }}
              className="text-center lg:text-left"
            >
              <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs lg:text-sm">
                Market Sentiment Tracker • Helping Novice Investors Understand Market Emotions
              </Text>
              <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs mt-1">
                Data updates every 5 minutes • Not financial advice - for educational purposes only
              </Text>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-3 lg:gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 1.4 }}
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
                  className="text-xs backdrop-blur-sm border border-fintech-primary-200/50 dark:border-fintech-primary-700/50 hover:bg-fintech-primary-50 dark:hover:bg-fintech-primary-950"
                  onClick={() => window.open('https://revolut.me/kristiuo4b', '_blank')}
                >
                  Buy me a coffee ☕
                </Button>
              </motion.div>
              
              <div className="flex items-center space-x-1">
                <FloatingAnimation intensity={6} duration={3}>
                  <div className="w-2 h-2 bg-fintech-success-500 rounded-full animate-pulse" />
                </FloatingAnimation>
                <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs">
                  Live Data
                </Text>
              </div>
            </motion.div>
          </Flex>
        </ViewportAnimation>
        </div>
      </main>
    </PageTransition>
  );
}