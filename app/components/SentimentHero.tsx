'use client';

import { Card, Text, Metric } from '@tremor/react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Eye, DollarSign } from 'lucide-react';

interface SentimentHeroProps {
  value: number;
  lastUpdated: string;
}

export default function SentimentHero({ value, lastUpdated }: SentimentHeroProps) {
  const getSentimentData = (value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    
    if (clampedValue < 20) {
      return {
        label: 'EXTREME FEAR',
        shortLabel: 'Fear',
        color: 'red',
        bgGradient: 'from-fintech-error-500 to-fintech-error-700',
        textColor: 'text-fintech-error-50',
        shadowColor: 'shadow-fintech-error-500/30',
        icon: <AlertCircle className="h-12 w-12" />,
        meaning: 'Investors are PANICKING',
        explanation: 'When fear dominates, investors sell everything. This often creates buying opportunities.',
        actionHint: 'History shows extreme fear often signals market bottoms',
        marketImplication: 'Markets may be oversold - potential buying opportunity',
        trafficLight: '🔴'
      };
    }
    if (clampedValue < 40) {
      return {
        label: 'FEAR',
        shortLabel: 'Fear',
        color: 'orange',
        bgGradient: 'from-fintech-warning-500 to-fintech-error-600',
        textColor: 'text-fintech-warning-50',
        shadowColor: 'shadow-fintech-warning-500/30',
        icon: <TrendingDown className="h-12 w-12" />,
        meaning: 'Investors are WORRIED',
        explanation: 'When investors worry, they prefer cash over stocks. Volatility increases.',
        actionHint: 'Fear can create good entry points for patient investors',
        marketImplication: 'Markets typically decline - be cautious but watch for opportunities',
        trafficLight: '🟠'
      };
    }
    if (clampedValue < 60) {
      return {
        label: 'NEUTRAL',
        shortLabel: 'Neutral',
        color: 'blue',
        bgGradient: 'from-fintech-secondary-500 to-fintech-accent-600',
        textColor: 'text-fintech-secondary-50',
        shadowColor: 'shadow-fintech-secondary-500/30',
        icon: <Eye className="h-12 w-12" />,
        meaning: 'Investors are BALANCED',
        explanation: 'Neither fear nor greed dominates. Markets move based on fundamentals.',
        actionHint: 'Normal market conditions - standard investment strategies work',
        marketImplication: 'Markets likely to follow earnings and economic data',
        trafficLight: '🟡'
      };
    }
    if (clampedValue < 80) {
      return {
        label: 'GREED',
        shortLabel: 'Greed',
        color: 'emerald',
        bgGradient: 'from-fintech-success-500 to-fintech-primary-600',
        textColor: 'text-fintech-success-50',
        shadowColor: 'shadow-fintech-success-500/30',
        icon: <TrendingUp className="h-12 w-12" />,
        meaning: 'Investors are OPTIMISTIC',
        explanation: 'When greed grows, investors buy aggressively. Prices may become stretched.',
        actionHint: 'Good time to be in the market, but watch for signs of excess',
        marketImplication: 'Markets typically rise - ride the trend but stay alert',
        trafficLight: '🟢'
      };
    }
    return {
      label: 'EXTREME GREED',
      shortLabel: 'Greed',
      color: 'green',
      bgGradient: 'from-fintech-success-600 to-fintech-success-800',
      textColor: 'text-fintech-success-50',
      shadowColor: 'shadow-fintech-success-500/30',
      icon: <DollarSign className="h-12 w-12" />,
      meaning: 'Investors are EUPHORIC',
      explanation: 'When euphoria peaks, everyone buys. This often signals market tops.',
      actionHint: 'Extreme greed often precedes market corrections',
      marketImplication: 'Markets may be overbought - consider taking some profits',
      trafficLight: '🔴'
    };
  };

  const sentimentData = getSentimentData(value);
  
  // Calculate position for the needle
  const needleAngle = (value / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className="mb-6 lg:mb-8 xl:mb-10"
    >
      <Card className={clsx(
        'relative overflow-hidden p-6 lg:p-8 xl:p-10 border-0',
        `bg-gradient-to-br ${sentimentData.bgGradient}`,
        sentimentData.shadowColor,
        'shadow-2xl'
      )}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(255,255,255,0.05)_50%,transparent_52%)]" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-4 lg:mb-6"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.4, type: 'spring', stiffness: 200 }}
                className={sentimentData.textColor}
              >
                {sentimentData.icon}
              </motion.div>
            </div>
            <Text className={clsx(sentimentData.textColor, 'text-lg lg:text-xl font-medium mb-2')}>
              Market Sentiment Right Now
            </Text>
            <motion.div
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h1 className={clsx(
                sentimentData.textColor,
                'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-2 tracking-tight'
              )}>
                {sentimentData.label}
              </h1>
            </motion.div>
            <Text className={clsx(sentimentData.textColor, 'text-lg lg:text-xl xl:text-2xl font-semibold opacity-90')}>
              {sentimentData.meaning}
            </Text>
          </motion.div>

          {/* Giant Gauge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex justify-center mb-6 lg:mb-8"
          >
            <div className="relative w-64 h-32 lg:w-80 lg:h-40">
              {/* Gauge Background */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 320 160"
                className="absolute inset-0"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Background Arc */}
                <path
                  d="M 40 140 A 120 120 0 0 1 280 140"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="20"
                  fill="none"
                  strokeLinecap="round"
                />
                
                {/* Extreme Fear Zone (0-20) */}
                <motion.path
                  d="M 40 140 A 120 120 0 0 1 104 44"
                  stroke="rgba(188, 108, 108, 0.9)"
                  strokeWidth="20"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
                
                {/* Fear Zone (20-40) */}
                <motion.path
                  d="M 104 44 A 120 120 0 0 1 140 20"
                  stroke="rgba(205, 164, 94, 0.9)"
                  strokeWidth="20"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.7 }}
                />
                
                {/* Neutral Zone (40-60) */}
                <motion.path
                  d="M 140 20 A 120 120 0 0 1 180 20"
                  stroke="rgba(218, 165, 142, 0.9)"
                  strokeWidth="20"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.9 }}
                />
                
                {/* Greed Zone (60-80) */}
                <motion.path
                  d="M 180 20 A 120 120 0 0 1 216 44"
                  stroke="rgba(147, 163, 134, 0.9)"
                  strokeWidth="20"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 1.1 }}
                />
                
                {/* Extreme Greed Zone (80-100) */}
                <motion.path
                  d="M 216 44 A 120 120 0 0 1 280 140"
                  stroke="rgba(132, 147, 119, 0.9)"
                  strokeWidth="20"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 1.3 }}
                />
                
                {/* Needle */}
                <motion.line
                  x1="160"
                  y1="140"
                  x2="160"
                  y2="60"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ rotate: -90 }}
                  animate={{ rotate: needleAngle }}
                  transition={{ duration: 1.5, delay: 1, type: 'spring', stiffness: 100 }}
                  style={{ transformOrigin: '160px 140px' }}
                />
                
                {/* Needle Base */}
                <circle
                  cx="160"
                  cy="140"
                  r="8"
                  fill="white"
                  className="drop-shadow-lg"
                />
              </svg>
              
              {/* Value Display */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center"
              >
                <Metric className={clsx(sentimentData.textColor, 'text-4xl font-black')}>
                  {value}
                </Metric>
                <Text className={clsx(sentimentData.textColor, 'text-sm opacity-80')}>
                  out of 100
                </Text>
              </motion.div>
              
              {/* Zone Labels */}
              <div className="absolute top-full mt-4 w-full flex justify-between text-sm font-medium">
                <span className={clsx(sentimentData.textColor, 'opacity-70')}>FEAR</span>
                <span className={clsx(sentimentData.textColor, 'opacity-70')}>NEUTRAL</span>
                <span className={clsx(sentimentData.textColor, 'opacity-70')}>GREED</span>
              </div>
            </div>
          </motion.div>

          {/* Explanation Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"
          >
            {/* What This Means */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 lg:p-4 border border-white/20">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">{sentimentData.trafficLight}</span>
                <Text className={clsx(sentimentData.textColor, 'font-semibold')}>
                  What This Means
                </Text>
              </div>
              <Text className={clsx(sentimentData.textColor, 'text-sm opacity-90')}>
                {sentimentData.explanation}
              </Text>
            </div>

            {/* For Your Portfolio */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 lg:p-4 border border-white/20">
              <div className="flex items-center mb-2">
                <CheckCircle className={clsx(sentimentData.textColor, 'h-5 w-5 mr-2')} />
                <Text className={clsx(sentimentData.textColor, 'font-semibold')}>
                  For Your Portfolio
                </Text>
              </div>
              <Text className={clsx(sentimentData.textColor, 'text-sm opacity-90')}>
                {sentimentData.actionHint}
              </Text>
            </div>

            {/* Market Outlook */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 lg:p-4 border border-white/20">
              <div className="flex items-center mb-2">
                <TrendingUp className={clsx(sentimentData.textColor, 'h-5 w-5 mr-2')} />
                <Text className={clsx(sentimentData.textColor, 'font-semibold')}>
                  Market Outlook
                </Text>
              </div>
              <Text className={clsx(sentimentData.textColor, 'text-sm opacity-90')}>
                {sentimentData.marketImplication}
              </Text>
            </div>
          </motion.div>

          {/* Last Updated */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.6 }}
            className="text-center mt-4 lg:mt-6"
          >
            <Text className={clsx(sentimentData.textColor, 'text-sm opacity-70')}>
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </Text>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}