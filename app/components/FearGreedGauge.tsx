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
        color: '#BC6C6C', // Warm muted coral
        bgColor: 'gradient-extreme-fear',
        textColor: 'text-[#BC6C6C]',
        description: 'Market showing extreme pessimism',
        warmColor: 'rgb(188, 108, 108)'
      };
    }
    if (clampedValue < 40) {
      return {
        label: 'Fear',
        color: '#CDA45E', // Warm amber
        bgColor: 'gradient-fear',
        textColor: 'text-[#CDA45E]',
        description: 'Market sentiment is bearish',
        warmColor: 'rgb(205, 164, 94)'
      };
    }
    if (clampedValue < 60) {
      return {
        label: 'Neutral',
        color: '#F8B4C8', // Blush pink (secondary)
        bgColor: 'gradient-neutral',
        textColor: 'text-[#F8B4C8]',
        description: 'Market sentiment is balanced',
        warmColor: 'rgb(218, 165, 142)'
      };
    }
    if (clampedValue < 80) {
      return {
        label: 'Greed',
        color: '#A37F90', // Dusty mauve
        bgColor: 'gradient-greed',
        textColor: 'text-[#A37F90]',
        description: 'Market sentiment is bullish',
        warmColor: 'rgb(163, 127, 144)'
      };
    }
    return {
      label: 'Extreme Greed',
      color: '#93A386', // Sage green
      bgColor: 'gradient-extreme-greed',
      textColor: 'text-[#93A386]',
      description: 'Market showing extreme optimism',
      warmColor: 'rgb(147, 163, 134)'
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
      
      {/* Sentiment indicator bar with proper color segments */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs text-tremor-content dark:text-dark-tremor-content">
          <span>Extreme Fear</span>
          <span>Extreme Greed</span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {/* Properly segmented color bar that matches sentiment ranges */}
          <div className="flex h-full rounded-full overflow-hidden">
            <div className="w-[20%] bg-[#BC6C6C]" /> {/* 0-20: Extreme Fear */}
            <div className="w-[20%] bg-[#CDA45E]" /> {/* 20-40: Fear */}
            <div className="w-[20%] bg-[#F8B4C8]" /> {/* 40-60: Neutral */}
            <div className="w-[20%] bg-[#A37F90]" /> {/* 60-80: Greed */}
            <div className="w-[20%] bg-[#93A386]" /> {/* 80-100: Extreme Greed */}
          </div>
          
          {/* Animated indicator that moves along the curve */}
          <motion.div 
            className="absolute top-0 w-3 h-full bg-white dark:bg-gray-900 border-2 border-gray-600 dark:border-gray-300 rounded-full shadow-lg transition-all duration-500 ease-out"
            style={{ 
              left: `calc(${Math.min(Math.max(value, 0), 100)}% - 6px)`, // Constrain to 0-100% and center the 12px wide indicator
              boxShadow: `0 0 12px ${sentimentData.warmColor}, 0 3px 6px rgba(0,0,0,0.3)`
            }}
            aria-label={`Sentiment indicator at ${value}%`}
            initial={{ scale: 0, y: -5 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, type: 'spring', stiffness: 250 }}
            whileHover={{ scale: 1.3, y: -2 }}
            whileTap={{ scale: 0.9 }}
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
              'px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm text-white shadow-lg',
              sentimentData.bgColor
            )}
            style={{
              background: `linear-gradient(135deg, ${sentimentData.warmColor}, ${sentimentData.warmColor}dd)`,
              boxShadow: `0 4px 12px ${sentimentData.warmColor}40`
            }}
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