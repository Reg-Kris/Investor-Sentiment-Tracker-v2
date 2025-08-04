'use client';

import { DonutChart, Card, Metric, Text } from '@tremor/react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface SentimentGaugeProps {
  value: number;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  showCard?: boolean;
  className?: string;
}

export default function SentimentGauge({ 
  value, 
  title = "Fear & Greed Index",
  size = 'md',
  showCard = true,
  className 
}: SentimentGaugeProps) {
  const getSentimentData = (value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    
    if (clampedValue < 20) {
      return {
        label: 'Extreme Fear',
        color: 'red',
        bgColor: 'bg-red-500',
        textColor: 'text-red-600 dark:text-red-400',
        description: 'Market showing extreme pessimism'
      };
    }
    if (clampedValue < 40) {
      return {
        label: 'Fear',
        color: 'orange',
        bgColor: 'bg-orange-500',
        textColor: 'text-orange-600 dark:text-orange-400',
        description: 'Market sentiment is bearish'
      };
    }
    if (clampedValue < 60) {
      return {
        label: 'Neutral',
        color: 'yellow',
        bgColor: 'bg-yellow-500',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        description: 'Market sentiment is balanced'
      };
    }
    if (clampedValue < 80) {
      return {
        label: 'Greed',
        color: 'emerald',
        bgColor: 'bg-emerald-500',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        description: 'Market sentiment is bullish'
      };
    }
    return {
      label: 'Extreme Greed',
      color: 'green',
      bgColor: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
      description: 'Market showing extreme optimism'
    };
  };

  const sentimentData = getSentimentData(value);
  const chartData = [
    {
      name: sentimentData.label,
      value: value,
      color: sentimentData.color,
    },
    {
      name: 'Remaining',
      value: 100 - value,
      color: 'gray',
    },
  ];

  const sizeClasses = {
    sm: 'h-32',
    md: 'h-40',
    lg: 'h-48'
  };

  const metricSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

  const content = (
    <div className={clsx('relative', className)}>
      <div className={clsx('relative', sizeClasses[size])}>
        <DonutChart
          data={chartData}
          category="value"
          index="name"
          colors={[sentimentData.color, 'gray']}
          className="h-full"
          showAnimation={true}
          animationDuration={1000}
          showTooltip={false}
          showLabel={false}
        />
        
        {/* Center content overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Metric 
              className={clsx(
                metricSizes[size],
                'font-bold',
                sentimentData.textColor
              )}
            >
              {value}
            </Metric>
            <Text className={clsx(
              'text-xs font-medium mt-1',
              sentimentData.textColor
            )}>
              {sentimentData.label}
            </Text>
          </div>
        </div>
      </div>
      
      {/* Sentiment indicator bar */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs text-tremor-content dark:text-dark-tremor-content">
          <span>Extreme Fear</span>
          <span>Extreme Greed</span>
        </div>
        <div className="relative h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 w-1 h-full bg-white dark:bg-gray-900 border border-tremor-border dark:border-dark-tremor-border rounded-full shadow-sm transition-all duration-300"
            style={{ left: `${value}%`, transform: 'translateX(-50%)' }}
            aria-label={`Sentiment indicator at ${value}%`}
          />
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
      >
        <Text className="text-center text-xs mt-2 text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
          {sentimentData.description}
        </Text>
      </motion.div>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card 
        className="p-6 glass-subtle fintech-glow interactive-scale"
        decoration="top"
        decorationColor={sentimentData.color}
      >
        <motion.div 
          className="flex items-center justify-between mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Text className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong fintech-text-gradient">
            {title}
          </Text>
          <motion.div 
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm',
              sentimentData.bgColor,
              'text-white shadow-lg'
            )}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.4, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {sentimentData.label}
          </motion.div>
        </motion.div>
        {content}
      </Card>
    </motion.div>
  );
}