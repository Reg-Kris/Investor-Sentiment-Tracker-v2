'use client';

import { Card, Text, Flex, Metric, BadgeDelta } from '@tremor/react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Info, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface EducationalMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'percentage' | 'absolute' | 'basis-points';
  explanation: {
    whatItIs: string;
    whyItMatters: string;
    currentMeaning: string;
    historicalContext?: string;
  };
  trafficLight: 'green' | 'yellow' | 'red';
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function EducationalMetricCard({
  title,
  value,
  change,
  changeType = 'percentage',
  explanation,
  trafficLight,
  icon,
  size = 'md'
}: EducationalMetricCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const getTrafficLightData = (light: 'green' | 'yellow' | 'red') => {
    switch (light) {
      case 'green':
        return {
          color: 'emerald',
          emoji: '🟢',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          textColor: 'text-emerald-700 dark:text-emerald-300'
        };
      case 'yellow':
        return {
          color: 'yellow',
          emoji: '🟡',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-700 dark:text-yellow-300'
        };
      case 'red':
        return {
          color: 'red',
          emoji: '🔴',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-700 dark:text-red-300'
        };
    }
  };

  const trafficLightData = getTrafficLightData(trafficLight);

  const getDeltaType = (change?: number) => {
    if (!change || change === 0) return 'unchanged';
    return change > 0 ? 'increase' : 'decrease';
  };

  const getTrendIcon = () => {
    if (change && change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change && change < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const sizeClasses = {
    sm: { metric: 'text-lg sm:text-xl lg:text-2xl', padding: 'p-4 sm:p-5 lg:p-6' },
    md: { metric: 'text-xl sm:text-2xl lg:text-3xl', padding: 'p-5 sm:p-6 lg:p-7' },
    lg: { metric: 'text-2xl sm:text-3xl lg:text-4xl', padding: 'p-6 sm:p-7 lg:p-8' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <Card className={clsx(
        sizeClasses[size].padding,
        'relative overflow-hidden border-2 transition-all duration-300',
        trafficLightData.borderColor,
        trafficLightData.bgColor,
        'backdrop-blur-sm'
      )}>
        {/* Traffic Light Indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-5 lg:right-5 text-2xl sm:text-3xl lg:text-4xl z-10"
          aria-label={`Status: ${trafficLight} indicator`}
        >
          {trafficLightData.emoji}
        </motion.div>

        {/* Header */}
        <Flex justifyContent="start" alignItems="center" className="mb-3 lg:mb-4">
          {icon && (
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={clsx(trafficLightData.textColor, 'mr-3')}
            >
              {icon}
            </motion.div>
          )}
          <div className="flex-1">
            <Text className={clsx(
              'font-semibold text-base sm:text-lg lg:text-xl',
              trafficLightData.textColor
            )}>
              {title}
            </Text>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowExplanation(!showExplanation)}
            className={clsx(
              'min-w-[44px] min-h-[44px] p-3 rounded-full transition-colors flex items-center justify-center',
              showExplanation 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
            aria-label="Toggle detailed explanation"
            aria-expanded={showExplanation}
          >
            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </motion.button>
        </Flex>

        {/* Main Value */}
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-4"
        >
          <Metric className={clsx(
            sizeClasses[size].metric,
            'font-bold',
            trafficLightData.textColor
          )}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </Metric>
        </motion.div>

        {/* Change Indicator */}
        {change !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-4"
          >
            <Flex alignItems="center" className="space-x-2">
              <BadgeDelta
                deltaType={getDeltaType(change)}
                size="sm"
                className="backdrop-blur-sm"
              >
                <Flex alignItems="center" className="space-x-1">
                  {getTrendIcon()}
                  <span>
                    {Math.abs(change).toFixed(2)}
                    {changeType === 'percentage' ? '%' : 
                     changeType === 'basis-points' ? ' bps' : ''}
                  </span>
                </Flex>
              </BadgeDelta>
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                vs previous
              </Text>
            </Flex>
          </motion.div>
        )}

        {/* Current Meaning - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className={clsx(
            'p-3 rounded-lg mb-4',
            'bg-white/50 dark:bg-gray-800/50',
            'border border-gray-200/50 dark:border-gray-700/50'
          )}
        >
          <div className="flex items-start space-x-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              {trafficLight === 'green' ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : trafficLight === 'yellow' ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
            </motion.div>
            <div>
              <Text className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                What this means right now:
              </Text>
              <Text className="text-sm text-gray-700 dark:text-gray-300">
                {explanation.currentMeaning}
              </Text>
            </div>
          </div>
        </motion.div>

        {/* Expandable Educational Content */}
        <motion.div
          initial={false}
          animate={{
            height: showExplanation ? 'auto' : 0,
            opacity: showExplanation ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="space-y-4">
            {/* What It Is */}
            <div className={clsx(
              'p-4 rounded-lg',
              'bg-blue-50/80 dark:bg-blue-950/80',
              'border border-blue-200/50 dark:border-blue-800/50'
            )}>
              <Text className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                What is {title}?
              </Text>
              <Text className="text-sm text-blue-800 dark:text-blue-200">
                {explanation.whatItIs}
              </Text>
            </div>

            {/* Why It Matters */}
            <div className={clsx(
              'p-4 rounded-lg',
              'bg-purple-50/80 dark:bg-purple-950/80',
              'border border-purple-200/50 dark:border-purple-800/50'
            )}>
              <Text className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Why does this matter?
              </Text>
              <Text className="text-sm text-purple-800 dark:text-purple-200">
                {explanation.whyItMatters}
              </Text>
            </div>

            {/* Historical Context */}
            {explanation.historicalContext && (
              <div className={clsx(
                'p-4 rounded-lg',
                'bg-gray-50/80 dark:bg-gray-900/80',
                'border border-gray-200/50 dark:border-gray-700/50'
              )}>
                <Text className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Historical Context
                </Text>
                <Text className="text-sm text-gray-700 dark:text-gray-300">
                  {explanation.historicalContext}
                </Text>
              </div>
            )}
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
}